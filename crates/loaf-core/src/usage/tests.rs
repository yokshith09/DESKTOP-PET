use chrono::NaiveDate;
use serde_json::json;

use super::*;
use crate::bus::Subscriber;
use crate::clock::FakeClock;

const S: i64 = 1_000;
const MIN: i64 = 60 * S;
const HOUR: i64 = 60 * MIN;
/// 2026-10-03 00:00:00 UTC.
const T0: i64 = 1_790_985_600_000;

fn focus(at: i64, app: &str) -> TrackEvent {
    TrackEvent::Focus {
        at,
        app: Some(app.to_owned()),
    }
}

fn nothing(at: i64) -> TrackEvent {
    TrackEvent::Focus { at, app: None }
}

fn run(tracker: &mut Tracker, events: Vec<TrackEvent>) -> Vec<AppSession> {
    events.into_iter().flat_map(|e| tracker.handle(e)).collect()
}

fn brief(sessions: &[AppSession]) -> Vec<(&str, i64, i64)> {
    sessions
        .iter()
        .map(|s| (s.app.as_str(), s.started_at, s.ended_at))
        .collect()
}

// ---- identity -------------------------------------------------------------------------------

#[test]
fn well_known_executables_get_friendly_names() {
    for (exe, name) in [
        ("chrome.exe", "Google Chrome"),
        ("msedge.exe", "Microsoft Edge"),
        ("Code.exe", "VS Code"),
        ("C:\\Program Files\\Mozilla Firefox\\firefox.exe", "Firefox"),
        ("Slack.EXE", "Slack"),
        ("Google Chrome", "Google Chrome"),
    ] {
        assert_eq!(display_name(exe), name, "{exe}");
    }
}

#[test]
fn unknown_executables_lose_their_extension_and_are_title_cased() {
    assert_eq!(display_name("mycoolapp.exe"), "Mycoolapp");
    assert_eq!(display_name("my_cool-app.exe"), "My Cool App");
    assert_eq!(display_name("GitKraken.exe"), "GitKraken");
    assert_eq!(display_name("VLCplayer"), "VLCplayer");
    assert_eq!(display_name("tool"), "Tool");
    assert_eq!(display_name(".hidden"), ".hidden");
    assert_eq!(display_name("x".repeat(300).as_str()).chars().count(), 100);
}

#[test]
fn categories_follow_the_default_taxonomy() {
    for (app, category) in [
        ("Code.exe", "Coding"),
        ("WindowsTerminal.exe", "Coding"),
        ("idea64.exe", "Coding"),
        ("Android Studio", "Coding"),
        ("figma.exe", "Design"),
        ("chrome.exe", "Research"),
        ("firefox.exe", "Research"),
        ("Slack.exe", "Communication"),
        ("ms-teams.exe", "Communication"),
        ("Discord.exe", "Communication"),
        ("Zoom.exe", "Communication"),
        ("OUTLOOK.EXE", "Communication"),
        ("Notion.exe", "Notes"),
        ("Obsidian.exe", "Notes"),
        ("WINWORD.EXE", "Notes"),
        ("Spotify.exe", "Entertainment"),
        ("steam.exe", "Entertainment"),
        ("netflix.exe", "Entertainment"),
        ("somethingelse.exe", "Other"),
    ] {
        assert_eq!(category_for(app), category, "{app}");
        assert!(CATEGORIES.contains(&category_for(app)));
    }
}

#[test]
fn browsers_are_recognised() {
    for exe in [
        "chrome.exe",
        "msedge.exe",
        "firefox.exe",
        "brave.exe",
        "opera.exe",
        "vivaldi.exe",
        "Safari",
        "arc.exe",
    ] {
        assert!(is_browser(exe), "{exe}");
    }
    assert!(!is_browser("Code.exe"));
    assert!(!is_browser("slack.exe"));
}

#[test]
fn site_categories_cover_subdomains() {
    assert_eq!(category_for_domain("github.com"), "Coding");
    assert_eq!(category_for_domain("gist.github.com"), "Coding");
    assert_eq!(category_for_domain("notgithub.com"), "Other");
    assert_eq!(category_for_domain("youtube.com"), "Entertainment");
}

#[test]
fn hosts_are_lower_cased_and_urls_are_refused() {
    assert_eq!(normalize_host("  GitHub.COM. ").unwrap(), "github.com");
    assert_eq!(normalize_host("localhost").unwrap(), "localhost");
    assert_eq!(normalize_host("192.168.0.1").unwrap(), "192.168.0.1");
    assert_eq!(normalize_host("bücher.de").unwrap(), "bücher.de");
    for bad in [
        "",
        "   ",
        "https://example.com",
        "example.com/path",
        "example.com/",
        "example.com?q=1",
        "example.com#frag",
        "example.com:8080",
        "user@example.com",
        "user:pw@example.com",
        "exa mple.com",
        "a..b",
        ".com",
        "ex\u{0}ample.com",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "[::1]",
    ] {
        let e = normalize_host(bad).unwrap_err();
        assert_eq!(e.field.as_deref(), Some("domain"), "{bad:?}");
    }
    assert!(normalize_host(&"a".repeat(254)).is_err());
}

