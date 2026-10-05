//! The OS-independent half of app tracking: the loop that owns the [`Tracker`], decides when to
//! look at the idle time, batches finished sessions into the database and starts or stops the
//! OS source live as the settings change.
//!
//! The only OS-specific parts are behind [`Platform`] (a foreground-window source and an idle
//! clock), implemented by the shell. Everything here is tested with a fake one.
//!
//! Timers (ADR-019): there are exactly two, and each is armed only when it has work.
//! * **Idle look**, every [`POLL_INTERVAL_MS`], only while tracking is on and a trackable app is
//!   in front (also while idle, to see the person come back).
//! * **Flush**, one [`FLUSH_INTERVAL`] after the first unsaved session, only while one is waiting.
//!
//! With tracking off, or nothing in front, the loop parks on the bus and the OS source.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, PoisonError};
use std::time::Duration;

use tokio::sync::mpsc::{self, UnboundedSender};
use tokio::task::JoinHandle;
use tokio::time::Instant;

use crate::bus::{EventBus, Recv, Subscriber};
use crate::clock::Clock;
use crate::error::Result;
use crate::events::Event;
use crate::settings::SettingsKey;
use crate::settings_service::SettingsService;
use crate::usage::{TrackEvent, Tracker, UsageRecord, UsageService, POLL_INTERVAL_MS};

/// Finished sessions are written in one batch this long after the first one is waiting.
pub const FLUSH_INTERVAL: Duration = Duration::from_secs(60);
/// If the database keeps failing, stop remembering sessions beyond this many.
const MAX_PENDING: usize = 1000;

/// What the operating system provides.
pub trait Platform: Send + Sync + 'static {
    /// Start reporting which app is in front: the executable name, or `None` when nothing
    /// trackable is. The current foreground app must be reported right away, then every change.
    /// Must not block for long and must not poll.
    fn start(&self, sink: mpsc::UnboundedSender<Option<String>>) -> Result<()>;
    /// Stop reporting. Safe to call when not started.
    fn stop(&self);
    /// Milliseconds since the last keyboard or mouse input, if the OS can say.
    fn idle_ms(&self) -> Option<u64>;
}

#[derive(Clone, Copy)]
pub struct Timing {
    pub poll: Duration,
    pub flush: Duration,
}

impl Default for Timing {
    fn default() -> Self {
        Self {
            poll: Duration::from_millis(POLL_INTERVAL_MS),
            flush: FLUSH_INTERVAL,
        }
    }
}

pub struct Collector {
    running: Arc<AtomicBool>,
    task: Mutex<Option<JoinHandle<()>>>,
}

impl Collector {
    /// Start the collector task. It reads `tracking.apps` straight away and then follows
    /// `SettingChanged`. Subscribes to the bus before returning, so no change is missed.
    pub fn spawn<P: Platform>(
        platform: Arc<P>,
        usage: Arc<UsageService>,
        settings: Arc<SettingsService>,
        clock: Arc<dyn Clock>,
        bus: &EventBus,
    ) -> Self {
        Self::spawn_with(platform, usage, settings, clock, bus, Timing::default())
    }

    pub fn spawn_with<P: Platform>(
        platform: Arc<P>,
        usage: Arc<UsageService>,
        settings: Arc<SettingsService>,
        clock: Arc<dyn Clock>,
        bus: &EventBus,
        timing: Timing,
    ) -> Self {
        let running = Arc::new(AtomicBool::new(false));
        let worker = Worker {
            platform,
            usage,
            settings,
            clock,
            timing,
            running: running.clone(),
            events: bus.subscribe(),
            tracker: Tracker::default(),
            wanted: false,
            exclude: Vec::new(),
            pending: Vec::new(),
            flush_at: None,
            poll_at: None,
        };
        Self {
            running,
            task: Mutex::new(Some(tokio::spawn(worker.run()))),
        }
    }

