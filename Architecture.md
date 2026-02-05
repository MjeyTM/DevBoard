# Architecture

## Data Model

All entities use stable UUIDs.

- Project: `projectId`, `name`, `slug`, `description`, `status`, `techStack`, `repoLinks`, timestamps
- Task: `taskId`, `projectId`, `title`, `description`, `type`, `status`, `priority`, `severity`, `effort`, dates, tags, dependencies, checklist, attachments, time logs, `linkedNoteIds`
- Note: `noteId`, `projectId`, `title`, `content`, tags, `linkedTaskIds`
- Settings: theme, calendar mode, statuses, font preferences, saved views

## Storage Approach

IndexedDB via Dexie (`src/data/db.ts`). Tables:

- `projects`: indexed by `projectId`, `status`, `updatedAt`, `techStack`
- `tasks`: indexed by `taskId`, `projectId`, `status`, `dueDate`, `updatedAt`, `type`, `priority`, `tags`
- `notes`: indexed by `noteId`, `projectId`, `updatedAt`, `tags`
- `settings`: single record keyed by `id = "settings"`

Data is accessed through small CRUD helpers in `src/data/api.ts` and live queries via `dexie-react-hooks`.

## Jalali / Gregorian Handling

Dates are stored in ISO `YYYY-MM-DD` format. The UI uses a calendar abstraction in `src/lib/date.ts`:

- Gregorian display uses `date-fns`.
- Jalali display uses `jalaali-js` conversions for rendering and parsing.
- Inputs accept Jalali values when the calendar setting is `jalali` and convert to ISO on write.

## Kanban Drag/Drop

Kanban uses `@dnd-kit/core` with per-column droppable zones. Dragging a task into another column updates the task `status` directly. Status columns are user-configurable in Settings.

## Migration Strategy

Schema versioning is tracked in `DB_SCHEMA_VERSION` in `src/data/db.ts`. Export payloads include the schema version. Imports reject newer versions. Future migrations should add new Dexie versions and migrate data at the DB layer before accepting imports.
