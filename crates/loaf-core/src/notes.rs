//! Notes (PRD §6.1, R1-01 … R1-11). Pure data rules plus the operations that persist them.
//!
//! Every mutation runs through [`Database::write`], so its event is published only after the
//! commit. Timestamps come from the injected [`Clock`].

use std::collections::{HashMap, HashSet};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

use crate::clock::Clock;
use crate::db::Database;
use crate::error::{AppError, Result};
use crate::events::Event;
use crate::ids::new_id;
use crate::labels::Label;

pub const TITLE_MAX: usize = 200;
pub const BODY_MAX: usize = 100_000;
pub const EXCERPT_CHARS: usize = 200;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NoteColor {
    #[default]
    Default,
    Red,
    Orange,
    Yellow,
    Green,
    Teal,
    Blue,
    Purple,
    Gray,
}

impl NoteColor {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Red => "red",
            Self::Orange => "orange",
            Self::Yellow => "yellow",
            Self::Green => "green",
            Self::Teal => "teal",
            Self::Blue => "blue",
            Self::Purple => "purple",
            Self::Gray => "gray",
        }
    }

    fn from_db(s: &str) -> Result<Self> {
        Ok(match s {
            "default" => Self::Default,
            "red" => Self::Red,
            "orange" => Self::Orange,
            "yellow" => Self::Yellow,
            "green" => Self::Green,
            "teal" => Self::Teal,
            "blue" => Self::Blue,
            "purple" => Self::Purple,
            "gray" => Self::Gray,
            _ => return Err(AppError::internal("A note has a colour Loaf doesn't know.")),
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub body: String,
    pub color: NoteColor,
    pub pinned: bool,
    pub archived: bool,
    pub created_at: i64,
    pub edited_at: i64,
    /// Sorted by folded name.
    pub labels: Vec<Label>,
}

#[cfg(test)]
impl Note {
    pub(crate) fn sample() -> Self {
        Self {
            id: "n1".into(),
            title: "Hackathon ideas".into(),
            body: "- GCP setup".into(),
            color: NoteColor::Yellow,
            pinned: false,
            archived: false,
            created_at: 1,
            edited_at: 2,
            labels: vec![Label {
                id: "l1".into(),
                name: "work".into(),
            }],
        }
    }
}

/// What the list shows: a card, not the whole note.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NoteSummary {
    pub id: String,
    pub title: String,
    pub excerpt: String,
    pub color: NoteColor,
    pub pinned: bool,
    pub archived: bool,
    pub created_at: i64,
    pub edited_at: i64,
    pub labels: Vec<Label>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NoteSort {
    #[default]
    LastEdited,
    Created,
    Color,
}

#[derive(Debug, Clone, Default)]
pub struct NoteInput {
    pub title: String,
    pub body: String,
    pub color: NoteColor,
    pub label_ids: Vec<String>,
}

/// Fields left as `None` are not touched.
#[derive(Debug, Clone, Default)]
pub struct NotePatch {
    pub title: Option<String>,
    pub body: Option<String>,
    pub color: Option<NoteColor>,
    pub label_ids: Option<Vec<String>>,
}

fn check_title(title: &str) -> Result<()> {
    if title.chars().count() > TITLE_MAX {
        return Err(AppError::validation(
            "title",
            format!("Titles can be up to {TITLE_MAX} characters."),
        ));
    }
    Ok(())
}

fn check_body(body: &str) -> Result<()> {
    if body.chars().count() > BODY_MAX {
        return Err(AppError::validation(
            "body",
            format!("Notes can be up to {BODY_MAX} characters."),
        ));
    }
    Ok(())
}

fn not_found() -> AppError {
    AppError::not_found("That note no longer exists.")
}

fn note_labels(conn: &Connection, note_id: &str) -> Result<Vec<Label>> {
    let mut stmt = conn.prepare(
        "SELECT l.id, l.name FROM note_labels nl JOIN labels l ON l.id = nl.label_id
          WHERE nl.note_id = ?1 ORDER BY l.name_folded",
    )?;
    let labels = stmt
        .query_map([note_id], |r| {
            Ok(Label {
                id: r.get(0)?,
                name: r.get(1)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(labels)
}

fn load(conn: &Connection, id: &str) -> Result<Note> {
    let row = conn
        .query_row(
            "SELECT title, body, color, pinned, archived, created_at, edited_at FROM notes WHERE id = ?1",
            [id],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?, r.get::<_, bool>(3)?, r.get::<_, bool>(4)?, r.get(5)?, r.get(6)?)),
        )
        .optional()?;
    let Some((title, body, color, pinned, archived, created_at, edited_at)) = row else {
        return Err(not_found());
    };
    Ok(Note {
        id: id.to_owned(),
        title,
        body,
        color: NoteColor::from_db(&color)?,
        pinned,
        archived,
        created_at,
        edited_at,
        labels: note_labels(conn, id)?,
    })
}

/// Replace a note's labels. Every id must exist; duplicates are ignored.
fn set_labels(conn: &Connection, note_id: &str, label_ids: &[String]) -> Result<()> {
    let mut seen = HashSet::new();
    let unique: Vec<&String> = label_ids
        .iter()
        .filter(|id| seen.insert(id.as_str()))
        .collect();
    for id in &unique {
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM labels WHERE id = ?1)",
            [id],
            |r| r.get(0),
        )?;
        if !exists {
            return Err(AppError::not_found("One of those labels no longer exists.")
                .with_field("label_ids"));
        }
    }
    conn.execute("DELETE FROM note_labels WHERE note_id = ?1", [note_id])?;
    for id in unique {
        conn.execute(
            "INSERT INTO note_labels (note_id, label_id) VALUES (?1, ?2)",
            params![note_id, id],
        )?;
    }
    Ok(())
}

fn same_labels(a: &[Label], ids: &[String]) -> bool {
    let current: HashSet<&str> = a.iter().map(|l| l.id.as_str()).collect();
    let wanted: HashSet<&str> = ids.iter().map(String::as_str).collect();
    current == wanted
}

pub async fn get(db: &Database, id: &str) -> Result<Note> {
    let id = id.to_owned();
    db.read(move |conn| load(conn, &id)).await
}

pub async fn create(db: &Database, clock: &dyn Clock, input: NoteInput) -> Result<Note> {
    check_title(&input.title)?;
    check_body(&input.body)?;
    let (id, now) = (new_id(), clock.now_ms());
    db.write(move |tx| {
        tx.execute(
            "INSERT INTO notes (id, title, body, color, pinned, archived, created_at, edited_at)
             VALUES (?1, ?2, ?3, ?4, 0, 0, ?5, ?5)",
            params![id, input.title, input.body, input.color.as_str(), now],
        )?;
        set_labels(tx, &id, &input.label_ids)?;
        let note = load(tx, &id)?;
        Ok((note.clone(), vec![Event::NoteCreated { at: now, note }]))
    })
    .await
}

/// Apply a patch. `edited_at` moves only when the title, body, colour or labels really change
/// (R1-04): an autosave that changes nothing writes nothing and publishes nothing.
pub async fn update(db: &Database, clock: &dyn Clock, id: &str, patch: NotePatch) -> Result<Note> {
    if let Some(t) = &patch.title {
        check_title(t)?;
    }
    if let Some(b) = &patch.body {
        check_body(b)?;
    }
    let current = get(db, id).await?;
    if !differs(&current, &patch) {
        return Ok(current);
    }
    let (id, now) = (id.to_owned(), clock.now_ms());
    db.write(move |tx| {
        let current = load(tx, &id)?;
        if !differs(&current, &patch) {
            return Ok((current, vec![]));
        }
        tx.execute(
            "UPDATE notes SET title = ?1, body = ?2, color = ?3, edited_at = ?4 WHERE id = ?5",
            params![
                patch.title.as_deref().unwrap_or(&current.title),
                patch.body.as_deref().unwrap_or(&current.body),
                patch.color.unwrap_or(current.color).as_str(),
                now,
                id
            ],
        )?;
        if let Some(ids) = &patch.label_ids {
            set_labels(tx, &id, ids)?;
        }
        let note = load(tx, &id)?;
        Ok((note.clone(), vec![Event::NoteUpdated { at: now, note }]))
    })
    .await
}

fn differs(current: &Note, patch: &NotePatch) -> bool {
    patch.title.as_ref().is_some_and(|t| *t != current.title)
        || patch.body.as_ref().is_some_and(|b| *b != current.body)
        || patch.color.is_some_and(|c| c != current.color)
        || patch
            .label_ids
            .as_ref()
            .is_some_and(|ids| !same_labels(&current.labels, ids))
}

/// Pin or unpin. Does not touch `edited_at`. Pinning an archived note is allowed but has no
/// effect until it is restored (Schema §3.2).
pub async fn set_pinned(db: &Database, clock: &dyn Clock, id: &str, pinned: bool) -> Result<Note> {
    set_flag(db, clock, id, Flag::Pinned, pinned).await
}

/// Archive or restore. Does not touch `edited_at`.
pub async fn set_archived(
    db: &Database,
    clock: &dyn Clock,
    id: &str,
    archived: bool,
) -> Result<Note> {
    set_flag(db, clock, id, Flag::Archived, archived).await
}

#[derive(Clone, Copy)]
enum Flag {
    Pinned,
    Archived,
}

async fn set_flag(
    db: &Database,
    clock: &dyn Clock,
    id: &str,
    flag: Flag,
    value: bool,
) -> Result<Note> {
    let current = get(db, id).await?;
    let already = match flag {
        Flag::Pinned => current.pinned == value,
        Flag::Archived => current.archived == value,
    };
    if already {
        return Ok(current);
    }
    let (id, now) = (id.to_owned(), clock.now_ms());
    db.write(move |tx| {
        let column = match flag {
            Flag::Pinned => "pinned",
            Flag::Archived => "archived",
        };
        // `column` is one of two constants above, never user input.
        if tx.execute(
            &format!("UPDATE notes SET {column} = ?1 WHERE id = ?2"),
            params![value, id],
        )? == 0
        {
            return Err(not_found());
        }
        let event = match flag {
            Flag::Pinned => Event::NotePinnedChanged {
                at: now,
                id: id.clone(),
                pinned: value,
            },
            Flag::Archived => Event::NoteArchivedChanged {
                at: now,
                id: id.clone(),
                archived: value,
            },
        };
        Ok((load(tx, &id)?, vec![event]))
    })
    .await
}

/// Delete a note and hand back everything needed to undo it (R1-05). The caller keeps the
/// snapshot for five seconds; there is no trash.
pub async fn delete(db: &Database, clock: &dyn Clock, id: &str) -> Result<Note> {
    let (id, now) = (id.to_owned(), clock.now_ms());
    db.write(move |tx| {
        let snapshot = load(tx, &id)?;
        tx.execute("DELETE FROM notes WHERE id = ?1", [&id])?;
        Ok((snapshot, vec![Event::NoteDeleted { at: now, id }]))
    })
    .await
}

/// Undo a delete: the note comes back with its original id and timestamps. A label that was
/// deleted in the meantime is simply not re-attached.
pub async fn restore(db: &Database, clock: &dyn Clock, snapshot: Note) -> Result<Note> {
    let now = clock.now_ms();
    db.write(move |tx| {
        let taken: bool = tx.query_row("SELECT EXISTS(SELECT 1 FROM notes WHERE id = ?1)", [&snapshot.id], |r| r.get(0))?;
        if taken {
            return Err(AppError::conflict("That note is already back."));
        }
        tx.execute(
            "INSERT INTO notes (id, title, body, color, pinned, archived, created_at, edited_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![snapshot.id, snapshot.title, snapshot.body, snapshot.color.as_str(), snapshot.pinned, snapshot.archived, snapshot.created_at, snapshot.edited_at],
        )?;
        for label in &snapshot.labels {
            tx.execute(
                "INSERT INTO note_labels (note_id, label_id) SELECT ?1, id FROM labels WHERE id = ?2",
                params![snapshot.id, label.id],
            )?;
        }
        let note = load(tx, &snapshot.id)?;
        Ok((note.clone(), vec![Event::NoteCreated { at: now, note }]))
    })
    .await
}

/// A note with no title and no body is discarded when its editor closes (R1-01). Returns whether
/// anything was deleted. Labels and colour do not count as content.
pub async fn discard_if_empty(db: &Database, clock: &dyn Clock, id: &str) -> Result<bool> {
    let (id, now) = (id.to_owned(), clock.now_ms());
    db.write(move |tx| {
        let removed = tx.execute(
            "DELETE FROM notes WHERE id = ?1 AND title = '' AND body = ''",
            [&id],
        )?;
        let events = if removed > 0 {
            vec![Event::NoteDeleted { at: now, id }]
        } else {
            vec![]
        };
        Ok((removed > 0, events))
    })
    .await
}

/// The Notes view (`archived = false`) or the Archive view. Pinned notes come first in the Notes
/// view only; in the Archive view pinning is ignored (Schema §3.2).
pub async fn list(
    db: &Database,
    archived: bool,
    label_id: Option<&str>,
    sort: NoteSort,
) -> Result<Vec<NoteSummary>> {
    let label_id = label_id.map(str::to_owned);
    db.read(move |conn| {
        let order = match sort {
            NoteSort::LastEdited => "n.edited_at DESC, n.id DESC",
            NoteSort::Created => "n.created_at DESC, n.id DESC",
            NoteSort::Color => "n.color ASC, n.edited_at DESC, n.id DESC",
        };
        let sql = format!(
            "SELECT n.id, n.title, substr(n.body, 1, {EXCERPT_CHARS}), n.color, n.pinned, n.archived, n.created_at, n.edited_at
               FROM notes n
              WHERE n.archived = ?1
                AND (?2 IS NULL OR EXISTS (SELECT 1 FROM note_labels nl WHERE nl.note_id = n.id AND nl.label_id = ?2))
              ORDER BY (CASE WHEN ?1 = 0 THEN n.pinned ELSE 0 END) DESC, {order}"
        );
        // `order` is one of three constants above, never user input.
        let mut stmt = conn.prepare(&sql)?;
        let mut notes = stmt
            .query_map(params![archived, label_id], |r| {
                Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?, r.get::<_, String>(3)?, r.get::<_, bool>(4)?, r.get::<_, bool>(5)?, r.get(6)?, r.get(7)?))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?
            .into_iter()
            .map(|(id, title, excerpt, color, pinned, archived, created_at, edited_at)| {
                Ok(NoteSummary { id, title, excerpt, color: NoteColor::from_db(&color)?, pinned, archived, created_at, edited_at, labels: Vec::new() })
            })
            .collect::<Result<Vec<_>>>()?;

        // One query for every card's labels instead of one per note.
        let mut by_note: HashMap<String, Vec<Label>> = HashMap::new();
        let mut links = conn.prepare(
            "SELECT nl.note_id, l.id, l.name FROM note_labels nl
               JOIN labels l ON l.id = nl.label_id JOIN notes n ON n.id = nl.note_id
              WHERE n.archived = ?1 ORDER BY l.name_folded",
        )?;
        for row in links.query_map([archived], |r| Ok((r.get::<_, String>(0)?, Label { id: r.get(1)?, name: r.get(2)? })))? {
            let (note_id, label) = row?;
            by_note.entry(note_id).or_default().push(label);
        }
        for note in &mut notes {
            note.labels = by_note.remove(&note.id).unwrap_or_default();
        }
        Ok(notes)
    })
    .await
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use chrono_tz::Tz;

    use super::*;
    use crate::bus::{EventBus, Recv, Subscriber};
    use crate::clock::FakeClock;
    use crate::error::ErrorCode;
    use crate::labels;

    struct Fixture {
        _dir: tempfile::TempDir,
        bus: EventBus,
        db: Arc<Database>,
        clock: FakeClock,
    }

    fn setup() -> Fixture {
        let dir = tempfile::tempdir().unwrap();
        let bus = EventBus::default();
        let db = Arc::new(Database::open(&dir.path().join("loaf.db"), bus.clone()).unwrap());
        Fixture {
            _dir: dir,
            bus,
            db,
            clock: FakeClock::new(1_000, Tz::UTC),
        }
    }

    async fn event(sub: &mut Subscriber) -> Event {
        match sub.recv().await {
            Recv::Event(e) => e,
            other => panic!("expected an event, got {other:?}"),
        }
    }

    fn input(title: &str, body: &str) -> NoteInput {
        NoteInput {
            title: title.into(),
            body: body.into(),
            ..Default::default()
        }
    }

    async fn make(f: &Fixture, title: &str, body: &str) -> Note {
        f.clock.advance_ms(10);
        create(&f.db, &f.clock, input(title, body)).await.unwrap()
    }

    // ---- create (R1-01) ------------------------------------------------------------------------

    #[tokio::test]
    async fn a_new_note_has_the_documented_defaults_and_is_announced() {
        let f = setup();
        let mut sub = f.bus.subscribe();
        let note = create(&f.db, &f.clock, input("Hackathon ideas", "- GCP setup"))
            .await
            .unwrap();
        assert_eq!(
            (note.title.as_str(), note.body.as_str()),
            ("Hackathon ideas", "- GCP setup")
        );
        assert_eq!(
            (note.color, note.pinned, note.archived),
            (NoteColor::Default, false, false)
        );
        assert_eq!((note.created_at, note.edited_at), (1_000, 1_000));
        assert!(note.labels.is_empty());
        assert_eq!(
            event(&mut sub).await,
            Event::NoteCreated {
                at: 1_000,
                note: note.clone()
            }
        );
        assert_eq!(get(&f.db, &note.id).await.unwrap(), note);
    }

    #[tokio::test]
    async fn an_empty_note_can_exist_until_its_editor_closes() {
        let f = setup();
        let note = create(&f.db, &f.clock, NoteInput::default()).await.unwrap();
        assert_eq!((note.title.as_str(), note.body.as_str()), ("", ""));
    }

    #[tokio::test]
    async fn title_and_body_limits_count_characters_and_name_the_field() {
        let f = setup();
        assert!(create(
            &f.db,
            &f.clock,
            input(&"é".repeat(200), &"x".repeat(100_000))
        )
        .await
        .is_ok());
        let err = create(&f.db, &f.clock, input(&"é".repeat(201), ""))
            .await
            .unwrap_err();
        assert_eq!(
            (err.code, err.field.as_deref()),
            (ErrorCode::Validation, Some("title"))
        );
        let err = create(&f.db, &f.clock, input("", &"x".repeat(100_001)))
            .await
            .unwrap_err();
        assert_eq!(
            (err.code, err.field.as_deref()),
            (ErrorCode::Validation, Some("body"))
        );
        assert_eq!(
            list(&f.db, false, None, NoteSort::default())
                .await
                .unwrap()
                .len(),
            1,
            "rejected notes were not saved"
        );
    }

    #[tokio::test]
    async fn a_missing_label_rejects_the_whole_create() {
        let f = setup();
        let err = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec!["nope".into()],
                ..input("x", "y")
            },
        )
        .await
        .unwrap_err();
        assert_eq!(
            (err.code, err.field.as_deref()),
            (ErrorCode::NotFound, Some("label_ids"))
        );
        assert!(
            list(&f.db, false, None, NoteSort::default())
                .await
                .unwrap()
                .is_empty(),
            "no half-created note"
        );
    }

    #[tokio::test]
    async fn labels_are_attached_sorted_by_name_with_duplicates_ignored() {
        let f = setup();
        let work = labels::create(&f.db, &f.clock, "work").await.unwrap();
        let alpha = labels::create(&f.db, &f.clock, "Alpha").await.unwrap();
        let note = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![work.id.clone(), alpha.id.clone(), work.id.clone()],
                ..input("x", "")
            },
        )
        .await
        .unwrap();
        assert_eq!(note.labels, vec![alpha, work]);
    }

    // ---- edit (R1-02 rules, R1-04) -------------------------------------------------------------

    #[tokio::test]
    async fn editing_changes_only_what_was_given_and_moves_edited_at() {
        let f = setup();
        let note = make(&f, "Title", "Body").await;
        let mut sub = f.bus.subscribe();
        f.clock.advance_ms(500);
        let updated = update(
            &f.db,
            &f.clock,
            &note.id,
            NotePatch {
                title: Some("New title".into()),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (updated.title.as_str(), updated.body.as_str()),
            ("New title", "Body")
        );
        assert_eq!(updated.created_at, note.created_at);
        assert_eq!(updated.edited_at, f.clock.now_ms());
        assert_eq!(
            event(&mut sub).await,
            Event::NoteUpdated {
                at: f.clock.now_ms(),
                note: updated
            }
        );
    }

    #[tokio::test]
    async fn an_autosave_that_changes_nothing_writes_nothing_and_says_nothing() {
        let f = setup();
        let note = make(&f, "Title", "Body").await;
        let commits = f.db.committed_transactions();
        let mut sub = f.bus.subscribe();
        f.clock.advance_ms(60_000);
        let same = update(
            &f.db,
            &f.clock,
            &note.id,
            NotePatch {
                title: Some("Title".into()),
                body: Some("Body".into()),
                color: Some(NoteColor::Default),
                label_ids: Some(vec![]),
            },
        )
        .await
        .unwrap();
        assert_eq!(same, note, "edited_at must not move when nothing changed");
        assert_eq!(
            f.db.committed_transactions(),
            commits,
            "no transaction for a no-op"
        );
        f.bus.publish(Event::AppShuttingDown { at: 0 });
        assert!(
            matches!(event(&mut sub).await, Event::AppShuttingDown { .. }),
            "no NoteUpdated for a no-op"
        );
    }

    #[tokio::test]
    async fn the_same_labels_in_a_different_order_is_not_a_change() {
        let f = setup();
        let (a, b) = (
            labels::create(&f.db, &f.clock, "a").await.unwrap(),
            labels::create(&f.db, &f.clock, "b").await.unwrap(),
        );
        let note = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![a.id.clone(), b.id.clone()],
                ..input("x", "")
            },
        )
        .await
        .unwrap();
        f.clock.advance_ms(99);
        let same = update(
            &f.db,
            &f.clock,
            &note.id,
            NotePatch {
                label_ids: Some(vec![b.id, a.id]),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(same.edited_at, note.edited_at);
    }

    #[tokio::test]
    async fn changing_colour_or_labels_counts_as_an_edit() {
        let f = setup();
        let work = labels::create(&f.db, &f.clock, "work").await.unwrap();
        let note = make(&f, "t", "b").await;
        f.clock.advance_ms(5);
        let coloured = update(
            &f.db,
            &f.clock,
            &note.id,
            NotePatch {
                color: Some(NoteColor::Teal),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (coloured.color, coloured.edited_at),
            (NoteColor::Teal, f.clock.now_ms())
        );
        f.clock.advance_ms(5);
        let labelled = update(
            &f.db,
            &f.clock,
            &note.id,
            NotePatch {
                label_ids: Some(vec![work.id.clone()]),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            (labelled.labels, labelled.edited_at),
            (vec![work], f.clock.now_ms())
        );
    }

    #[tokio::test]
    async fn editing_a_missing_note_or_past_a_limit_is_rejected_cleanly() {
        let f = setup();
        let err = update(
            &f.db,
            &f.clock,
            "nope",
            NotePatch {
                title: Some("x".into()),
                ..Default::default()
            },
        )
        .await
        .unwrap_err();
        assert_eq!(err.code, ErrorCode::NotFound);
        let note = make(&f, "t", "b").await;
        let err = update(
            &f.db,
            &f.clock,
            &note.id,
            NotePatch {
                body: Some("x".repeat(100_001)),
                ..Default::default()
            },
        )
        .await
        .unwrap_err();
        assert_eq!(err.field.as_deref(), Some("body"));
        assert_eq!(get(&f.db, &note.id).await.unwrap().body, "b");
    }

    // ---- pin and archive (R1-06, R1-07) --------------------------------------------------------

    #[tokio::test]
    async fn pinning_does_not_count_as_an_edit_and_is_idempotent() {
        let f = setup();
        let note = make(&f, "t", "b").await;
        let mut sub = f.bus.subscribe();
        f.clock.advance_ms(777);
        let pinned = set_pinned(&f.db, &f.clock, &note.id, true).await.unwrap();
        assert!(pinned.pinned);
        assert_eq!(pinned.edited_at, note.edited_at);
        assert_eq!(
            event(&mut sub).await,
            Event::NotePinnedChanged {
                at: f.clock.now_ms(),
                id: note.id.clone(),
                pinned: true
            }
        );
        let commits = f.db.committed_transactions();
        set_pinned(&f.db, &f.clock, &note.id, true).await.unwrap();
        assert_eq!(
            f.db.committed_transactions(),
            commits,
            "pinning an already-pinned note writes nothing"
        );
    }

    #[tokio::test]
    async fn archiving_moves_a_note_between_views_without_editing_it() {
        let f = setup();
        let note = make(&f, "t", "b").await;
        let mut sub = f.bus.subscribe();
        f.clock.advance_ms(1);
        let archived = set_archived(&f.db, &f.clock, &note.id, true).await.unwrap();
        assert_eq!(archived.edited_at, note.edited_at);
        assert_eq!(
            event(&mut sub).await,
            Event::NoteArchivedChanged {
                at: f.clock.now_ms(),
                id: note.id.clone(),
                archived: true
            }
        );
        assert!(list(&f.db, false, None, NoteSort::default())
            .await
            .unwrap()
            .is_empty());
        assert_eq!(
            list(&f.db, true, None, NoteSort::default())
                .await
                .unwrap()
                .len(),
            1
        );
        set_archived(&f.db, &f.clock, &note.id, false)
            .await
            .unwrap();
        assert_eq!(
            list(&f.db, false, None, NoteSort::default())
                .await
                .unwrap()
                .len(),
            1,
            "restored"
        );
    }

    #[tokio::test]
    async fn a_missing_note_cannot_be_pinned_or_archived() {
        let f = setup();
        assert_eq!(
            set_pinned(&f.db, &f.clock, "nope", true)
                .await
                .unwrap_err()
                .code,
            ErrorCode::NotFound
        );
        assert_eq!(
            set_archived(&f.db, &f.clock, "nope", true)
                .await
                .unwrap_err()
                .code,
            ErrorCode::NotFound
        );
    }

    // ---- delete with undo (R1-05) --------------------------------------------------------------

    #[tokio::test]
    async fn delete_returns_a_snapshot_and_restore_brings_back_the_identical_note() {
        let f = setup();
        let work = labels::create(&f.db, &f.clock, "work").await.unwrap();
        let note = create(
            &f.db,
            &f.clock,
            NoteInput {
                color: NoteColor::Blue,
                label_ids: vec![work.id.clone()],
                ..input("Plan", "details")
            },
        )
        .await
        .unwrap();
        set_pinned(&f.db, &f.clock, &note.id, true).await.unwrap();
        let before = get(&f.db, &note.id).await.unwrap();
        let mut sub = f.bus.subscribe();

        f.clock.advance_ms(2_000);
        let snapshot = delete(&f.db, &f.clock, &note.id).await.unwrap();
        assert_eq!(snapshot, before);
        assert_eq!(
            event(&mut sub).await,
            Event::NoteDeleted {
                at: f.clock.now_ms(),
                id: note.id.clone()
            }
        );
        assert_eq!(
            get(&f.db, &note.id).await.unwrap_err().code,
            ErrorCode::NotFound
        );

        let restored = restore(&f.db, &f.clock, snapshot).await.unwrap();
        assert_eq!(
            restored, before,
            "same id, timestamps, pin, colour and labels"
        );
        assert!(matches!(event(&mut sub).await, Event::NoteCreated { .. }));
    }

    #[tokio::test]
    async fn restoring_twice_is_a_conflict_not_a_duplicate() {
        let f = setup();
        let note = make(&f, "t", "b").await;
        let snapshot = delete(&f.db, &f.clock, &note.id).await.unwrap();
        restore(&f.db, &f.clock, snapshot.clone()).await.unwrap();
        assert_eq!(
            restore(&f.db, &f.clock, snapshot).await.unwrap_err().code,
            ErrorCode::Conflict
        );
    }

    #[tokio::test]
    async fn a_label_deleted_during_the_undo_window_is_not_reattached() {
        let f = setup();
        let (keep, gone) = (
            labels::create(&f.db, &f.clock, "keep").await.unwrap(),
            labels::create(&f.db, &f.clock, "gone").await.unwrap(),
        );
        let note = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![keep.id.clone(), gone.id.clone()],
                ..input("t", "")
            },
        )
        .await
        .unwrap();
        let snapshot = delete(&f.db, &f.clock, &note.id).await.unwrap();
        labels::delete(&f.db, &f.clock, &gone.id).await.unwrap();
        assert_eq!(
            restore(&f.db, &f.clock, snapshot).await.unwrap().labels,
            vec![keep]
        );
    }

    #[tokio::test]
    async fn deleting_a_missing_note_is_not_found() {
        let f = setup();
        assert_eq!(
            delete(&f.db, &f.clock, "nope").await.unwrap_err().code,
            ErrorCode::NotFound
        );
    }

    #[tokio::test]
    async fn only_a_note_with_no_title_and_no_body_is_discarded_on_close() {
        let f = setup();
        let empty = create(&f.db, &f.clock, NoteInput::default()).await.unwrap();
        let titled = make(&f, "kept", "").await;
        let bodied = make(&f, "", "kept").await;
        assert!(discard_if_empty(&f.db, &f.clock, &empty.id).await.unwrap());
        assert!(!discard_if_empty(&f.db, &f.clock, &titled.id).await.unwrap());
        assert!(!discard_if_empty(&f.db, &f.clock, &bodied.id).await.unwrap());
        assert_eq!(
            list(&f.db, false, None, NoteSort::default())
                .await
                .unwrap()
                .len(),
            2
        );
    }

    // ---- the list (R1-03, R1-09) ---------------------------------------------------------------

    async fn titles(f: &Fixture, archived: bool, sort: NoteSort) -> Vec<String> {
        list(&f.db, archived, None, sort)
            .await
            .unwrap()
            .into_iter()
            .map(|n| n.title)
            .collect()
    }

    #[tokio::test]
    async fn pinned_notes_come_first_then_by_last_edited() {
        let f = setup();
        let a = make(&f, "A", "").await;
        let b = make(&f, "B", "").await;
        make(&f, "C", "").await;
        set_pinned(&f.db, &f.clock, &b.id, true).await.unwrap();
        assert_eq!(
            titles(&f, false, NoteSort::LastEdited).await,
            ["B", "C", "A"]
        );
        f.clock.advance_ms(100);
        update(
            &f.db,
            &f.clock,
            &a.id,
            NotePatch {
                body: Some("edited".into()),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert_eq!(
            titles(&f, false, NoteSort::LastEdited).await,
            ["B", "A", "C"],
            "editing A lifts it above C"
        );
    }

    #[tokio::test]
    async fn the_other_sort_orders_still_put_pinned_first() {
        let f = setup();
        let a = make(&f, "A", "").await;
        let b = make(&f, "B", "").await;
        let c = make(&f, "C", "").await;
        update(
            &f.db,
            &f.clock,
            &a.id,
            NotePatch {
                color: Some(NoteColor::Red),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        update(
            &f.db,
            &f.clock,
            &b.id,
            NotePatch {
                color: Some(NoteColor::Blue),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        update(
            &f.db,
            &f.clock,
            &c.id,
            NotePatch {
                color: Some(NoteColor::Blue),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        set_pinned(&f.db, &f.clock, &a.id, true).await.unwrap();
        assert_eq!(titles(&f, false, NoteSort::Created).await, ["A", "C", "B"]);
        assert_eq!(
            titles(&f, false, NoteSort::Color).await,
            ["A", "C", "B"],
            "A pinned; then blue (C edited after B) before nothing else"
        );
    }

    #[tokio::test]
    async fn the_archive_view_ignores_pinning() {
        let f = setup();
        let a = make(&f, "A", "").await;
        let b = make(&f, "B", "").await;
        set_pinned(&f.db, &f.clock, &a.id, true).await.unwrap();
        set_archived(&f.db, &f.clock, &a.id, true).await.unwrap();
        set_archived(&f.db, &f.clock, &b.id, true).await.unwrap();
        assert_eq!(
            titles(&f, true, NoteSort::LastEdited).await,
            ["B", "A"],
            "newest edit first; the pinned flag does nothing here"
        );
    }

    #[tokio::test]
    async fn a_card_shows_at_most_200_characters_of_the_body() {
        let f = setup();
        make(&f, "long", &"x".repeat(500)).await;
        make(&f, "wide", &"é".repeat(300)).await;
        let cards = list(&f.db, false, None, NoteSort::default()).await.unwrap();
        for card in cards {
            assert_eq!(
                card.excerpt.chars().count(),
                EXCERPT_CHARS,
                "{}",
                card.title
            );
        }
    }

    #[tokio::test]
    async fn filtering_by_label_shows_only_notes_with_it_and_cards_carry_their_labels() {
        let f = setup();
        let work = labels::create(&f.db, &f.clock, "work").await.unwrap();
        let home = labels::create(&f.db, &f.clock, "home").await.unwrap();
        f.clock.advance_ms(1);
        create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![work.id.clone(), home.id.clone()],
                ..input("both", "")
            },
        )
        .await
        .unwrap();
        f.clock.advance_ms(1);
        create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![home.id.clone()],
                ..input("home only", "")
            },
        )
        .await
        .unwrap();
        f.clock.advance_ms(1);
        make(&f, "none", "").await;

        let only_work = list(&f.db, false, Some(&work.id), NoteSort::default())
            .await
            .unwrap();
        assert_eq!(
            only_work
                .iter()
                .map(|n| n.title.as_str())
                .collect::<Vec<_>>(),
            ["both"]
        );
        assert_eq!(
            only_work[0].labels,
            vec![home.clone(), work.clone()],
            "cards list every label, sorted by name"
        );
        assert_eq!(
            list(&f.db, false, Some(&home.id), NoteSort::default())
                .await
                .unwrap()
                .len(),
            2
        );
        assert_eq!(
            list(&f.db, false, None, NoteSort::default())
                .await
                .unwrap()
                .len(),
            3
        );
    }

    #[tokio::test]
    async fn sidebar_label_counts_exclude_archived_notes() {
        let f = setup();
        let work = labels::create(&f.db, &f.clock, "work").await.unwrap();
        let live = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![work.id.clone()],
                ..input("live", "")
            },
        )
        .await
        .unwrap();
        let old = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![work.id.clone()],
                ..input("old", "")
            },
        )
        .await
        .unwrap();
        assert_eq!(labels::list(&f.db).await.unwrap()[0].count, 2);
        set_archived(&f.db, &f.clock, &old.id, true).await.unwrap();
        assert_eq!(labels::list(&f.db).await.unwrap()[0].count, 1);
        let _ = live;
    }

    #[tokio::test]
    async fn deleting_a_label_keeps_the_notes_that_had_it() {
        let f = setup();
        let work = labels::create(&f.db, &f.clock, "work").await.unwrap();
        let note = create(
            &f.db,
            &f.clock,
            NoteInput {
                label_ids: vec![work.id.clone()],
                ..input("keep me", "")
            },
        )
        .await
        .unwrap();
        labels::delete(&f.db, &f.clock, &work.id).await.unwrap();
        let after = get(&f.db, &note.id).await.unwrap();
        assert_eq!(after.title, "keep me");
        assert!(after.labels.is_empty());
        assert_eq!(
            after.edited_at, note.edited_at,
            "losing a label is not an edit of the note"
        );
    }
}
