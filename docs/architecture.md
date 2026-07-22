# Splitit — Architecture

## 1. System diagram

```
┌─────────────────────────────┐     HTTPS multipart (image + description + participants)
│  splitit/  (Expo RN app)     │ ───────────────────────────────────────►  ┌──────────────────────────────┐
│                              │                                            │ splitit-server/ (Next.js 16) │
│  Screens + reusable UI kit   │                                            │  POST /api/split             │
│  Local storage = DB          │                                            │   LangGraph pipeline          │
│  (friends, groups, history)  │ ◄───────────────────────────────────────  │   LLMProvider (Gemini today)  │
│  Native share sheet          │     JSON { items, perPerson, total, ... }  │                              │
└─────────────────────────────┘                                            └──────────────────────────────┘
```

The **split is computed server-side**. The LLM only *reads* the receipt and
*assigns* items to people; deterministic TypeScript does the arithmetic and
reconciles totals. The app persists the returned result locally and updates
balances.

## 2. Frontend (`splitit/`)

Expo SDK 57 + expo-router (file-based routing) + React 19.

```
src/
  app/                 # expo-router screens (Home, Upload, Result, Edit, History, Friends, Settings)
  components/
    ui/                # reusable theme-aware kit (Button, Card, Avatar, TextField, ...)
    themed-text.tsx    # existing, reused
    themed-view.tsx    # existing, reused
  constants/theme.ts   # design tokens (colors, spacing, fonts) — extended with brand palette
  store/
    theme-context.tsx  # light/dark/system mode, persisted
    store-context.tsx  # app data store hook over the db layer
  db/
    storage.ts         # typed AsyncStorage wrapper
    models.ts          # Friend, Group, SplitRecord types
    repositories.ts    # friendsRepo, groupsRepo, splitsRepo (CRUD)
    balances.ts        # derive running per-friend balances
  api/
    split-client.ts    # calls backend /api/split
  utils/
    share.ts           # format + native share
    toast.ts           # toast.success/error/info helpers
```

### 2.1 Data layer (local storage = DB)
- `storage.ts` wraps AsyncStorage with typed JSON get/set by key.
- `repositories.ts` exposes CRUD over `friends`, `groups`, `splits` collections.
- The db layer is intentionally isolated so it can later be swapped for
  `expo-sqlite` without touching screens (same rationale as the LLM interface).

### 2.2 Theming
- `constants/theme.ts` holds `Colors.light` / `Colors.dark` token maps. Screens
  never hardcode hex; they read tokens via `useTheme()`.
- `store/theme-context.tsx` stores the chosen **mode** (light/dark/system) in
  AsyncStorage and resolves it against the OS scheme. `useTheme()` reads the
  resolved scheme from this context.

## 3. Backend (`splitit-server/`)

Next.js 16.2 App Router + TypeScript.

```
lib/
  llm/
    types.ts             # LLMProvider interface
    index.ts             # getProvider() — reads LLM_PROVIDER env — THE swap point
    providers/
      gemini.ts          # ChatGoogleGenerativeAI (active)
      openai.ts          # stub template for the future swap
  graph/
    state.ts             # LangGraph state annotation
    nodes.ts             # extractItems, assignItems, computeSplit, validate
    graph.ts             # StateGraph wiring
  schema.ts              # zod schemas (line items, assignments, result)
app/
  api/
    split/route.ts       # POST — run the graph
    health/route.ts      # GET — readiness probe
```

### 3.1 LangGraph pipeline
1. **extractItems** — vision call: receipt image → `[{ name, qty, price }]` + tax/tip/total.
2. **assignItems** — reason over the user's description → map each item to person(s).
3. **computeSplit** — deterministic TS: per-person subtotal + proportional tax/tip.
4. **validate** — reconcile computed vs receipt total; one repair retry, else `needsReview`.

### 3.2 Provider abstraction
`LLMProvider` exposes a `getModel()` returning a LangChain `BaseChatModel`, so the
graph nodes stay provider-agnostic. `lib/llm/index.ts` selects the provider from
the `LLM_PROVIDER` env var (default `gemini`). Swapping to OpenAI = install
`@langchain/openai`, fill `providers/openai.ts`, set `LLM_PROVIDER=openai`.

## 4. Contracts
The API response shape (`/api/split`) is mirrored by the app's TS types in
`src/db/models.ts`. Server zod schemas live in `lib/schema.ts`.

```ts
// /api/split response
{
  items: { name: string; qty: number; price: number }[];
  assignments: { item: string; people: string[] }[];
  perPerson: { name: string; amount: number }[];
  subtotal: number; tax: number; tip: number; total: number;
  needsReview: boolean;
}
```

## 5. Version caveats
- Expo 57 and Next.js 16.2 both diverge from older docs — consult
  `https://docs.expo.dev/versions/v57.0.0/` and `node_modules/next/dist/docs/`
  respectively before writing platform code.