    /// Whether the OS source is running right now.
    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::Relaxed)
    }

    /// Wait (briefly) for the task to finish after `AppShuttingDown`: it closes the open
    /// session and writes everything before it ends. Call before shutting the database down.
    pub async fn finish(&self) {
        let task = self
            .task
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .take();
        if let Some(task) = task {
            let _ = tokio::time::timeout(Duration::from_secs(3), task).await;
        }
    }
}

struct Worker<P: Platform> {
    platform: Arc<P>,
    usage: Arc<UsageService>,
    settings: Arc<SettingsService>,
    clock: Arc<dyn Clock>,
    timing: Timing,
    running: Arc<AtomicBool>,
    events: Subscriber,
    tracker: Tracker,
    /// `tracking.apps`.
    wanted: bool,
    exclude: Vec<String>,
    pending: Vec<UsageRecord>,
    flush_at: Option<Instant>,
    poll_at: Option<Instant>,
}

async fn sleep_until_opt(at: Option<Instant>) {
    match at {
        Some(at) => tokio::time::sleep_until(at).await,
        None => std::future::pending::<()>().await,
    }
}

impl<P: Platform> Worker<P> {
    async fn run(mut self) {
        let (tx, mut rx) = mpsc::unbounded_channel::<Option<String>>();
        self.reload_settings(&tx).await;
        loop {
            let (poll_at, flush_at) = (self.poll_at, self.flush_at);
            tokio::select! {
                event = self.events.recv() => match event {
                    Recv::Event(Event::AppShuttingDown { .. }) | Recv::Closed => {
                        self.stop().await;
                        break;
                    }
                    Recv::Event(Event::SettingChanged { key, value, .. }) => {
                        self.setting_changed(&key, &value, &tx).await;
                    }
                    Recv::Resync { .. } => self.reload_settings(&tx).await,
                    Recv::Event(_) => {}
                },
                Some(app) = rx.recv() => {
                    if self.running.load(Ordering::Relaxed) {
                        let at = self.clock.now_ms();
                        self.feed(TrackEvent::Focus { at, app });
                    }
                }
                () = sleep_until_opt(poll_at) => self.look(),
                () = sleep_until_opt(flush_at) => self.flush().await,
            }
            self.rearm();
        }
    }

    /// Timers exist only while there is something for them to do.
    fn rearm(&mut self) {
        let watching = self.running.load(Ordering::Relaxed) && self.tracker.is_watching();
        if !watching {
            self.poll_at = None;
        } else if self.poll_at.is_none() {
            self.poll_at = Some(Instant::now() + self.timing.poll);
        }
        if self.pending.is_empty() {
            self.flush_at = None;
        } else if self.flush_at.is_none() {
            self.flush_at = Some(Instant::now() + self.timing.flush);
        }
    }

    fn feed(&mut self, event: TrackEvent) {
        let sessions = self.tracker.handle(event);
        self.keep(sessions);
    }

    fn keep(&mut self, sessions: Vec<crate::usage::AppSession>) {
        self.pending
            .extend(sessions.into_iter().map(UsageRecord::App));
        if self.pending.len() > MAX_PENDING {
            let excess = self.pending.len() - MAX_PENDING;
            self.pending.drain(..excess);
        }
    }

    /// The periodic idle look.
    fn look(&mut self) {
        self.poll_at = None; // `rearm` sets the next one
        if let Some(idle_ms) = self.platform.idle_ms() {
            let sessions = self.tracker.poll(self.clock.now_ms(), idle_ms);
            self.keep(sessions);
        }
    }

    async fn flush(&mut self) {
        self.flush_at = None;
        if self.pending.is_empty() {
            return;
        }
        let batch = std::mem::take(&mut self.pending);
        if let Err(error) = self.usage.record_many(batch.clone()).await {
            tracing::warn!(code = ?error.code, "couldn't save app time; it will be retried");
            self.pending = batch;
        }
    }

