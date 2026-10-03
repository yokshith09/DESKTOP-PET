//! The one `Event` enum (ADR-004, TRD §3). Every state change in Loaf is one of these.
//!
//! Names are past tense (`SettingChanged`), with the two lifecycle exceptions the TRD lists
//! (`AppReady`, `AppShuttingDown`). Only the variants Phase 0 needs exist; each later feature
//! adds its own next to the code that publishes it. Every variant carries `at`, ms since the Unix
//! epoch, UTC.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::labels::Label;
use crate::notes::Note;
use crate::tasks::{Task, TaskStatus};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Event {
    AppStarted {
        at: i64,
        version: String,
    },
    AppReady {
        at: i64,
        startup_ms: u64,
    },
    AppShuttingDown {
        at: i64,
    },
    SettingChanged {
        at: i64,
        key: String,
        value: Value,
    },
    NoteCreated {
        at: i64,
        note: Note,
    },
    NoteUpdated {
        at: i64,
        note: Note,
    },
    NoteDeleted {
        at: i64,
        id: String,
    },
    NotePinnedChanged {
        at: i64,
        id: String,
        pinned: bool,
    },
    NoteArchivedChanged {
        at: i64,
        id: String,
        archived: bool,
    },
    LabelsChanged {
        at: i64,
        labels: Vec<Label>,
    },
    TaskCreated {
        at: i64,
        task: Task,
    },
    TaskUpdated {
        at: i64,
        task: Task,
    },
    TaskStatusChanged {
        at: i64,
        id: String,
        from: TaskStatus,
        to: TaskStatus,
    },
    TaskDeferred {
        at: i64,
        id: String,
        from_date: Option<String>,
        to_date: String,
    },
    TaskDeleted {
        at: i64,
        id: String,
    },
    PetVisibilityChanged {
        at: i64,
        visible: bool,
    },
    PetMoved {
        at: i64,
        display_id: String,
        x: i32,
        y: i32,
    },
    DataExported {
        at: i64,
        path: String,
        bytes: u64,
    },
    DataImported {
        at: i64,
        counts: BTreeMap<String, u64>,
    },
    AllDataDeleted {
        at: i64,
    },
    DayRolledOver {
        at: i64,
        ended_date: String,
        new_date: String,
    },
    DailyLogFrozen {
        at: i64,
        log_date: String,
        reconstructed: bool,
    },
}

impl Event {
    /// When the event happened, ms since the Unix epoch (UTC).
    pub fn at(&self) -> i64 {
        match self {
            Self::AppStarted { at, .. }
            | Self::AppReady { at, .. }
            | Self::AppShuttingDown { at }
            | Self::SettingChanged { at, .. }
            | Self::NoteCreated { at, .. }
            | Self::NoteUpdated { at, .. }
            | Self::NoteDeleted { at, .. }
            | Self::NotePinnedChanged { at, .. }
            | Self::NoteArchivedChanged { at, .. }
            | Self::LabelsChanged { at, .. }
            | Self::TaskCreated { at, .. }
            | Self::TaskUpdated { at, .. }
            | Self::TaskStatusChanged { at, .. }
            | Self::TaskDeferred { at, .. }
            | Self::TaskDeleted { at, .. }
            | Self::PetVisibilityChanged { at, .. }
            | Self::PetMoved { at, .. }
            | Self::DataExported { at, .. }
            | Self::DataImported { at, .. }
            | Self::AllDataDeleted { at }
            | Self::DayRolledOver { at, .. }
            | Self::DailyLogFrozen { at, .. } => *at,
        }
    }

    /// The variant name; identical to the `type` tag in the serialized form.
    pub fn name(&self) -> &'static str {
        match self {
            Self::AppStarted { .. } => "AppStarted",
            Self::AppReady { .. } => "AppReady",
            Self::AppShuttingDown { .. } => "AppShuttingDown",
            Self::SettingChanged { .. } => "SettingChanged",
            Self::NoteCreated { .. } => "NoteCreated",
            Self::NoteUpdated { .. } => "NoteUpdated",
            Self::NoteDeleted { .. } => "NoteDeleted",
            Self::NotePinnedChanged { .. } => "NotePinnedChanged",
            Self::NoteArchivedChanged { .. } => "NoteArchivedChanged",
            Self::LabelsChanged { .. } => "LabelsChanged",
            Self::TaskCreated { .. } => "TaskCreated",
            Self::TaskUpdated { .. } => "TaskUpdated",
            Self::TaskStatusChanged { .. } => "TaskStatusChanged",
            Self::TaskDeferred { .. } => "TaskDeferred",
            Self::TaskDeleted { .. } => "TaskDeleted",
            Self::PetVisibilityChanged { .. } => "PetVisibilityChanged",
            Self::PetMoved { .. } => "PetMoved",
            Self::DataExported { .. } => "DataExported",
            Self::DataImported { .. } => "DataImported",
            Self::AllDataDeleted { .. } => "AllDataDeleted",
            Self::DayRolledOver { .. } => "DayRolledOver",
            Self::DailyLogFrozen { .. } => "DailyLogFrozen",
        }
    }
}