// ---- the tracker ----------------------------------------------------------------------------

#[test]
fn changing_focus_closes_the_previous_session_and_opens_the_next() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            focus(T0 + 10 * S, "chrome.exe"),
            focus(T0 + 25 * S, "Code.exe"),
            TrackEvent::Shutdown { at: T0 + 40 * S },
        ],
    );
    assert_eq!(
        brief(&done),
        vec![
            ("VS Code", T0, T0 + 10 * S),
            ("Google Chrome", T0 + 10 * S, T0 + 25 * S),
            ("VS Code", T0 + 25 * S, T0 + 40 * S),
        ]
    );
    assert_eq!(done[0].category, "Coding");
    assert!(!done[0].is_browser);
    assert!(done[1].is_browser);
}

#[test]
fn refocusing_the_same_app_is_one_continuous_session() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "chrome.exe"),
            focus(T0 + 10 * S, "CHROME.EXE"),
            focus(T0 + 20 * S, "C:\\x\\chrome.exe"),
            TrackEvent::Shutdown { at: T0 + 30 * S },
        ],
    );
    assert_eq!(brief(&done), vec![("Google Chrome", T0, T0 + 30 * S)]);
}

#[test]
fn going_idle_ends_the_session_at_the_idle_start() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            TrackEvent::Idle { at: T0 + 20 * S },
            // Focus churn while away must not open anything.
            focus(T0 + 30 * S, "Slack.exe"),
            TrackEvent::Shutdown { at: T0 + HOUR },
        ],
    );
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 20 * S)]);
}

#[test]
fn coming_back_starts_a_new_session_in_whatever_is_in_front() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            TrackEvent::Idle { at: T0 + 20 * S },
            focus(T0 + 30 * S, "Slack.exe"),
            TrackEvent::Active { at: T0 + 10 * MIN },
            TrackEvent::Shutdown { at: T0 + 11 * MIN },
        ],
    );
    assert_eq!(
        brief(&done),
        vec![
            ("VS Code", T0, T0 + 20 * S),
            ("Slack", T0 + 10 * MIN, T0 + 11 * MIN)
        ]
    );
}

#[test]
fn active_without_idle_and_idle_twice_do_nothing_extra() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            TrackEvent::Active { at: T0 + 5 * S },
            TrackEvent::Idle { at: T0 + 20 * S },
            TrackEvent::Idle { at: T0 + 25 * S },
            TrackEvent::Active { at: T0 + 30 * S },
            TrackEvent::Active { at: T0 + 31 * S },
            TrackEvent::Shutdown { at: T0 + 40 * S },
        ],
    );
    assert_eq!(
        brief(&done),
        vec![
            ("VS Code", T0, T0 + 20 * S),
            ("VS Code", T0 + 30 * S, T0 + 40 * S)
        ]
    );
}

#[test]
fn sessions_under_two_seconds_are_dropped_and_two_seconds_is_kept() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            focus(T0 + 1_999, "chrome.exe"),
            focus(T0 + 1_999 + 2_000, "Slack.exe"),
            TrackEvent::Shutdown { at: T0 + 10 * S },
        ],
    );
    assert_eq!(
        brief(&done),
        vec![
            ("Google Chrome", T0 + 1_999, T0 + 3_999),
            ("Slack", T0 + 3_999, T0 + 10 * S)
        ]
    );
}

#[test]
fn a_session_longer_than_twelve_hours_is_clamped() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            TrackEvent::Shutdown { at: T0 + 30 * HOUR },
        ],
    );
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 12 * HOUR)]);
}

#[test]
fn shutdown_closes_the_open_session_and_a_second_shutdown_adds_nothing() {
    let mut t = Tracker::default();
    let mut done = run(&mut t, vec![focus(T0, "Code.exe")]);
    assert!(done.is_empty());
    assert!(t.is_watching());
    done.extend(t.handle(TrackEvent::Shutdown { at: T0 + 5 * S }));
    done.extend(t.handle(TrackEvent::Shutdown { at: T0 + 9 * S }));
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 5 * S)]);
    assert!(!t.is_watching());
}

#[test]
fn nothing_in_front_ends_the_session() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            nothing(T0 + 10 * S),
            focus(T0 + 20 * S, "Code.exe"),
            TrackEvent::Shutdown { at: T0 + 30 * S },
        ],
    );
    assert_eq!(
        brief(&done),
        vec![
            ("VS Code", T0, T0 + 10 * S),
            ("VS Code", T0 + 20 * S, T0 + 30 * S)
        ]
    );
}

