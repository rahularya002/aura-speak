# Project progression (aura-speak)

Living record of how the app evolved through recent work. Update this file when you ship meaningful changes.

**Last updated:** 2026-04-14

---

## What this project is

- **Stack:** Next.js 16 (App Router), React 18, TypeScript, Tailwind 4, shadcn/ui, Radix, TanStack Query, Vitest (minimal example test).
- **Assistant:** RAG chat against a local or remote LLM (Ollama, LM Studio, LocalAI / OpenAI-compatible) with PDF (and related) knowledge uploads, chunking, and retrieval.
- **Data:** SQLite (`better-sqlite3`) under `.data/app.db` — assistants, per-assistant config, documents, embedding chunks, and chat history. Legacy JSON under `.data/` is migrated via `scripts/migrate-to-sqlite.ts` (one-time).
- **Multi-assistant:** CRUD via `/api/assistants`; the UI passes `assistant_id` (from `AssistantContext` / `localStorage`) through `services/api.ts` for config, chat, knowledge, models, and avatar calls.
- **Avatar:** LiveAvatar embed (`POST /v2/embeddings`) for an iframe session URL; optional HeyGen path; request body can choose `provider: "liveavatar" | "heygen"`.
- **Layout:** Dashboard with sidebar (home/overview, knowledge, models, avatar, chat, settings, deployment). Public embed route: `/embed/[assistantId]`.

---

## Progression timeline

### Backend platform (embedded API + SQLite)

Planned and implemented per internal plans (`next.js_ai_backend`, `backend_platform_completion`):

- **API routes (App Router, `runtime = "nodejs"` where needed):**  
  `POST/GET /api/assistants`, `GET/DELETE /api/assistants/[id]`, `GET/PUT /api/config`, `GET/POST /api/knowledge`, `DELETE /api/knowledge/[id]`, `POST /api/reindex`, `POST /api/chat`, `GET /api/chat/history`, `GET/POST /api/models`, `POST /api/models/connect` (alias), `POST /api/avatar`, `GET /api/health`, plus LiveAvatar helper `POST /api/liveavatar/contexts` where applicable.
- **Services:** `lib/services/*` — LLM generation, embeddings, RAG ingest/retrieve, avatar (HeyGen vs LiveAvatar), model discovery.
- **Providers:** `lib/providers/*` — Ollama, LM Studio, LocalAI, shared OpenAI-compatible helpers.
- **Streaming:** Chat streams structured SSE-style JSON lines (`data: {"type":"token",...}\n\n`); `services/api.ts` parses tokens, optional `sources`, and completion — documented in plan as the stable wire format for the UI.
- **Validation & errors:** Zod schemas in `lib/api/schemas.ts`; structured JSON errors via `lib/api/errors.ts`.
- **Optional Postgres:** `lib/store/optionalPg.ts` documents a future `pg` + `pgvector` swap; default storage is SQLite + JSON embedding columns.

### UI & layout (Chat)

- **Chat page layout:** Avatar column + chat column; removed empty left “spacer” so only avatar + chat remain on large screens.
- **Avatar panel:** Flex layout so the video area fills height below the status bar; iframe uses absolute fill to avoid empty bands.
- **Radix Select:** Fixed “uncontrolled → controlled” warning by using `value={contextId}` (never `undefined`) for the context picker in Avatar Settings.

### Avatar preload & HeyGen

- **Preload:** Chat page calls `triggerAvatar("")` on load so the embed can appear before the first message (with a guard to avoid double preload under React Strict Mode in dev).
- **HeyGen:** `streaming.task` runs only when `text` is non-empty after trim, so empty preload does not send a bogus task.
- **API:** `avatarBodySchema` allows `text` default `""` for preload requests.

### Overview page

- **User request:** Avatar should not live on Overview; onboarding should return.
- **Current behavior:** Overview is chat + welcome/onboarding (knowledge/model cards, suggested prompts) **without** the avatar column. Avatar + chat together live on the **Chat** route.

### Streaming chat quality (Ollama)

- **Issue:** Garbled assistant text (wrong slice of streamed chunks).
- **Cause:** Ollama can send **delta** chunks or **cumulative** `message.content`; code assumed cumulative only.
- **Fix:** Hybrid logic in `lib/providers/ollama.ts` — if new content extends the previous string, emit the suffix; otherwise treat as delta and append.