#[cfg(test)]
pub(crate) fn one_of_each() -> Vec<Event> {
    vec![
        Event::AppStarted {
            at: 1,
            version: "0.0.1".into(),
        },
        Event::AppReady {
            at: 2,
            startup_ms: 850,
        },
        Event::AppShuttingDown { at: 3 },
        Event::SettingChanged {
            at: 4,
            key: "general.theme".into(),
            value: serde_json::json!("dark"),
        },
        Event::NoteCreated {
            at: 12,
            note: Note::sample(),
        },
        Event::NoteUpdated {
            at: 13,
            note: Note::sample(),
        },
        Event::NoteDeleted {
            at: 14,
            id: "n1".into(),
        },
        Event::NotePinnedChanged {
            at: 15,
            id: "n1".into(),
            pinned: true,
        },
        Event::NoteArchivedChanged {
            at: 16,
            id: "n1".into(),
            archived: true,
        },
        Event::LabelsChanged {
            at: 17,
            labels: vec![Label {
                id: "l1".into(),
                name: "work".into(),
            }],
        },
        Event::TaskCreated {
            at: 18,
            task: Task::sample(),
        },
        Event::TaskUpdated {
            at: 19,
            task: Task::sample(),
        },
        Event::TaskStatusChanged {
            at: 20,
            id: "t1".into(),
            from: TaskStatus::Planned,
            to: TaskStatus::InProgress,
        },
        Event::TaskDeferred {
            at: 21,
            id: "t1".into(),
            from_date: Some("2026-10-03".into()),
            to_date: "2026-10-04".into(),
        },
        Event::TaskDeleted {
            at: 22,
            id: "t1".into(),
        },
        Event::PetVisibilityChanged {
            at: 5,
            visible: false,
        },
        Event::PetMoved {
            at: 6,
            display_id: "primary".into(),
            x: -40,
            y: 900,
        },
        Event::DataExported {
            at: 7,
            path: "/tmp/loaf.json".into(),
            bytes: 2048,
        },
        Event::DataImported {
            at: 8,
            counts: BTreeMap::from([("notes".to_owned(), 3), ("tasks".to_owned(), 5)]),
        },
        Event::AllDataDeleted { at: 9 },
        Event::DayRolledOver {
            at: 10,
            ended_date: "2026-10-03".into(),
            new_date: "2026-10-04".into(),
        },
        Event::DailyLogFrozen {
            at: 11,
            log_date: "2026-10-03".into(),
            reconstructed: true,
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    /// TRD §3 names, in the order of the enum. The test below fails if a variant is added or
    /// renamed without updating this list, which keeps the enum and the document in step.
    const TRD_NAMES: &[&str] = &[
        "AppStarted",
        "AppReady",
        "AppShuttingDown",
        "SettingChanged",
        "NoteCreated",
        "NoteUpdated",
        "NoteDeleted",
        "NotePinnedChanged",
        "NoteArchivedChanged",
        "LabelsChanged",
        "TaskCreated",
        "TaskUpdated",
        "TaskStatusChanged",
        "TaskDeferred",
        "TaskDeleted",
        "PetVisibilityChanged",
        "PetMoved",
        "DataExported",
        "DataImported",
        "AllDataDeleted",
        "DayRolledOver",
        "DailyLogFrozen",
    ];

    #[test]
    fn variant_names_match_the_trd_catalog_exactly() {
        let names: Vec<_> = one_of_each().iter().map(Event::name).collect();
        assert_eq!(names, TRD_NAMES);
    }

    #[test]
    fn names_are_past_tense_apart_from_the_two_lifecycle_exceptions() {
        for name in TRD_NAMES {
            let exception = matches!(*name, "AppReady" | "AppShuttingDown");
            // Regular past tense ends in "ed"; "Frozen" is the one irregular form, and
            // "RolledOver" ends in its particle.
            let past = name.ends_with("ed") || name.ends_with("Frozen") || name.ends_with("Over");
            assert!(exception || past, "{name} should be past tense");
        }
    }

    #[test]
    fn every_variant_round_trips_through_json_with_its_name_as_the_tag() {
        for event in one_of_each() {
            let json = serde_json::to_value(&event).unwrap();
            assert_eq!(
                json["type"],
                event.name(),
                "tag must equal the variant name"
            );
            assert_eq!(json["at"], event.at());
            let back: Event = serde_json::from_value(json).unwrap();
            assert_eq!(back, event);
        }
    }

    #[test]
    fn an_unknown_event_type_is_rejected_not_silently_accepted() {
        let bad = serde_json::json!({ "type": "SomethingHappened", "at": 1 });
        assert!(serde_json::from_value::<Event>(bad).is_err());
    }
}