#[test]
fn excluded_apps_are_never_recorded_whatever_the_case_or_spelling() {
    let list = vec![
        "KeePass.exe".to_owned(),
        "  slack ".to_owned(),
        "google chrome".to_owned(),
    ];
    let mut t = Tracker::new(&list);
    let done = run(
        &mut t,
        vec![
            focus(T0, "keepass.EXE"),
            focus(T0 + 10 * S, "Slack.exe"),
            focus(T0 + 20 * S, "chrome.exe"),
            focus(T0 + 30 * S, "Code.exe"),
            focus(T0 + 40 * S, "KEEPASS"),
            TrackEvent::Shutdown { at: T0 + 50 * S },
        ],
    );
    assert_eq!(brief(&done), vec![("VS Code", T0 + 30 * S, T0 + 40 * S)]);
}

#[test]
fn excluding_the_app_in_front_ends_its_session_immediately() {
    let mut t = Tracker::default();
    assert!(t.handle(focus(T0, "Code.exe")).is_empty());
    let done = t.set_excluded(T0 + 8 * S, &["code".to_owned()]);
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 8 * S)]);
    assert!(!t.is_watching());
    assert!(t.handle(focus(T0 + 9 * S, "Code.exe")).is_empty());
    assert!(t.handle(TrackEvent::Shutdown { at: T0 + HOUR }).is_empty());
}

#[test]
fn excluding_some_other_app_leaves_the_session_alone() {
    let mut t = Tracker::default();
    t.handle(focus(T0, "Code.exe"));
    assert!(t.set_excluded(T0 + 8 * S, &["slack".to_owned()]).is_empty());
    let done = t.handle(TrackEvent::Shutdown { at: T0 + 20 * S });
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 20 * S)]);
}

#[test]
fn lock_screen_and_start_menu_are_not_tracked() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0, "Code.exe"),
            focus(T0 + 10 * S, "LockApp.exe"),
            TrackEvent::Shutdown { at: T0 + 20 * S },
        ],
    );
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 10 * S)]);
}

#[test]
fn timestamps_never_go_backwards() {
    let mut t = Tracker::default();
    let done = run(
        &mut t,
        vec![
            focus(T0 + 10 * S, "Code.exe"),
            focus(T0, "chrome.exe"), // earlier than the previous event: treated as "now"
            TrackEvent::Shutdown { at: T0 + 30 * S },
        ],
    );
    assert_eq!(
        brief(&done),
        vec![("Google Chrome", T0 + 10 * S, T0 + 30 * S)]
    );
}

#[test]
fn an_idle_start_before_the_session_began_leaves_nothing() {
    let mut t = Tracker::default();
    t.handle(focus(T0, "Code.exe"));
    // Input stopped before this window even came to the front.
    let done = t.handle(TrackEvent::Idle { at: T0 - 5 * MIN });
    assert!(done.is_empty());
}

#[test]
fn the_tracker_is_deterministic() {
    let events = vec![
        focus(T0, "Code.exe"),
        focus(T0 + 7 * S, "chrome.exe"),
        TrackEvent::Idle { at: T0 + 30 * S },
        TrackEvent::Active { at: T0 + 5 * MIN },
        focus(T0 + 6 * MIN, "Slack.exe"),
        TrackEvent::Shutdown { at: T0 + 7 * MIN },
    ];
    let a = run(&mut Tracker::default(), events.clone());
    let b = run(&mut Tracker::default(), events);
    assert_eq!(a, b);
    assert_eq!(a.len(), 4);
}

// ---- idle polling ---------------------------------------------------------------------------

#[test]
fn polling_ends_the_session_when_input_stopped_not_when_the_poll_noticed() {
    let mut t = Tracker::default();
    t.handle(focus(T0, "Code.exe"));
    // Looks every minute; input stopped at T0 + 2 min.
    let mut done = Vec::new();
    for minute in 1..=8 {
        let now = T0 + minute * MIN;
        let idle = (now - (T0 + 2 * MIN)).max(0) as u64;
        done.extend(t.poll(now, idle));
    }
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + 2 * MIN)]);
    assert!(t.is_idle());
    assert!(t.is_watching(), "still watching so a return can be seen");
}

#[test]
fn polling_notices_the_return_and_backdates_it_to_the_first_input() {
    let mut t = Tracker::default();
    t.handle(focus(T0, "Code.exe"));
    let mut done = t.poll(T0 + 6 * MIN, (6 * MIN) as u64); // idle since T0
    assert!(
        done.is_empty(),
        "closed at the idle start, which was the session start"
    );
    assert!(t.is_idle());
    done.extend(t.poll(T0 + 20 * MIN, (45 * S) as u64)); // typed at T0 + 19:15
    done.extend(t.handle(TrackEvent::Shutdown { at: T0 + 30 * MIN }));
    assert_eq!(
        brief(&done),
        vec![("VS Code", T0 + 19 * MIN + 15 * S, T0 + 30 * MIN)]
    );
}