    async fn reload_settings(&mut self, tx: &UnboundedSender<Option<String>>) {
        let Ok(all) = self.settings.get_all().await else {
            return;
        };
        if let Some(list) = all
            .get(SettingsKey::TrackingExcludeApps.as_str())
            .and_then(exclude_list)
        {
            self.set_exclude(list);
        }
        let on = all
            .get(SettingsKey::TrackingApps.as_str())
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false);
        self.set_wanted(on, tx).await;
    }

    async fn setting_changed(
        &mut self,
        key: &str,
        value: &serde_json::Value,
        tx: &UnboundedSender<Option<String>>,
    ) {
        if key == SettingsKey::TrackingApps.as_str() {
            self.set_wanted(value.as_bool().unwrap_or(false), tx).await;
        } else if key == SettingsKey::TrackingExcludeApps.as_str() {
            if let Some(list) = exclude_list(value) {
                self.set_exclude(list);
            }
        }
    }

    fn set_exclude(&mut self, list: Vec<String>) {
        if list == self.exclude {
            return;
        }
        let sessions = self.tracker.set_excluded(self.clock.now_ms(), &list);
        self.exclude = list;
        self.keep(sessions);
    }

    async fn set_wanted(&mut self, on: bool, tx: &UnboundedSender<Option<String>>) {
        self.wanted = on;
        let running = self.running.load(Ordering::Relaxed);
        if on && !running {
            self.tracker = Tracker::new(&self.exclude);
            match self.platform.start(tx.clone()) {
                Ok(()) => self.running.store(true, Ordering::Relaxed),
                Err(error) => {
                    tracing::warn!(code = ?error.code, "couldn't start app tracking");
                }
            }
        } else if !on && running {
            self.stop().await;
        }
    }

    /// Close the open session, stop the OS source and write everything.
    async fn stop(&mut self) {
        if self.running.swap(false, Ordering::Relaxed) {
            self.platform.stop();
        }
        let at = self.clock.now_ms();
        self.feed(TrackEvent::Shutdown { at });
        self.flush().await;
    }
}