### LiveAvatar errors & sandbox

- **Iframe errors** (“Bad request”, “Session not found” on `/v1/sessions/start`) come from **LiveAvatar’s** embed app, not Next.js.
- **Sandbox rule (documented by LiveAvatar):** Sandbox only supports the **Wayne** avatar ID (`dd73ea75-1218-4ef3-92ce-606d5f7fbc0a`). Using another avatar with sandbox on can yield a URL but **session start** fails with 400.
- **Validation:** Server rejects sandbox + non-Wayne avatar with a clear error before creating a broken embed.
- **Errors:** Richer parsing of LiveAvatar JSON errors; `LiveAvatarHttpError` forwards upstream HTTP status when possible; client `triggerAvatar` surfaces non-string error bodies.
- **UX:** “Reload session” remounts the iframe with a fresh embed URL; toasts on failed embed load; help copy under the avatar panel.

### LiveAvatar FULL vs LITE (documentation)

- **FULL vs LITE** are LiveAvatar **session** modes (`/v1/sessions/token`), not switches on `/v2/embeddings`.
- **This app** uses the **Embed API** → hosted iframe → **FULL-style** managed pipeline and billing.
- **LITE** (BYO STT/LLM/TTS, lower per-minute credits) would need token + Web SDK + audio piping — **not implemented**; explained in Avatar Settings and the chat avatar strip.

### Credit / session controls

- Optional env **`LIVEAVATAR_MAX_SESSION_DURATION_SECONDS`:** passed as `max_session_duration` on `POST /v2/embeddings` to cap session length.

---

## File / area map (high level)

| Area | Role |
|------|------|
| `app/api/*` | REST handlers: assistants, config, chat, history, knowledge, reindex, models, health, avatar, LiveAvatar contexts |
| `lib/db/client.ts` | SQLite connection, schema init, legacy JSON migration hooks |
| `lib/store/configStore.ts` | Per-assistant config read/write |
| `lib/store/assistantsStore.ts` | Assistant rows and listing |
| `lib/store/chatStore.ts` | Chat message persistence |
| `lib/store/vectorStore.ts` / `ragService.ts` | Documents and chunks scoped by `assistant_id` |
| `contexts/AssistantContext.tsx` | Current assistant + sync with API/localStorage |
| `app/(dashboard)/chat` | Chat + avatar split view |
| `app/embed/[assistantId]` | Embeddable assistant chat surface |
| `components/views/ChatPage.tsx` | Stream chat, preload embed, reload handler |
| `components/views/Overview.tsx` | Onboarding + chat, no avatar |
| `components/AvatarPanel.tsx` | Status, iframe, reload, help text |
| `components/views/AvatarSettings.tsx` | Keys, avatar/context, sandbox, FULL/LITE explainer |
| `lib/providers/ollama.ts` | Streaming chunk assembly |
| `lib/services/liveAvatarSession.ts` | Embeddings request, errors, max duration |
| `lib/services/avatarService.ts` | HeyGen vs LiveAvatar, sandbox + Wayne check |
| `lib/constants/liveavatar.ts` | Wayne sandbox avatar ID |
| `services/api.ts` | Same-origin `/api/*`, `assistant_id` query/body, `askQuestionStream`, `triggerAvatar`, etc. |
| `scripts/migrate-to-sqlite.ts` | One-time migration from legacy `.data/*.json` |

---

## Health check

- **`GET /api/health`** returns `{ status, providers: { ollama }, db }` — probes default config’s Ollama/LM base for tags and verifies DB open.

---

## Suggested next steps (not done)

1. **Integration tests:** Assistant delete cascades; RAG isolation (two assistants, overlapping doc names) — called out in backend plan.
2. **Stay on embed:** Tune sandbox, `LIVEAVATAR_MAX_SESSION_DURATION_SECONDS`, and LiveAvatar console settings (context, voice).
3. **LITE mode (larger effort):** Backend LITE session token + start; frontend Web SDK; pipe TTS audio from your stack after chat — see LiveAvatar LITE docs.
4. **Postgres / pgvector:** If you need multi-node or very large corpora, implement the optional path described in `lib/store/optionalPg.ts`.

---

*Amend this file as the project grows.*