#[test]
fn a_long_gap_between_looks_means_the_machine_slept() {
    let mut t = Tracker::default();
    t.handle(focus(T0, "Code.exe"));
    assert!(t.poll(T0 + MIN, 5 * S as u64).is_empty());
    // Eight hours later the clock jumps; the idle counter did not run during sleep.
    let wake = T0 + MIN + 8 * HOUR;
    let done = t.poll(wake, 3 * S as u64);
    assert_eq!(brief(&done), vec![("VS Code", T0, T0 + MIN)]);
    assert!(!t.is_idle(), "typing again right after waking");
    let done = t.handle(TrackEvent::Shutdown { at: wake + 10 * S });
    assert_eq!(brief(&done), vec![("VS Code", wake - 3 * S, wake + 10 * S)]);
}

#[test]
fn polling_with_nothing_in_front_does_nothing() {
    let mut t = Tracker::default();
    assert!(t.poll(T0, 0).is_empty());
    assert!(!t.is_watching());
}

// ---- persistence ----------------------------------------------------------------------------

struct Fixture {
    _dir: tempfile::TempDir,
    clock: FakeClock,
    bus: EventBus,
    db: Arc<Database>,
    usage: Arc<UsageService>,
}

fn fixture() -> Fixture {
    let dir = tempfile::tempdir().unwrap();
    let bus = EventBus::default();
    let db = Arc::new(Database::open(&dir.path().join("t.db"), bus.clone()).unwrap());
    let clock = FakeClock::new(T0 + 24 * HOUR, Tz::UTC);
    let usage = Arc::new(UsageService::new(db.clone(), Arc::new(clock.clone())));
    Fixture {
        _dir: dir,
        clock,
        bus,
        db,
        usage,
    }
}

fn app_session(app: &str, category: &str, is_browser: bool, from: i64, to: i64) -> AppSession {
    AppSession {
        app: app.into(),
        category: category.into(),
        is_browser,
        started_at: from,
        ended_at: to,
    }
}

fn code(from: i64, to: i64) -> AppSession {
    app_session("VS Code", "Coding", false, from, to)
}

/// Everything already published (a write returns after its events are on the bus).
async fn drain(sub: &mut Subscriber) -> Vec<Event> {
    let mut out = Vec::new();
    while let Ok(Recv::Event(e)) = tokio::time::timeout(std::time::Duration::ZERO, sub.recv()).await
    {
        out.push(e);
    }
    out
}

async fn count(db: &Database, table: &'static str) -> i64 {
    db.read(move |c| Ok(c.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0))?))
        .await
        .unwrap()
}

#[tokio::test]
async fn an_app_session_round_trips() {
    let f = fixture();
    assert!(f
        .usage
        .record_app_session(code(T0, T0 + 10 * MIN))
        .await
        .unwrap());
    let summary = f.usage.summary(T0, T0 + 24 * HOUR).await.unwrap();
    assert_eq!(summary.total_seconds, 600);
    assert_eq!(
        summary.apps,
        vec![AppUsage {
            app: "VS Code".into(),
            category: "Coding".into(),
            is_browser: false,
            total_seconds: 600,
            sessions: 1
        }]
    );
    assert!(summary.domains.is_empty());
}

#[tokio::test]
async fn too_short_sessions_are_not_stored_and_long_ones_are_clamped() {
    let f = fixture();
    assert!(!f
        .usage
        .record_app_session(code(T0, T0 + 1_000))
        .await
        .unwrap());
    assert!(f
        .usage
        .record_app_session(code(T0, T0 + 20 * HOUR))
        .await
        .unwrap());
    let spans = f
        .usage
        .app_sessions("VS Code", T0, T0 + 24 * HOUR)
        .await
        .unwrap();
    assert_eq!(
        spans,
        vec![TimeRange {
            started_at: T0,
            ended_at: T0 + 12 * HOUR
        }]
    );
}

#[tokio::test]
async fn invalid_sessions_are_refused_with_a_field() {
    let f = fixture();
    let e = f
        .usage
        .record_app_session(code(T0 + 10, T0))
        .await
        .unwrap_err();
    assert_eq!(e.field.as_deref(), Some("ended_at"));
    let future = f.clock.now_ms() + HOUR;
    let e = f
        .usage
        .record_app_session(code(future, future + MIN))
        .await
        .unwrap_err();
    assert_eq!(e.field.as_deref(), Some("ended_at"));
    let e = f
        .usage
        .record_app_session(app_session("X", "Nope", false, T0, T0 + MIN))
        .await
        .unwrap_err();
    assert_eq!(e.field.as_deref(), Some("category"));
    let e = f
        .usage
        .record_app_session(app_session("", "Other", false, T0, T0 + MIN))
        .await
        .unwrap_err();
    assert_eq!(e.field.as_deref(), Some("app"));
    assert_eq!(count(&f.db, "app_sessions").await, 0);
}

