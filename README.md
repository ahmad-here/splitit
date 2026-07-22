# Splitit — AI Bill Splitting

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangChain-LangGraph-1C3C3C)](https://langchain-ai.github.io/langgraphjs/)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev/)

Snap a photo of a receipt — or just describe the bill in plain text — and an LLM
reads the items and splits them among the right people. Splits are saved on your
device, tracked against a persistent members list with running "who owes whom"
balances, and can be shared straight to WhatsApp or any other app.

The repo holds both halves: a React Native (Expo) app and a Next.js backend that
does nothing but run the LLM. **All user data stays on the device** — the server
never persists anything.

---

## Features

- **Conversational splitting** — a ChatGPT-style screen. Send a receipt photo,
  typed bill details, or both.
  - *Photo only* → the assistant describes what it sees and asks how to split it.
  - *Text only* → works from the amounts you type (for invoices you can't photograph).
- **Deterministic money** — the LLM only *reads* and *assigns* items; all
  arithmetic (per-person shares, proportional tax/tip) runs in code, then
  reconciles against the receipt total and flags anything that doesn't add up.
- **Member disambiguation** — if a typed name matches more than one saved member,
  the assistant asks instead of guessing.
- **Payer-aware balances** — tracks who actually paid each bill, so you see
  "owes you" vs "you owe" per member, not just a raw number.
- **Manual settlements** — record money **received** or **given** per member to
  settle up without using the chat at all.
- **History** — saved splits with long-press to delete and a clear-all action.
- **Search, sort & filter** members (A–Z, recently added, balance high/low; owes
  me / I owe / zero balance).
- **Light / dark / system** theming, persisted.
- **Native share** of a formatted split summary.
- **Clear app data**, gated by device lock-screen auth when one is enrolled.

---

## Tech stack

**App (`splitit/`)**
Expo SDK 57 · expo-router (file-based routing) · React 19 / React Native 0.86 ·
AsyncStorage (the on-device database) · expo-image-picker ·
expo-local-authentication · react-native-toast-message · @expo/vector-icons

**Backend (`splitit-server/`)**
Next.js 16.2 (App Router) · LangChain + LangGraph · `@langchain/google-genai`
(Gemini) · Zod

---

## Project structure

```
.
├── splitit/                    # Expo React Native app
│   └── src/
│       ├── app/                # expo-router screens ((tabs), upload, result, edit, split/[id])
│       ├── components/         # reusable UI kit + shared components
│       ├── helpers/            # all screen logic (hooks) — screens stay render-only
│       ├── store/              # per-domain contexts: friends, splits, payments, theme, flow
│       ├── db/                 # models, StorageAdapter, Repository, balance math
│       ├── api/                # HttpClient + chat/split API clients
│       └── config/             # typed EXPO_PUBLIC_* env access
│
├── splitit-server/             # Next.js backend (LLM only)
│   ├── app/api/                # chat, split, health route handlers
│   └── lib/
│       ├── llm/                # provider abstraction (gemini, openai stub)
│       ├── graph/              # LangGraph pipeline
│       │   └── nodes/          # one file per node
│       ├── chat/               # conversational agent
│       ├── split/              # shared split arithmetic
│       └── schema.ts           # Zod contracts
│
└── docs/                       # requirements, architecture, roadmap, UI guidelines
```

---

## Prerequisites

- **Node.js 18+** and npm
- A **Google Gemini API key** — [get one free](https://aistudio.google.com/apikey)
- **Expo Go** on your phone, or an Android/iOS build target

---

## Getting started

### 1. Backend

```bash
cd splitit-server
npm install

cp .env.example .env.local     # then edit it and set GEMINI_API_KEY
npm run dev                    # http://localhost:3000
```

Verify it's up:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"provider":"gemini"}
```

### 2. App

```bash
cd splitit
npm install

cp .env.example .env.local     # then set EXPO_PUBLIC_API_BASE_URL
npx expo start -c
```

Set `EXPO_PUBLIC_API_BASE_URL` to your **machine's LAN IP**, not `localhost`, so
a physical device can reach the dev server:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000
```

> [!IMPORTANT]
> `EXPO_PUBLIC_*` variables are **inlined into the JS bundle at build time**.
> After changing `.env.local`, restart Metro with a cleared cache
> (`npx expo start -c`). The backend URL is intentionally **not** editable in the
> app and is never stored on the device.

---

## Environment variables

**`splitit-server/.env.local`**

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Your Google AI Studio key |
| `GEMINI_MODEL` | — | `gemini-3.5-flash` | Must be **vision-capable**. Avoid `*-latest` aliases — they can resolve to a variant that rejects image input |
| `LLM_PROVIDER` | — | `gemini` | `gemini` or `openai` |

**`splitit/.env.local`**

| Variable | Required | Default | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | — | Backend base URL, e.g. `http://192.168.1.10:3000` |
| `EXPO_PUBLIC_CURRENCY` | — | `Rs` | Currency symbol/prefix used across the UI |

Real values live only in `.env.local`, which is gitignored. The committed
`.env.example` files are the templates — never put a real key in them.

---

## API reference

All routes are on the backend and send permissive CORS headers.

### `POST /api/chat`
The conversational endpoint used by the app.

```jsonc
// request
{
  "messages": [
    { "role": "user", "text": "I had the burger, Ali had pasta", "image": "data:image/jpeg;base64,..." }
  ],
  "members": [{ "id": "fr_1", "name": "Ali" }]
}

// response — either a follow-up question (result: null) or a finished split
{
  "reply": "Here's what I found on the receipt…",
  "result": { "items": [], "assignments": [], "perPerson": [], "subtotal": 0, "tax": 0, "tip": 0, "total": 0, "needsReview": false },
  "title": "KFC Dinner"
}
```

### `POST /api/split`
One-shot `multipart/form-data` split: `image` (file), `description` (string),
`participants` (repeated field). Returns the same `SplitResult` shape.

### `GET /api/health`
Readiness probe → `{ "ok": true, "provider": "gemini" }`.

---

## Scripts

**App** (`cd splitit`)

| Command | Description |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Build & run on Android |
| `npm run ios` | Build & run on iOS |
| `npm run web` | Run in the browser |
| `npm run lint` | ESLint via `expo lint` |
| `npx tsc --noEmit` | Typecheck |

**Backend** (`cd splitit-server`)

| Command | Description |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |

---

## Building an Android APK

```bash
cd splitit
eas build --platform android --profile preview
```

The `preview` profile in [`splitit/eas.json`](splitit/eas.json) produces an
installable **APK** with `internal` distribution (shareable install link).
`production` builds an `.aab` for the Play Store.

> `EXPO_PUBLIC_API_BASE_URL` is baked into the build. For a device that isn't on
> your LAN, point it at a publicly reachable backend URL before building.

---

## Swapping the LLM provider

The graph and chat agent depend on an `LLMProvider` interface, never on a vendor
SDK — so changing providers touches one file:

1. `npm install @langchain/openai` in `splitit-server/`
2. Implement `getModel()` in
   [`lib/llm/providers/openai.ts`](splitit-server/lib/llm/providers/openai.ts)
   (a commented template is already there)
3. Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in `.env.local`

Adding a new pipeline stage is similarly isolated: create a node file under
`lib/graph/nodes/` and add it to the `PIPELINE` array in
[`lib/graph/pipeline.ts`](splitit-server/lib/graph/pipeline.ts) — the graph
builds its own wiring from that list.

---

## Documentation

| Doc | Contents |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Functional & non-functional requirements |
| [docs/architecture.md](docs/architecture.md) | System design, data flow, contracts |
| [docs/roadmap.md](docs/roadmap.md) | Phased milestones |
| [docs/ui-guidelines.md](docs/ui-guidelines.md) | Colour palette, typography, spacing, components |
| [docs/Report.txt](docs/Report.txt) | Full engineering report incl. every edge case handled |
