# Project progression (aura-speak)

Living record of how the app evolved through recent work. Update this file when you ship meaningful changes.

---

## What this project is

- **Stack:** Next.js (App Router), React, Tailwind, shadcn/ui, Radix.
- **Assistant:** RAG chat against a local/remote LLM (e.g. Ollama) with knowledge base uploads.
- **Avatar:** LiveAvatar embed (`POST /v2/embeddings`) for an iframe session URL; optional legacy HeyGen streaming when `AVATAR_BACKEND=heygen`.
- **Layout:** Dashboard with sidebar (Overview, Knowledge, Models, Avatar, Chat, Settings, etc.).

---

## Progression timeline

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
| `app/(dashboard)/chat` | Chat + avatar split view |
| `components/views/ChatPage.tsx` | Stream chat, preload embed, reload handler |
| `components/views/Overview.tsx` | Onboarding + chat, no avatar |
| `components/AvatarPanel.tsx` | Status, iframe, reload, help text |
| `components/views/AvatarSettings.tsx` | Keys, avatar/context, sandbox, FULL/LITE explainer |
| `lib/providers/ollama.ts` | Streaming chunk assembly |
| `lib/services/liveAvatarSession.ts` | Embeddings request, errors, max duration |
| `lib/services/avatarService.ts` | HeyGen vs LiveAvatar, sandbox + Wayne check |
| `lib/constants/liveavatar.ts` | Wayne sandbox avatar ID |
| `services/api.ts` | `askQuestionStream`, `triggerAvatar`, config from localStorage |

---

## Suggested next steps (not done)

1. **Stay on embed:** Tune sandbox, `LIVEAVATAR_MAX_SESSION_DURATION_SECONDS`, and LiveAvatar console settings (context, voice).
2. **LITE mode (larger effort):** Backend LITE session token + start; frontend Web SDK; pipe TTS audio from your stack after chat — see LiveAvatar LITE docs.

---

*Last updated from engineering notes; amend as the project grows.*
