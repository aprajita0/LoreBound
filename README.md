# Lorebound

Lorebound is a private writing and world-building workspace for authors.

It combines a focused manuscript editor with structured tools for tracking characters, relationships, places, timelines, lore, and secrets. Authors can build everything manually or upload existing material for future AI-assisted extraction and review.

The goal is not to have AI write the story. Lorebound is designed to help authors understand, organize, and protect the story they are already writing.

## Current Features

### Writing workspace

- Rich-text manuscript editor powered by TipTap
- Separate chapters with editable titles and subtitles
- Automatic saving and word counts
- Chapter status tracking
- Chapter duplication and version snapshots
- Focus and typewriter writing modes
- Configurable typography and spacing

### World building

- Character profiles with portraits and image cropping
- Character roles, aliases, statuses, and summaries
- Visual relationship tracking between characters
- Timeline events
- Hierarchical places and locations
- Searchable lore encyclopedia
- Private story secrets
- World synopsis, genre, title, and cover customization

### Document sources

- Upload DOCX, TXT, and Markdown files
- Private Supabase Storage bucket
- Per-user and per-world file organization
- Duplicate detection using SHA-256 checksums
- Upload status and error tracking
- Support for manuscripts, world bibles, reference notes, and other sources
- Import modes for storage, analysis, or both

Document parsing and AI extraction are currently in development. Uploaded documents are stored privately but are not automatically added to the manuscript yet.

### Account and privacy

- Supabase authentication
- Row Level Security on user-owned data
- Private document storage
- Temporary signed URLs for private downloads
- Separate data access for each account
- Light and dark themes

## Why Lorebound?

Long-form stories quickly accumulate information across dozens of chapters: identities, locations, relationships, promises, historical events, secrets, and rules of the world.

Most writing tools either focus only on the document or require authors to manually duplicate everything into a separate encyclopedia.

Lorebound is being built around a different workflow:

1. Write directly in Lorebound or upload existing material.
2. Keep structured world-building records alongside the manuscript.
3. Let the system identify possible characters, relationships, lore, and contradictions.
4. Review every suggestion before it becomes part of the world's canon.

The author remains in control of the story.

## Technology

### Frontend

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- TipTap
- Motion
- Lucide Icons

### Backend and data

- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase Storage
- SQL migrations

Supabase currently provides the backend infrastructure. The browser communicates with Supabase using the signed-in user's session, while database and Storage policies enforce ownership.

Future document parsing and AI processing will run in trusted server-side functions rather than exposing privileged credentials in the frontend.

## Project Structure

```text
LoreBound/
├── public/
├── src/
│   ├── components/
│   │   ├── app/
│   │   ├── characters/
│   │   ├── documents/
│   │   ├── lore/
│   │   ├── manuscript/
│   │   ├── places/
│   │   ├── relationships/
│   │   ├── secrets/
│   │   ├── timeline/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── styles.css
├── supabase/
│   ├── migrations/
│   └── config.toml
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Routes define the application screens, while files under `src/services` contain the data-access layer for Supabase.

## Running Lorebound Locally

### Requirements

Install the following first:

- Node.js
- npm
- Supabase CLI
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/aprajita0/LoreBound.git
cd LoreBound
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Only the publishable key belongs in the frontend.

Never place a Supabase secret key or service-role key in a variable beginning with `VITE_`. Vite exposes those variables to browser code.

### 4. Link the Supabase project

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

The project reference is the identifier from your Supabase project URL, not the complete URL.

### 5. Apply database migrations

```bash
npx supabase db push
```

This creates the project tables, constraints, indexes, Row Level Security policies, and Storage configuration tracked by the repository.

### 6. Start the development server

```bash
npm run dev
```

Open the local URL shown by Vite, typically:

```text
http://localhost:8080
```

## Document Upload Flow

Lorebound currently handles uploads using the following flow:

```text
Select document
      ↓
Validate type and size
      ↓
Calculate SHA-256 checksum
      ↓
Create source_documents record
      ↓
Upload to private Storage
      ↓
Mark document as uploaded
```

Private files are stored using this structure:

```text
USER_ID/WORLD_ID/DOCUMENT_ID/filename.docx
```

The supported formats are:

- `.docx`
- `.txt`
- `.md`

The current maximum file size is 25 MB.

## Data Security

Lorebound uses PostgreSQL Row Level Security to isolate user data.

An authenticated user should only be able to read or modify records belonging to worlds they own. Uploaded source documents are stored in a private bucket and require an authenticated request or temporary signed URL.

Project administrators can access project data through the Supabase Dashboard. RLS protects users from other application users; it does not hide data from the database owner.

The Supabase service-role key must never be included in frontend code.

## AI Direction

Lorebound's planned AI system is focused on story understanding rather than story generation.

The planned pipeline is:

1. Parse uploaded manuscripts and world-building documents.
2. Divide documents into traceable sections.
3. Extract structured candidates such as characters, places, relationships, lore, and secrets.
4. Attach evidence from the original text.
5. Detect possible duplicates and conflicts.
6. Present suggestions to the author for review.
7. Add only approved information to the world's canon.
8. Generate embeddings for semantic search and continuity retrieval.

AI-generated suggestions will never silently overwrite an author's records.

## Roadmap

- [x] Authentication and protected worlds
- [x] Manuscript editor
- [x] Chapter management and autosaving
- [x] Character records and portraits
- [x] Character relationship graph
- [x] Timeline events
- [x] Places and location hierarchy
- [x] Lore encyclopedia
- [x] Secrets workspace
- [x] Private source-document uploads
- [ ] Uploaded-document management panel
- [ ] DOCX, TXT, and Markdown parsing
- [ ] Chapter import review
- [ ] Structured extraction candidates
- [ ] Author approval workflow
- [ ] Embeddings and semantic search
- [ ] Knowledge retrieval
- [ ] Continuity and contradiction detection
- [ ] Export tools

## Development Principles

Lorebound is built around several rules:

- Manual tools remain fully available.
- Uploading a document is optional.
- AI suggestions are not automatically canon.
- Authors must be able to inspect the source evidence.
- Private writing must remain private from other users.
- The interface should feel like a writing environment, not an administration dashboard.

## Status

Lorebound is under active development.

The core writing and world-building tools are functional. Document ingestion and AI-assisted story analysis are the current focus.

## Author

Built by [Aprajita Srivastava](https://github.com/aprajita0).
