<div align="center">

# CHO Planner

**A personal task and note manager with a swappable AI assistant and optional Google Calendar sync.**

Local-first, *Bring Your Own Keys*, mobile-first architecture. Built for everyday life and work.

[Español](README.md) · **English**

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-5-000000?style=flat-square&logo=auth0&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

</div>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Swappable AI layer](#swappable-ai-layer)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Optional integrations](#optional-integrations)
- [Security](#security)
- [Roadmap](#roadmap)
- [Credits and licenses](#credits-and-licenses)
- [License](#license)

---

## Overview

CHO Planner is a task and note manager in the spirit of Linear or ClickUp, but deliberately simpler, suited to both everyday life and work. Its defining feature is a **customizable AI assistant** —with its own avatar, name, and personality— that breaks goals down into subtasks with priority weights and, optionally, syncs your work with **Google Calendar**.

The design rests on four principles:

| Principle | What it means |
|-----------|---------------|
| **Local-first / self-hosted** | The app works 100% without external services. Integrations are additive, never required. |
| **Bring Your Own Keys (BYOK)** | Each user supplies their own credentials (Google account, LLM API key). They are stored encrypted; the operator is not a custodian of third-party credentials. |
| **Mobile-first responsive** | A single web codebase that adapts to phone, tablet, and desktop. No React Native, no native port. |
| **Swappable AI** | The user picks the provider (Claude, GPT, Gemini…). Switching models does not change the **structure** of what gets generated, only the wording. |

---

## Features

**Core (works without external integrations)**

- Credentials-based authentication (email + password) with a personalized greeting.
- Workspaces with their own name, description, color, and icon.
- Kanban board with drag and drop across columns (To do / In progress / Done), persisting order.
- Tasks with title, description, priority weight (1–10), status, and due date.
- Atomic, lightweight subtasks (title + optional short note + weight + status).
- Sprints: grouping tasks into periods with a goal and dates.
- Markdown notes, inside a workspace or standalone, with an optional reminder.
- Installable PWA: service worker with an offline page; API routes are never cached.

**AI generation**

- Customizable assistant: avatar (DiceBear), name, and a *persona* injected into the system prompt.
- Work plans: the assistant breaks a goal into subtasks with weights and suggested dates.
- Multi-provider: the user configures API keys for different LLMs and chooses which to use.
- Every AI output is validated against a schema (Zod) with retries before it touches the database.

**Optional integration (Google Calendar)**

- Connection via OAuth 2.0 with the user's own account.
- Tasks, sprints, and notes with a reminder can be pushed to Google Calendar, always with explicit confirmation.

---

## Screenshots

<div align="center">

### Kanban board
Tasks with weight-based priority, an AI-generated badge, and subtask progress, with drag and drop across columns.

<img src="docs/screenshots/board.png" width="820" alt="Kanban board with tasks" />

<br /><br />

### AI assistant
Breaks a goal into subtasks with weights and suggested dates; chat with a customizable avatar and persona.

<img src="docs/screenshots/ai.png" width="820" alt="AI assistant generating a plan" />

<br /><br />

| Mobile view | Settings |
|:---:|:---:|
| <img src="docs/screenshots/mobile.png" width="300" alt="Board on mobile" /> | <img src="docs/screenshots/settings.png" width="420" alt="API keys management and Google connection" /> |

</div>

---

## Architecture

The entire backend lives **inside Next.js** (Server Actions and Route Handlers); there is no separate server. The instance is self-contained: external integrations are optional and added whenever the user decides.

```
┌──────────────────────────────────────────────┐      ┌────────────────────────┐
│  YOUR INSTANCE (works with nothing external)   │ ───▶ │  Google Calendar       │
│                                                 │      │  optional · OAuth 2.0  │
│   ┌───────────┐      ┌────────────────┐        │      └────────────────────────┘
│   │ Next.js   │      │ PostgreSQL     │        │
│   │ UI + API  │◀────▶│ your data      │        │      ┌────────────────────────┐
│   │ (RSC,     │      │                │        │ ───▶ │  LLM provider          │
│   │  Actions) │      └────────────────┘        │      │  optional · your key   │
│   └───────────┘                                 │      │  Claude / GPT / Gemini │
│   ┌───────────────────────────────┐            │      └────────────────────────┘
│   │ Credentials vault              │            │
│   │ API keys and refresh token     │            │
│   │ encrypted with AES-256-GCM      │            │
│   │ never leave the instance        │            │
│   └───────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

Anyone clones the repository, configures their `.env`, spins up Postgres with Docker, and gets a working task manager. Calendar and LLM are added once the user supplies their credentials.

---

## Swappable AI layer

The model **never** decides the format or executes actions directly: it only fills a structure defined in code (a **Zod** schema). The code validates the output against that schema before using it and, if it doesn't comply, retries by re-injecting the validation error. This guarantees a roadmap generated by Gemini has exactly the same fields as one from Claude.

```
The app defines the contract (prompt + Zod schema)
        │
        ▼
Single adapter (Vercel AI SDK) ──▶ routes to the provider chosen by the user
        │        ├─▶ Claude  (native tool use)
        │        ├─▶ GPT     (structured outputs)
        │        └─▶ Gemini  (response schema)
        ▼
Validation against the Zod schema ──▶ compliant? if not, retry (max 3)
        ▼
Structurally identical data ──▶ DB · board · Calendar
```

Each model is declared in a `MODEL_REGISTRY` with its level of structured-output support (`full` / `partial`), so the UI only offers reliable models for generation.

---

## Tech stack

### Frontend

| Tool | Role |
|------|------|
| **Next.js 16** (App Router) + **React 19** + **TypeScript** | Framework and typing |
| **Tailwind CSS 4** | Mobile-first responsive styling |
| **shadcn/ui** + **Radix UI** | Accessible, headless component primitives, styled to taste |
| **dnd-kit** | Drag and drop with touch sensors |
| **next-themes** | Light/dark mode without flicker |
| **DiceBear** | Assistant avatar generation |
| **react-markdown** + **remark-gfm** | Markdown rendering for notes |
| **sonner** | Notifications |
| **PWA** (Web App Manifest + Service Worker) | Installable app with offline support |

### Backend (inside Next.js)

| Tool | Role |
|------|------|
| **Server Actions** | CRUD for all entities |
| **Route Handlers** | Chat streaming, Google OAuth callback, sync |
| **Prisma 6** | ORM |
| **PostgreSQL 17** | Database |
| **Auth.js (NextAuth v5)** | Credentials-based authentication |
| **bcryptjs** | Password hashing |

### Artificial intelligence

| Tool | Role |
|------|------|
| **Vercel AI SDK** (`ai`) | Single multi-provider adapter |
| `@ai-sdk/anthropic` · `@ai-sdk/openai` · `@ai-sdk/google` | LLM providers |
| **Zod** | Structured-output contract and validation |

### Google Calendar and security

| Tool | Role |
|------|------|
| **googleapis** | Official client; OAuth 2.0 with incremental `syncToken` |
| **AES-256-GCM** | Encryption of API keys and refresh tokens at rest |

### Infrastructure

| Tool | Role |
|------|------|
| **Docker Compose** | Local Postgres for development |
| **Vercel** + managed database (Neon / Supabase) | Suggested demo deployment |

---

## Data model

The model revolves around `User`, the owner of everything in cascade. Ten entities cover identity, content, and integrations.

| Entity | Purpose |
|--------|---------|
| **User** | Account. Separate `firstName`/`lastName` for the personalized greeting. |
| **Assistant** | AI assistant identity: name, avatar style, `avatarConfig` (JSON), and `persona`. Its own entity because it groups identity + behavior. |
| **ApiKey** | An LLM provider API key, encrypted (AES-256-GCM). Unique per `(userId, provider)`. |
| **GoogleAccount** | OAuth link: encrypted refresh token, `scope`, `calendarId`, and `syncToken`. |
| **Workspace** | Work container with name, description, color, and icon. |
| **Sprint** | Time-boxed grouping of tasks with a goal and dates. |
| **Task** | Task with `title` (what) + `description` (how), `weight` 1–10, status, `aiGenerated`, and `position`. |
| **Subtask** | Lightweight atomic unit: title + short note + weight + `done`. |
| **Note** | Markdown note, tied to a workspace or standalone, with an optional reminder. |
| **CalendarEvent** | Event reusable by Task, Sprint, or Note; stores the `googleEventId` to update/delete in Google. |

**Notable design decisions**

- `Assistant` stores its appearance as **JSON** (`avatarConfig`) because its parameters vary by avatar library; a rigid table would force a schema migration on every style change.
- `Task` separates **title (what)** from **description (how)**; subtasks are kept lightweight on purpose (if a subtask needs a long description, it should be a task).
- `CalendarEvent` is a **separate table** so it can be reused across Task, Sprint, and Note and keep the `googleEventId`.
- `position` persists drag-and-drop order; `aiGenerated` flags cards created by the assistant.

### Entity-relationship diagram

```mermaid
erDiagram
    User ||--o| Assistant : has
    User ||--o{ Workspace : owns
    User ||--o{ Note : writes
    User ||--o{ ApiKey : configures
    User ||--o| GoogleAccount : connects
    Workspace ||--o{ Task : contains
    Workspace ||--o{ Sprint : contains
    Workspace ||--o{ Note : groups
    Sprint ||--o{ Task : groups
    Task ||--o{ Subtask : breaks down
    Task ||--o| CalendarEvent : syncs
    Sprint ||--o| CalendarEvent : syncs
    Note ||--o| CalendarEvent : syncs

    User {
        string id PK
        string email UK
        string firstName
        string lastName
        string defaultProvider
    }
    Task {
        string id PK
        string title
        string description
        int weight
        enum status
        boolean aiGenerated
        int position
        datetime dueDate
    }
    Subtask {
        string id PK
        string title
        string note
        int weight
        boolean done
    }
    CalendarEvent {
        string id PK
        string googleEventId UK
        datetime startsAt
        boolean synced
    }
```

The full Prisma schema lives in [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Project structure

```
cho-planner/
├── prisma/
│   ├── schema.prisma          # 10 models + TaskStatus enum
│   └── seed.ts                # sample data (demo user)
├── src/
│   ├── app/
│   │   ├── (auth)/            # login and registration
│   │   ├── (dashboard)/       # board, sprints, notes, chat, settings
│   │   └── api/               # chat (streaming), google (OAuth), calendar (sync)
│   ├── components/            # ui, board, chat, assistant, note
│   ├── lib/
│   │   ├── crypto.ts          # AES-256-GCM encrypt/decrypt
│   │   ├── ai/                # registry, schemas (Zod), generate, provider
│   │   └── google/            # oauth, calendar
│   ├── server/actions/        # Server Actions (CRUD per entity)
│   └── validations/           # input schemas
├── docker-compose.yml         # local Postgres
├── .env.example               # variables template (no secrets)
└── package.json
```

---

## Getting started

### Requirements

- **Node.js 20+**
- **Docker Desktop** (for the local database)

### 1. Clone and install

```bash
git clone https://github.com/<YOUR-USERNAME>/cho-planner.git
cd cho-planner
npm install
```

### 2. Configure environment variables

Copy the template and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string. With the included `docker-compose`: `postgresql://taskmanager:taskmanager@localhost:5433/taskmanager` |
| `AUTH_SECRET` | Auth.js secret. Generate one with `openssl rand -base64 32` |
| `AUTH_URL` | App base URL. Locally: `http://localhost:3000` |
| `ENCRYPTION_KEY` | 32-byte hex key to encrypt credentials. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — only for Google Calendar (see below) |
| `DEFAULT_LLM_PROVIDER` / `DEFAULT_LLM_API_KEY` | Optional — default demo LLM |

> The `.env` file is in `.gitignore` and must **never** be committed. Each user's API keys do not go here: they are captured in the app and stored encrypted in the database.

### 3. Start the database

```bash
docker compose up -d
```

> The container publishes Postgres on host **port 5433** to avoid clashing with a native install on 5432. If you change the port, update `DATABASE_URL`.

### 4. Apply the schema and (optionally) load sample data

```bash
npx prisma migrate dev      # creates the tables
npm run db:seed             # loads a sample workspace (optional)
```

The seed creates a test user:

```
Email:    demo@choplanner.local
Password: demo1234
```

### 5. Run in development

```bash
npm run dev
```

Open **http://localhost:3000**, register or sign in with the demo account, and start creating workspaces and tasks. AI and Google Calendar work as soon as you add your credentials (next section).

---

## Optional integrations

### AI assistant (LLM)

1. Go to **Settings** inside the app.
2. Add the API key for your preferred provider (Anthropic, OpenAI, or Google).
3. The key is encrypted with AES-256-GCM and stored in the database; it never returns to the frontend.
4. Pick the model in the chat or in the plan generator.

### Google Calendar

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/), configure the OAuth consent screen, and obtain `client_id` and `client_secret`.
2. Add this authorized redirect URI: `http://localhost:3000/api/google/callback`.
3. Use the **minimal scope** `https://www.googleapis.com/auth/calendar.events`.
4. Fill `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
5. In **Settings**, click *Connect Google Calendar*. The refresh token is stored encrypted and every event push asks for explicit confirmation.

---

## Security

- API keys and refresh tokens are stored **encrypted with AES-256-GCM**, never in plain text.
- Credentials are never sent to the frontend; chat and generation run on the server.
- Passwords are stored with **bcrypt** hashing.
- Every CRUD operation is scoped to the session's `userId`.
- Google Calendar uses OAuth 2.0 with a minimal scope and explicit confirmation before any action.

---

## Roadmap

- [x] Foundation: Next.js + Prisma + Postgres + Auth.js
- [x] Workspaces and tasks with a Kanban board
- [x] Drag and drop with order persistence
- [x] Subtasks, sprints, and notes
- [x] Multi-provider AI assistant with validated output
- [x] Assistant avatar and persona
- [x] Google Calendar integration
- [x] Responsive polish and sample data
- [x] PWA: installable, with a service worker and offline page

---

## Credits and licenses

The assistant avatars are generated with **[DiceBear](https://www.dicebear.com/)** (library under the MIT license, by Florian Körner). Each avatar style has its own author and license. The `Adventurer`, `Micah`, and `Fun Emoji` styles are published under **CC BY 4.0**, which requires attribution; this project fulfills it with the table below:

| Style | Author | License | Original source |
|-------|--------|---------|-----------------|
| **Notionists** | Zoish | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | <https://heyzoish.gumroad.com/l/notionists> |
| **Lorelei** | Lisa Wischofsky | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | <https://www.figma.com/community/file/1198749693280469639> |
| **Adventurer** | Lisa Wischofsky | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.figma.com/community/file/1184595184137881796> |
| **Micah** (*Avatar Illustration System*) | Micah Lanier | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.figma.com/community/file/829741575478342595> |
| **Fun Emoji** (*Fun Emoji Set*) | Davis Uche | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.figma.com/community/file/968125295144990435> |
| **Bottts** | Pablo Stanley | Free for personal and commercial use | <https://bottts.com/> |

---

## License

This project is distributed under the **MIT** license. See the [LICENSE](LICENSE) file.

<div align="center">
<sub>Built as a portfolio project. Local-first, with no custody of third-party credentials.</sub>
</div>
