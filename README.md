# Splitit — AI Bill Splitting

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Snap a photo of a receipt — or just describe the bill in plain text — and an LLM reads the items and
splits them among the right people. Splitit is a **multi-user** app: sign in, add friends by a unique
code, and when you split a bill everyone involved sees their balance update **in real time** and gets
a notification. Conversations with the AI are saved, and it remembers context across chats.

The repo holds an **Expo (React Native)** app and a **NestJS** backend. Accounts and data live in
**Firebase** (Auth + Firestore); receipt photos live in **Cloudinary**; the LLM work runs through
**LangGraph + Google Gemini**.

---

## Features

- **Accounts** — email/password (with email verification) or **Continue with Google**.
- **Conversational splitting** — a ChatGPT-style screen: send a receipt photo, typed bill details, or
  both. `@`-mention members to add them to the split.
- **Deterministic money** — the LLM only *reads* and *assigns* items; all arithmetic (per-person
  shares, proportional tax/tip) runs in code and reconciles against the receipt total.
- **Members by code** — every user has a unique shareable code; redeeming a friend's code links you
  both. Your code lives in **Settings**.
- **Real-time balances** — payer-aware "owes you / you owe" per member, computed by identity (not
  names), kept in sync live across devices via Firestore listeners.
- **Notifications** — in-app feed (sliding panel) + reminders; a friend is notified when you add them
  to a split or nudge them about money owed. (OS push requires FCM setup — see below.)
- **Manual settlements** — record money received or given per member.
- **Persistent AI chat + memory** — revisit past chats; the assistant remembers durable facts (e.g.
  your name) across every conversation.
- **Receipt storage** — photos are uploaded to Cloudinary; only the URL is stored.
- **History**, **search / sort / filter** members, **light / dark / system** theming, **native share**.

---

## Tech stack

**App (`splitit/`)** — Expo SDK 57 · expo-router · React 19 / React Native 0.86 · Firebase JS SDK 12
(Auth + Firestore) · @react-native-google-signin · expo-auth-session · expo-notifications ·
react-native-keyboard-controller · react-native-toast-message · @expo/vector-icons

**Backend (`splitit-nest-server/`)** — NestJS 11 · firebase-admin (Auth + Firestore) · Cloudinary ·
LangChain + LangGraph · `@langchain/google-genai` (Gemini) · Zod

> The original Next.js backend still lives in `splitit-server/` as a reference/fallback; the **active
> backend is `splitit-nest-server/`**.

---

## Project structure

```
.
├── splitit/                      # Expo React Native app
│   └── src/
│       ├── app/                  # expo-router screens: (auth), (tabs), upload, result, edit, split/[id]
│       ├── auth/                 # Firebase client
│       ├── components/           # UI kit + shared components (member-card, notifications-drawer, ...)
│       ├── helpers/              # screen logic hooks (screens stay render-only)
│       ├── store/                # per-domain contexts: auth, friends, splits, payments, notifications, theme
│       ├── db/                   # models, balance math, Firestore listeners
│       ├── api/                  # HttpClient + typed API clients (members, splits, notifications, chats)
│       └── config/               # typed EXPO_PUBLIC_* env access
│
├── splitit-nest-server/          # NestJS backend (active)
│   ├── firebase/                 # Firestore rules + data-model doc
│   └── src/
│       ├── firebase/             # Firebase Admin wrapper
│       ├── auth/                 # Firebase ID-token guard + @CurrentUser
│       ├── profiles/             # profile bootstrap + unique friend codes
│       ├── members/              # friends & code redemption
│       ├── splits/               # persist splits + notify participants
│       ├── notifications/        # feed, reminders, mark-read, clear
│       ├── push/                 # Expo push tokens + delivery
│       ├── chats/                # chat sessions + cross-chat memory
│       ├── storage/              # Cloudinary uploads
│       └── core/                 # framework-agnostic LLM: graph/, chat/, llm/, split/, schema/
│
├── splitit-server/               # Legacy Next.js backend (superseded)
└── docs/                         # requirements, architecture, roadmap, UI guidelines
```

---

## Prerequisites