fn exclude_list(value: &serde_json::Value) -> Option<Vec<String>> {
    value
        .as_array()?
        .iter()
        .map(|v| v.as_str().map(str::to_owned))
        .collect()
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::AtomicUsize;

    use chrono_tz::Tz;
    use serde_json::json;

    use super::*;
    use crate::clock::FakeClock;
    use crate::db::Database;
    use crate::error::AppError;
    use crate::usage::TimeRange;

    const T0: i64 = 1_790_985_600_000;
    const S: i64 = 1_000;
    const MIN: i64 = 60 * S;

    #[derive(Default)]
    struct FakePlatform {
        sink: Mutex<Option<UnboundedSender<Option<String>>>>,
        starts: AtomicUsize,
        stops: AtomicUsize,
        idle: Mutex<Option<u64>>,
        fail_start: AtomicBool,
    }

    impl FakePlatform {
        fn focus(&self, app: Option<&str>) {
            let sink = self.sink.lock().unwrap();
            sink.as_ref()
                .expect("started")
                .send(app.map(str::to_owned))
                .unwrap();
        }
        fn set_idle(&self, ms: u64) {
            *self.idle.lock().unwrap() = Some(ms);
        }
    }

    impl Platform for FakePlatform {
        fn start(&self, sink: UnboundedSender<Option<String>>) -> Result<()> {
            if self.fail_start.load(Ordering::Relaxed) {
                return Err(AppError::internal("no hook"));
            }
            self.starts.fetch_add(1, Ordering::SeqCst);
            *self.sink.lock().unwrap() = Some(sink);
            Ok(())
        }
        fn stop(&self) {
            self.stops.fetch_add(1, Ordering::SeqCst);
            *self.sink.lock().unwrap() = None;
        }
        fn idle_ms(&self) -> Option<u64> {
            *self.idle.lock().unwrap()
        }
    }

    struct Fixture {
        _dir: tempfile::TempDir,
        bus: EventBus,
        clock: FakeClock,
        db: Arc<Database>,
        usage: Arc<UsageService>,
        settings: Arc<SettingsService>,
        platform: Arc<FakePlatform>,
    }

    fn fixture() -> Fixture {
        let dir = tempfile::tempdir().unwrap();
        let bus = EventBus::default();
        let db = Arc::new(Database::open(&dir.path().join("t.db"), bus.clone()).unwrap());
        let clock = FakeClock::new(T0, Tz::UTC);
        Fixture {
            usage: Arc::new(UsageService::new(db.clone(), Arc::new(clock.clone()))),
            settings: Arc::new(SettingsService::new(db.clone(), Arc::new(clock.clone()))),
            platform: Arc::new(FakePlatform::default()),
            _dir: dir,
            bus,
            clock,
            db,
        }
    }

    fn quick() -> Timing {
        Timing {
            poll: Duration::from_millis(15),
            flush: Duration::from_millis(30),
        }
    }

    impl Fixture {
        fn collector(&self, timing: Timing) -> Collector {
            Collector::spawn_with(
                self.platform.clone(),
                self.usage.clone(),
                self.settings.clone(),
                Arc::new(self.clock.clone()),
                &self.bus,
                timing,
            )
        }

        async fn spans(&self, app: &str) -> Vec<TimeRange> {
            self.usage
                .app_sessions(app, 0, T0 + 100 * 3_600_000)
                .await
                .unwrap()
        }
    }

    /// Give the collector task time to handle what was just sent (it stamps events on receipt).
    async fn settle() {
        tokio::time::sleep(Duration::from_millis(40)).await;
    }

    async fn eventually<F: std::future::Future<Output = bool>>(mut check: impl FnMut() -> F) {
        for _ in 0..500 {
            if check().await {
                return;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
        panic!("condition not reached in time");
    }

    async fn running(c: &Collector, want: bool) {
        eventually(|| async { c.is_running() == want }).await;
    }

    #[tokio::test]
    async fn tracking_is_off_by_default_and_nothing_starts() {
        let f = fixture();
        let c = f.collector(quick());
        tokio::time::sleep(Duration::from_millis(60)).await;
        assert!(!c.is_running());
        assert_eq!(f.platform.starts.load(Ordering::SeqCst), 0);
    }

    #[tokio::test]
    async fn turning_tracking_on_starts_the_source_and_off_stops_it_and_saves_the_open_session() {
        let f = fixture();
        let c = f.collector(Timing::default());
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        running(&c, true).await;
        assert_eq!(f.platform.starts.load(Ordering::SeqCst), 1);

        f.platform.focus(Some("Code.exe"));
        settle().await;
        f.clock.advance_ms(10 * MIN);
        f.platform.focus(Some("chrome.exe"));
        settle().await;
        f.clock.advance_ms(5 * MIN);
        // Nothing is written until the batch flushes or tracking stops.
        f.settings.set("tracking.apps", json!(false)).await.unwrap();
        running(&c, false).await;
        eventually(|| async { f.spans("Google Chrome").await.len() == 1 }).await;

        assert_eq!(f.platform.stops.load(Ordering::SeqCst), 1);
        assert_eq!(
            f.spans("VS Code").await,
            vec![TimeRange {
                started_at: T0,
                ended_at: T0 + 10 * MIN
            }]
        );
        assert_eq!(
            f.spans("Google Chrome").await,
            vec![TimeRange {
                started_at: T0 + 10 * MIN,
                ended_at: T0 + 15 * MIN
            }]
        );
    }

    #[tokio::test]
    async fn focus_reports_after_tracking_is_off_record_nothing() {
        let f = fixture();
        let c = f.collector(quick());
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        running(&c, true).await;
        let sink = f.platform.sink.lock().unwrap().clone().unwrap();
        f.settings.set("tracking.apps", json!(false)).await.unwrap();
        running(&c, false).await;
        f.clock.advance_ms(MIN);
        let _ = sink.send(Some("Code.exe".into())); // a straggler from the OS thread
        f.clock.advance_ms(MIN);
        tokio::time::sleep(Duration::from_millis(80)).await;
        let n: i64 =
            f.db.read(|c| Ok(c.query_row("SELECT COUNT(*) FROM app_sessions", [], |r| r.get(0))?))
                .await
                .unwrap();
        assert_eq!(n, 0);
    }

    #[tokio::test]
    async fn the_setting_is_read_at_startup() {
        let f = fixture();
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        let c = f.collector(quick());
        running(&c, true).await;
    }

    #[tokio::test]
    async fn quitting_closes_the_open_session_and_writes_it_before_finish_returns() {
        let f = fixture();
        let c = f.collector(Timing::default());
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        running(&c, true).await;
        f.platform.focus(Some("Slack.exe"));
        settle().await;
        f.clock.advance_ms(3 * MIN);
        f.bus.publish(Event::AppShuttingDown {
            at: f.clock.now_ms(),
        });
        c.finish().await;
        assert!(!c.is_running());
        assert_eq!(
            f.spans("Slack").await,
            vec![TimeRange {
                started_at: T0,
                ended_at: T0 + 3 * MIN
            }]
        );
    }

    #[tokio::test]
    async fn the_idle_look_closes_the_session_at_the_last_input() {
        let f = fixture();
        let c = f.collector(quick());
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        running(&c, true).await;
        f.platform.focus(Some("Code.exe"));
        f.platform.set_idle(0);
        settle().await;
        // Input stops one minute in; the machine is looked at every minute from then on.
        for minute in 1..=7u64 {
            f.clock.advance_ms(MIN);
            f.platform.set_idle(minute.saturating_sub(1) * MIN as u64);
            settle().await;
        }
        eventually(|| async { f.spans("VS Code").await.len() == 1 }).await;
        assert_eq!(
            f.spans("VS Code").await,
            vec![TimeRange {
                started_at: T0,
                ended_at: T0 + MIN
            }]
        );
    }

    #[tokio::test]
    async fn the_exclude_list_applies_live() {
        let f = fixture();
        let c = f.collector(quick());
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        running(&c, true).await;
        f.platform.focus(Some("KeePass.exe"));
        settle().await;
        f.clock.advance_ms(MIN);
        f.settings
            .set("tracking.exclude_apps", json!(["keepass"]))
            .await
            .unwrap();
        // The app in front is excluded from now on; what it did before is kept.
        eventually(|| async { f.spans("KeePass").await.len() == 1 }).await;
        f.clock.advance_ms(MIN);
        f.platform.focus(Some("keepass.exe"));
        f.platform.focus(Some("Code.exe"));
        settle().await;
        f.clock.advance_ms(MIN);
        f.platform.focus(None);
        eventually(|| async { f.spans("VS Code").await.len() == 1 }).await;
        assert_eq!(f.spans("KeePass").await.len(), 1);
    }

    #[tokio::test]
    async fn a_source_that_cannot_start_leaves_the_collector_not_running() {
        let f = fixture();
        f.platform.fail_start.store(true, Ordering::Relaxed);
        let c = f.collector(quick());
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        tokio::time::sleep(Duration::from_millis(60)).await;
        assert!(!c.is_running());
        // Turning it off and on again retries.
        f.platform.fail_start.store(false, Ordering::Relaxed);
        f.settings.set("tracking.apps", json!(false)).await.unwrap();
        f.settings.set("tracking.apps", json!(true)).await.unwrap();
        running(&c, true).await;
    }

    #[test]
    fn this_module_arms_timers_only_through_the_two_documented_deadlines() {
        let src = include_str!("usage_collector.rs");
        let production = src.split("#[cfg(test)]").next().unwrap();
        for banned in [
            "interval(",
            "thread::sleep",
            "loop {\n        tokio::time::sleep",
        ] {
            assert!(!production.contains(banned), "{banned}");
        }
    }
}
