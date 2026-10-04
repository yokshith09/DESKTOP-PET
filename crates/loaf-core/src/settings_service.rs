//! Settings service: get/set with validation and event publishing (F0-07).
//!
//! Commands are meant to be called from Tauri handlers, which will serialize results
//! for the IPC boundary.

use crate::bus::EventBus;
use crate::clock::Clock;
use crate::db::Database;
use crate::error::Result;
use crate::events::Event;
use crate::settings;
use serde_json::Value;
use std::collections::BTreeMap;
use std::sync::Arc;

pub struct SettingsService {
    db: Arc<Database>,
    bus: Arc<EventBus>,
    clock: Arc<dyn Clock>,
}

impl SettingsService {
    pub fn new(db: Arc<Database>, bus: Arc<EventBus>, clock: Arc<dyn Clock>) -> Self {
        Self { db, bus, clock }
    }

    /// Get all settings as a map, filling in defaults for missing keys.
    pub fn get_all(&self) -> BTreeMap<String, Value> {
        let result = settings::all_defaults();

        // TODO: Read from DB settings table and overlay on defaults.
        // For now, just return defaults until DB integration is ready.

        result
    }

    /// Set a single setting; validates, writes through DB writer, publishes SettingChanged.
    pub fn set(&self, key: &str, value: Value) -> Result<()> {
        // Validate the key and value.
        if let Some(err) = settings::validate(key, &value) {
            return Err(err);
        }

        // TODO: Write to DB settings table through the writer.

        // Publish the SettingChanged event.
        let now = self.clock.now_ms();
        let event = Event::SettingChanged {
            at: now,
            key: key.to_string(),
            value,
        };
        self.bus.publish(event);

        Ok(())
    }

    /// Get a user preference (like window bounds, last view).
    pub fn get_pref(&self, _key: &str) -> Option<Value> {
        // TODO: Read from DB user_preferences table.
        None
    }

    /// Set a user preference.
    pub fn set_pref(&self, _key: &str, _value: Value) -> Result<()> {
        // TODO: Write to DB user_preferences table through the writer.
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bus::EventBus;
    use crate::clock::FakeClock;
    use chrono_tz::Tz;

    #[test]
    fn get_all_includes_all_defaults() {
        let all = settings::all_defaults();
        assert_eq!(
            all.get("general.autostart"),
            Some(&serde_json::json!(false))
        );
        assert_eq!(all.get("pet.opacity"), Some(&serde_json::json!(100)));
        assert_eq!(all.len(), 11);
    }

    #[test]
    fn validates_type() {
        let err = settings::validate("general.autostart", &serde_json::json!("true"));
        assert_eq!(
            err.as_ref().map(|e| e.field.as_deref()),
            Some(Some("general.autostart"))
        );
    }

    #[test]
    fn validates_range() {
        let err = settings::validate("pet.opacity", &serde_json::json!(150));
        assert_eq!(
            err.as_ref().map(|e| e.field.as_deref()),
            Some(Some("pet.opacity"))
        );
    }
}