#[tokio::test]
async fn domains_are_lower_cased_and_upsert_first_and_last_seen() {
    let f = fixture();
    f.usage
        .record_domain_session("Firefox", "GitHub.com", T0 + 100 * MIN, T0 + 110 * MIN)
        .await
        .unwrap();
    f.usage
        .record_domain_session("Firefox", "github.com", T0 + 10 * MIN, T0 + 20 * MIN)
        .await
        .unwrap();
    f.usage
        .record_domain_session("Firefox", "github.com", T0 + 200 * MIN, T0 + 210 * MIN)
        .await
        .unwrap();
    let domains = f.usage.domains().await.unwrap();
    assert_eq!(
        domains,
        vec![DomainSetting {
            domain: "github.com".into(),
            category: "Coding".into(),
            tracked: true,
            first_seen: T0 + 10 * MIN,
            last_seen: T0 + 210 * MIN
        }]
    );
    let summary = f.usage.summary(T0, T0 + 24 * HOUR).await.unwrap();
    assert_eq!(summary.domains.len(), 1);
    assert_eq!(summary.domains[0].domain, "github.com");
    assert_eq!(summary.domains[0].browser, "Firefox");
    assert_eq!(summary.domains[0].category, "Coding");
    assert_eq!(summary.domains[0].total_seconds, 1800);
    assert_eq!(summary.domains[0].sessions, 3);
}

#[tokio::test]
async fn anything_that_looks_like_a_url_never_reaches_the_database() {
    let f = fixture();
    for bad in [
        "https://example.com/secret/path?token=abc",
        "example.com/inbox",
        "example.com?q=1",
        "user@example.com",
        "example.com:443",
        "/etc/passwd",
        "C:\\Users\\me",
    ] {
        let e = f
            .usage
            .record_domain_session("Chrome", bad, T0, T0 + MIN)
            .await
            .unwrap_err();
        assert_eq!(e.field.as_deref(), Some("domain"), "{bad}");
    }
    assert_eq!(count(&f.db, "domain_sessions").await, 0);
    assert_eq!(count(&f.db, "domains").await, 0);
}

#[tokio::test]
async fn untracked_domains_are_refused_and_forgotten() {
    let f = fixture();
    f.usage
        .record_domain_session("Chrome", "bank.example", T0, T0 + MIN)
        .await
        .unwrap();
    f.usage
        .set_domain_tracked("Bank.Example", false)
        .await
        .unwrap();
    assert_eq!(
        count(&f.db, "domain_sessions").await,
        0,
        "history for it is deleted"
    );
    assert!(!f
        .usage
        .record_domain_session("Chrome", "bank.example", T0, T0 + MIN)
        .await
        .unwrap());
    assert_eq!(count(&f.db, "domain_sessions").await, 0);

    // Marking an unseen domain works, and tracking can be turned back on.
    f.usage
        .set_domain_tracked("never-seen.example", false)
        .await
        .unwrap();
    assert!(!f
        .usage
        .record_domain_session("Chrome", "never-seen.example", T0, T0 + MIN)
        .await
        .unwrap());
    f.usage
        .set_domain_tracked("never-seen.example", true)
        .await
        .unwrap();
    assert!(f
        .usage
        .record_domain_session("Chrome", "never-seen.example", T0, T0 + MIN)
        .await
        .unwrap());
}

#[tokio::test]
async fn record_many_is_one_transaction_and_skips_bad_records() {
    let f = fixture();
    let before = f.db.committed_transactions();
    let saved = f
        .usage
        .record_many(vec![
            UsageRecord::App(code(T0, T0 + MIN)),
            UsageRecord::App(code(T0 + 2 * MIN, T0 + 2 * MIN + 500)), // too short
            UsageRecord::Domain(DomainSession {
                browser: "Chrome".into(),
                domain: "https://leak.example/x".into(), // not a host
                started_at: T0,
                ended_at: T0 + MIN,
            }),
            UsageRecord::Domain(DomainSession {
                browser: "Chrome".into(),
                domain: "ok.example".into(),
                started_at: T0,
                ended_at: T0 + MIN,
            }),
            UsageRecord::App(app_session(
                "Slack",
                "Communication",
                false,
                T0 + 3 * MIN,
                T0 + 4 * MIN,
            )),
        ])
        .await
        .unwrap();
    assert_eq!(saved, 3);
    assert_eq!(f.db.committed_transactions() - before, 1);
    assert_eq!(count(&f.db, "app_sessions").await, 2);
    assert_eq!(count(&f.db, "domain_sessions").await, 1);
    assert_eq!(f.usage.record_many(vec![]).await.unwrap(), 0);
}

