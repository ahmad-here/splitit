# Splitit — Requirements

## 1. Overview
Splitit is a Splitwise-inspired mobile app that splits a bill from a photo of an
invoice. The user uploads a receipt image, describes in plain language who bought
what, and an LLM extracts the line items and splits the bill accordingly. Splits
are saved on-device and tracked against a persistent friends/groups model with
running balances. Any split can be shared to other apps (e.g. WhatsApp).

## 2. Actors
- **User** — single device owner. No login/accounts.
- **Friends** — people the user splits with (persistent, stored on-device).
- **LLM backend** — Next.js service running LangChain/LangGraph + Gemini.

## 3. Functional requirements

### 3.1 Invoice → split (core)
- FR-1: User can pick an invoice photo from the camera or library.
- FR-2: User can select participants (from saved friends, or add ad-hoc) and type
  a free-text description of who bought what.
- FR-3: The app sends the image + description + participants to the backend, which
  returns extracted line items, per-person amounts, and the total.
- FR-4: The backend computes the split deterministically (arithmetic in code, not
  the LLM) and reconciles the computed total against the receipt total. On
  mismatch it flags `needsReview`.

### 3.2 Review & edit
- FR-5: The AI Result screen shows items, per-person amounts, total, and a
  `needsReview` banner when reconciliation failed.
- FR-6: User can manually edit item→person assignments and amounts; totals
  recompute client-side.
- FR-7: User can save a split to history.

### 3.3 Friends, groups & balances
- FR-8: User can create/edit/delete friends and groups.
- FR-9: Each saved split updates running per-friend balances (owes / is owed).
- FR-10: Home shows a balance summary and recent splits.

### 3.4 History & sharing
- FR-11: History lists past splits (date, total, group, thumbnail); tap for detail.
- FR-12: Any split can be shared as a formatted text summary via the native share
  sheet.

### 3.5 Settings
- FR-13: User can choose theme mode: light, dark, or system.
- FR-14: User can configure the backend base URL.

## 4. Non-functional requirements
- NFR-1: **Local storage is the database.** All app data persists on-device via
  AsyncStorage. No server-side persistence.
- NFR-2: **Provider abstraction.** Switching the LLM from Gemini to OpenAI must be
  a near-single-file change behind an `LLMProvider` interface.
- NFR-3: The Gemini API key lives only in `splitit-server/.env.local`; it is never
  shipped in the app bundle.
- NFR-4: Light / dark / system theming, persisted across restarts.
- NFR-5: Toasts for user-facing events and errors.
- NFR-6: Reusable, theme-aware component library.

## 5. Out of scope (v1)
- Multi-user sync / cloud accounts.
- Real payments / settle-up transactions.
- Currency conversion.

## 6. Confirmed decisions
- Backend = LLM only; data on-device (AsyncStorage).
- Gemini key in server `.env.local`.
- Persistent friends/groups with running balances.