- **Node.js 18+** and npm
- A **Firebase project** with **Authentication** (Email/Password + Google) and **Firestore** enabled
- A **Google Gemini API key** — [get one free](https://aistudio.google.com/apikey)
- A free **Cloudinary account** (receipt image storage)
- **ngrok** (or any HTTPS tunnel) — Android blocks plain-HTTP to a LAN IP, so a physical device needs
  an `https://` backend URL

---

## Getting started

### 1. Backend (`splitit-nest-server/`)

```bash
cd splitit-nest-server
npm install
cp .env.example .env.local        # fill in the values below
npm run start:dev                 # http://localhost:3000
```

Set in `.env.local`:
- `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json` — download the service-account JSON from
  Firebase (Project settings → Service accounts) and save it as `service-account.json` (gitignored)
- `CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud-name>` (Cloudinary dashboard)

Apply the Firestore rules in [`splitit-nest-server/firebase/firestore.rules`](splitit-nest-server/firebase/firestore.rules).
Verify: `curl http://localhost:3000/api/health` → `{"ok":true,"provider":"gemini"}`.

**Expose it to your phone over HTTPS:**
```bash
npm run tunnel        # prints an https URL; or: npm run dev:tunnel (server + tunnel together)
```

### 2. App (`splitit/`)

```bash
cd splitit
npm install
cp .env.example .env.local        # set the URL + Firebase web config
npx expo start -c
```

Set `EXPO_PUBLIC_API_BASE_URL` to your **ngrok HTTPS URL**, and paste your Firebase **web app** config
into the `EXPO_PUBLIC_FIREBASE_*` keys. Google sign-in also needs `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

> [!IMPORTANT]
> `EXPO_PUBLIC_*` variables are **inlined at build time**. After editing `.env.local`, restart with a
> cleared cache (`npx expo start -c`) or rebuild the APK — the values are baked into the bundle.

---

## Environment variables

**`splitit-nest-server/.env.local`**

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Google AI Studio key |
| `GEMINI_MODEL` | — | `gemini-3.1-flash-lite` | Vision-capable. Override for a different tier |
| `LLM_PROVIDER` | — | `gemini` | `gemini` or `openai` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ✅ | — | Path to the service-account JSON (or inline `FIREBASE_SERVICE_ACCOUNT`) |
| `CLOUDINARY_URL` | ✅ | — | `cloudinary://<key>:<secret>@<cloud-name>` |
| `NGROK_AUTHTOKEN` / `NGROK_DOMAIN` | — | — | For `npm run tunnel` |

**`splitit/.env.local`**

| Variable | Required | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | Backend URL — **https** for a physical device (ngrok) |
| `EXPO_PUBLIC_CURRENCY` | — | Currency prefix (default `Rs`) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` … `_APP_ID` | ✅ | Firebase **web app** config (6 keys) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | — | Required for Google sign-in |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | — | For native Google sign-in on Android |

Real values live only in `.env.local` (gitignored). The committed `.env.example` files are templates.

---

## API reference

All routes are under `/api`. AI routes are public; the rest require a Firebase ID token
(`Authorization: Bearer <token>`). Errors return `{ "error": string }`.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | — | Readiness probe |
| `POST` | `/api/split` | — | One-shot multipart split (`image`, `description`, repeated `participants`) |
| `POST` | `/api/chat` | optional | Conversational split; when authed, persists the chat + updates memory |
| `GET` | `/api/members` · `/api/members/me` | ✅ | Friends list · own profile + friend code |
| `POST` | `/api/members/redeem` | ✅ | Add a friend by code (links both users) |
| `GET`/`POST`/`DELETE` | `/api/splits` | ✅ | List / save (notifies participants) / delete a split |
| `GET`/`DELETE` | `/api/notifications` | ✅ | Feed / clear all |
| `POST` | `/api/notifications/:id/read` · `/api/notifications/remind` | ✅ | Mark read · nudge a friend |
| `POST` | `/api/push/register` | ✅ | Register an Expo push token |
| `GET` | `/api/chats` · `/api/chats/:id` | ✅ | Past chats · restore a chat's messages |

---

## Scripts

**App** (`cd splitit`): `npm start` · `npm run android` · `npm run ios` · `npm run web` ·
`npm run lint` · `npx tsc --noEmit`

**Backend** (`cd splitit-nest-server`): `npm run start:dev` · `npm run build` · `npm run start:prod` ·
`npm run tunnel` · `npm run dev:tunnel` · `npm run lint` · `npx tsc --noEmit`

---

## Building an Android APK

```bash
cd splitit && cd android
.\gradlew.bat assembleRelease     # APK: android/app/build/outputs/apk/release/app-release.apk
```
Or a cloud build: `eas build -p android --profile preview`. `EXPO_PUBLIC_*` values (incl. the backend
URL) are baked in at build time, so set them first. Native Google sign-in needs an Android OAuth
client (package `com.ahmad_ch909.splitit` + the build's SHA-1) in the Firebase project.

---

## Push notifications (setup required)

In-app notifications work out of the box (real-time via Firestore). **OS push** additionally needs
**FCM** configured for the Firebase project and uploaded to Expo (`eas credentials` → Android → Push
Notifications). Until then, only the in-app feed updates.

---

## Swapping the LLM provider

The graph and chat agent depend on an `LLMProvider` interface, not a vendor SDK. To switch: implement
`getModel()` in [`src/core/llm/providers/openai.ts`](splitit-nest-server/src/core/llm/providers/openai.ts),
then set `LLM_PROVIDER=openai` + `OPENAI_API_KEY`. Add a pipeline stage by dropping a node in
`src/core/graph/nodes/` and listing it in `src/core/graph/pipeline.ts`.

---

## Documentation

| Doc | Contents |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Functional & non-functional requirements |
| [docs/architecture.md](docs/architecture.md) | System design, data flow, contracts |
| [docs/roadmap.md](docs/roadmap.md) | Phased milestones |
| [docs/ui-guidelines.md](docs/ui-guidelines.md) | Palette, typography, spacing, components |
| [splitit-nest-server/firebase/DATA_MODEL.md](splitit-nest-server/firebase/DATA_MODEL.md) | Firestore collections |