#[tokio::test]
async fn updated_events_are_coalesced_to_one_per_thirty_seconds() {
    let f = fixture();
    let mut sub = f.bus.subscribe();
    let now = f.clock.now_ms();
    f.usage
        .record_app_session(code(T0, T0 + MIN))
        .await
        .unwrap();
    f.clock.advance_ms(10 * S);
    f.usage
        .record_app_session(code(T0 + 2 * MIN, T0 + 3 * MIN))
        .await
        .unwrap();
    f.clock.advance_ms(10 * S);
    f.usage
        .record_many(vec![UsageRecord::App(code(T0 + 4 * MIN, T0 + 5 * MIN))])
        .await
        .unwrap();
    assert_eq!(drain(&mut sub).await, vec![Event::UsageUpdated { at: now }]);

    f.clock.advance_ms(10 * S); // 30 s after the first
    f.usage
        .record_app_session(code(T0 + 6 * MIN, T0 + 7 * MIN))
        .await
        .unwrap();
    assert_eq!(
        drain(&mut sub).await,
        vec![Event::UsageUpdated { at: now + 30 * S }]
    );
    assert_eq!(count(&f.db, "app_sessions").await, 4, "nothing was lost");
}

#[tokio::test]
async fn nothing_is_published_when_nothing_was_saved() {
    let f = fixture();
    let mut sub = f.bus.subscribe();
    f.usage
        .record_app_session(code(T0, T0 + 100))
        .await
        .unwrap();
    assert!(drain(&mut sub).await.is_empty());
}

#[tokio::test]
async fn summary_clips_sessions_to_the_requested_range() {
    let f = fixture();
    f.usage
        .record_app_session(code(T0 - HOUR, T0 + HOUR))
        .await
        .unwrap(); // straddles from
    f.usage
        .record_app_session(code(T0 + 5 * HOUR, T0 + 7 * HOUR))
        .await
        .unwrap(); // straddles to
    f.usage
        .record_app_session(app_session(
            "Slack",
            "Communication",
            false,
            T0 + 2 * HOUR,
            T0 + 3 * HOUR,
        ))
        .await
        .unwrap();
    f.usage
        .record_app_session(code(T0 + 9 * HOUR, T0 + 10 * HOUR))
        .await
        .unwrap(); // outside

    let s = f.usage.summary(T0, T0 + 6 * HOUR).await.unwrap();
    assert_eq!(s.total_seconds, (HOUR + HOUR + HOUR) / S);
    assert_eq!(s.apps[0].app, "VS Code");
    assert_eq!(s.apps[0].total_seconds, 2 * 3600);
    assert_eq!(s.apps[0].sessions, 2);
    assert_eq!(s.apps[1].app, "Slack");
    // Half-open: a session that ends exactly at `from` or starts exactly at `to` is outside.
    let s = f.usage.summary(T0 + HOUR, T0 + 2 * HOUR).await.unwrap();
    assert_eq!(s.total_seconds, 0);
    assert!(s.apps.is_empty());
}

#[tokio::test]
async fn apps_and_domains_are_sorted_by_time_descending() {
    let f = fixture();
    f.usage
        .record_app_session(app_session(
            "Slack",
            "Communication",
            false,
            T0,
            T0 + 10 * MIN,
        ))
        .await
        .unwrap();
    f.usage
        .record_app_session(app_session(
            "Google Chrome",
            "Research",
            true,
            T0 + HOUR,
            T0 + 2 * HOUR,
        ))
        .await
        .unwrap();
    f.usage
        .record_app_session(code(T0 + 3 * HOUR, T0 + 3 * HOUR + 30 * MIN))
        .await
        .unwrap();
    for (d, mins) in [("a.example", 5), ("b.example", 40), ("c.example", 20)] {
        f.usage
            .record_domain_session("Chrome", d, T0 + HOUR, T0 + HOUR + mins * MIN)
            .await
            .unwrap();
    }
    let s = f.usage.summary(T0, T0 + 24 * HOUR).await.unwrap();
    let apps: Vec<_> = s.apps.iter().map(|a| a.app.as_str()).collect();
    assert_eq!(apps, ["Google Chrome", "VS Code", "Slack"]);
    assert!(s.apps[0].is_browser);
    let domains: Vec<_> = s.domains.iter().map(|d| d.domain.as_str()).collect();
    assert_eq!(domains, ["b.example", "c.example", "a.example"]);
    assert_eq!(s.domains[0].category, "Other");
}

#[tokio::test]
async fn hourly_buckets_follow_the_clocks_time_zone_including_half_hour_offsets() {
    let f = fixture();
    // 00:00-01:00 UTC is 05:30-06:30 in Kolkata: half an hour in hour 5, half in hour 6.
    f.usage
        .record_app_session(code(T0, T0 + HOUR))
        .await
        .unwrap();
    let utc = f.usage.summary(T0, T0 + 24 * HOUR).await.unwrap();
    assert_eq!(utc.hourly_seconds.len(), 24);
    assert_eq!(utc.hourly_seconds[0], 3600);

    f.clock.set_tz(chrono_tz::Asia::Kolkata);
    let ist = f.usage.summary(T0, T0 + 24 * HOUR).await.unwrap();
    assert_eq!(ist.hourly_seconds[5], 1800);
    assert_eq!(ist.hourly_seconds[6], 1800);
    assert_eq!(ist.hourly_seconds.iter().sum::<i64>(), 3600);

    // A session spanning local midnight lands in hours 23 and 0.
    f.clock.set_tz(Tz::UTC);
    let day = NaiveDate::from_ymd_opt(2026, 10, 3).unwrap();
    let midnight = crate::clock::start_of_day_ms(&f.clock, day);
    f.usage
        .record_app_session(code(midnight - 30 * MIN, midnight + 15 * MIN))
        .await
        .unwrap();
    let s = f
        .usage
        .summary(midnight - HOUR, midnight + HOUR)
        .await
        .unwrap();
    assert_eq!(s.hourly_seconds[23], 1800);
    assert_eq!(
        s.hourly_seconds[0],
        900 + 3600,
        "plus the first hour recorded above"
    );
}

#[tokio::test]
async fn hourly_buckets_only_count_the_part_inside_the_range() {
    let f = fixture();
    f.usage
        .record_app_session(code(T0, T0 + 2 * HOUR))
        .await
        .unwrap();
    let s = f.usage.summary(T0 + 30 * MIN, T0 + 90 * MIN).await.unwrap();
    assert_eq!(s.hourly_seconds[0], 1800);
    assert_eq!(s.hourly_seconds[1], 1800);
    assert_eq!(s.total_seconds, 3600);
}

#[tokio::test]
async fn exact_spans_are_chronological_and_clipped() {
    let f = fixture();
    f.usage
        .record_app_session(code(T0 + 3 * HOUR, T0 + 4 * HOUR))
        .await
        .unwrap();
    f.usage
        .record_app_session(code(T0 - HOUR, T0 + HOUR))
        .await
        .unwrap();
    f.usage
        .record_app_session(app_session("Slack", "Communication", false, T0, T0 + MIN))
        .await
        .unwrap();
    let spans = f
        .usage
        .app_sessions("VS Code", T0, T0 + 3 * HOUR + 30 * MIN)
        .await
        .unwrap();
    assert_eq!(
        spans,
        vec![
            TimeRange {
                started_at: T0,
                ended_at: T0 + HOUR
            },
            TimeRange {
                started_at: T0 + 3 * HOUR,
                ended_at: T0 + 3 * HOUR + 30 * MIN
            },
        ]
    );
    assert!(f
        .usage
        .app_sessions("Nope", T0, T0 + 24 * HOUR)
        .await
        .unwrap()
        .is_empty());

    f.usage
        .record_domain_session("Chrome", "Example.com", T0 + HOUR, T0 + 2 * HOUR)
        .await
        .unwrap();
    let spans = f
        .usage
        .domain_sessions("EXAMPLE.com", T0 + 90 * MIN, T0 + 24 * HOUR)
        .await
        .unwrap();
    assert_eq!(
        spans,
        vec![TimeRange {
            started_at: T0 + 90 * MIN,
            ended_at: T0 + 2 * HOUR
        }]
    );
    assert!(f.usage.domain_sessions("a/b", T0, T0 + HOUR).await.is_err());
}

#[tokio::test]
async fn an_empty_or_backwards_range_is_a_validation_error() {
    let f = fixture();
    assert!(f.usage.summary(5, 5).await.is_err());
    assert!(f.usage.summary(9, 5).await.is_err());
    assert!(f.usage.app_sessions("x", 9, 5).await.is_err());
    assert!(f.usage.delete_range(9, 5).await.is_err());
}

#[tokio::test]
async fn delete_range_removes_overlapping_sessions_and_unseen_domains() {
    let f = fixture();
    f.usage
        .record_app_session(code(T0, T0 + HOUR))
        .await
        .unwrap();
    f.usage
        .record_app_session(code(T0 + 5 * HOUR, T0 + 6 * HOUR))
        .await
        .unwrap();
    f.usage
        .record_domain_session("Chrome", "gone.example", T0, T0 + HOUR)
        .await
        .unwrap();
    f.usage
        .record_domain_session("Chrome", "kept.example", T0 + 5 * HOUR, T0 + 6 * HOUR)
        .await
        .unwrap();
    f.usage
        .set_domain_tracked("blocked.example", false)
        .await
        .unwrap();
    let mut sub = f.bus.subscribe();

    let removed = f
        .usage
        .delete_range(T0 + 30 * MIN, T0 + 2 * HOUR)
        .await
        .unwrap();
    assert_eq!(removed, 2, "the straddling app session and domain session");
    assert_eq!(count(&f.db, "app_sessions").await, 1);
    let remaining: Vec<_> = f
        .usage
        .domains()
        .await
        .unwrap()
        .into_iter()
        .map(|d| d.domain)
        .collect();
    assert_eq!(remaining, ["blocked.example", "kept.example"]);
    assert_eq!(
        drain(&mut sub).await.len(),
        1,
        "deleting always tells the UI"
    );
}

#[tokio::test]
async fn delete_all_wipes_history_but_keeps_do_not_track_marks() {
    let f = fixture();
    f.usage
        .record_app_session(code(T0, T0 + HOUR))
        .await
        .unwrap();
    f.usage
        .record_domain_session("Chrome", "a.example", T0, T0 + HOUR)
        .await
        .unwrap();
    f.usage
        .set_domain_tracked("blocked.example", false)
        .await
        .unwrap();
    assert_eq!(f.usage.delete_all().await.unwrap(), 2);
    assert_eq!(count(&f.db, "app_sessions").await, 0);
    assert_eq!(count(&f.db, "domain_sessions").await, 0);
    let left = f.usage.domains().await.unwrap();
    assert_eq!(left.len(), 1);
    assert_eq!(left[0].domain, "blocked.example");
    assert!(!left[0].tracked);
}

#[tokio::test]
async fn domain_categories_can_be_changed_and_survive_new_sessions() {
    let f = fixture();
    f.usage
        .set_domain_category("Example.com", "Research")
        .await
        .unwrap();
    f.usage
        .record_domain_session("Chrome", "example.com", T0, T0 + MIN)
        .await
        .unwrap();
    let s = f.usage.summary(T0, T0 + HOUR).await.unwrap();
    assert_eq!(s.domains[0].category, "Research");
    let e = f
        .usage
        .set_domain_category("example.com", "Fun")
        .await
        .unwrap_err();
    assert_eq!(e.field.as_deref(), Some("category"));
}

#[tokio::test]
async fn retention_keeps_400_days_and_the_janitor_runs_on_day_rollover() {
    let f = fixture();
    let now = f.clock.now_ms();
    let old = now - 401 * 24 * HOUR;
    let recent = now - 399 * 24 * HOUR;
    for (start, name) in [(old, "old.example"), (recent, "recent.example")] {
        f.usage
            .record_app_session(code(start, start + HOUR))
            .await
            .unwrap();
        f.usage
            .record_domain_session("Chrome", name, start, start + HOUR)
            .await
            .unwrap();
    }
    f.usage
        .set_domain_tracked("blocked.example", false)
        .await
        .unwrap();
    assert_eq!(count(&f.db, "app_sessions").await, 2);

    let janitor = spawn_janitor(f.usage.clone(), &f.bus);
    let mut sub = f.bus.subscribe();
    f.bus.publish(Event::DayRolledOver {
        at: now,
        ended_date: "2026-10-04".into(),
        new_date: "2026-10-05".into(),
    });
    // The janitor's write publishes UsageUpdated once the purge has committed.
    loop {
        if let Recv::Event(Event::UsageUpdated { .. }) = sub.recv().await {
            break;
        }
    }
    janitor.abort();
    assert_eq!(count(&f.db, "app_sessions").await, 1);
    assert_eq!(count(&f.db, "domain_sessions").await, 1);
    let names: Vec<_> = f
        .usage
        .domains()
        .await
        .unwrap()
        .into_iter()
        .map(|d| d.domain)
        .collect();
    assert_eq!(names, ["blocked.example", "recent.example"]);
    assert_eq!(f.usage.purge_expired().await.unwrap(), 0);
}

#[test]
fn summary_serializes_with_the_documented_field_names() {
    let s = UsageSummary {
        total_seconds: 5,
        apps: vec![AppUsage {
            app: "VS Code".into(),
            category: "Coding".into(),
            is_browser: false,
            total_seconds: 5,
            sessions: 1,
        }],
        domains: vec![],
        hourly_seconds: vec![0; 24],
    };
    let v = serde_json::to_value(&s).unwrap();
    assert_eq!(v["total_seconds"], json!(5));
    assert_eq!(v["apps"][0]["is_browser"], json!(false));
    assert_eq!(v["hourly_seconds"].as_array().unwrap().len(), 24);
}
