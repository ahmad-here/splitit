# Splitit — Roadmap

Phased milestones. Check off as delivered.

## Phase 1 — Foundations
- [ ] `docs/` written (requirements, architecture, roadmap, ui-guidelines)
- [ ] Extend `constants/theme.ts` with brand palette + semantic tokens
- [ ] Manual light/dark/system theme mode, persisted (`store/theme-context.tsx`)

## Phase 2 — Data layer (local storage = DB)
- [ ] `db/storage.ts` typed AsyncStorage wrapper
- [ ] `db/models.ts` Friend / Group / SplitRecord
- [ ] `db/repositories.ts` CRUD repos
- [ ] `db/balances.ts` running per-friend balances
- [ ] `store/store-context.tsx` app store hook

## Phase 3 — Reusable UI kit
- [ ] Button, Card, Avatar, ListItem, TextField, Chip
- [ ] AmountText (owe/owed colors), EmptyState, SectionHeader, Loader, Modal/Sheet

## Phase 4 — Backend (LLM)
- [ ] Install `@langchain/langgraph`, `@langchain/core`, `@langchain/google-genai`, `zod`
- [ ] `lib/llm/` provider interface + Gemini + OpenAI stub + `index.ts`
- [ ] `lib/graph/` extractItems → assignItems → computeSplit → validate
- [ ] `app/api/split/route.ts` + `app/api/health/route.ts`
- [ ] Verify with a sample receipt via curl

## Phase 5 — App screens & navigation
- [ ] Tab restructure: Home, History, Friends, Settings
- [ ] Home, Upload Invoice, AI Result, Edit Split, History, Friends, Settings

## Phase 6 — End-to-end wiring
- [ ] `api/split-client.ts` connects Upload → backend → Result
- [ ] Save → History → balances update

## Phase 7 — Polish
- [ ] Native share of formatted split summary
- [ ] Toasts on events/errors

## Phase 8 — Tooling & QA
- [ ] Pre/post Claude Code hooks in `.claude/settings.json`
- [ ] Project skill for scaffolding screens/components
- [ ] Final `expo lint` + `tsc --noEmit` (app) and `eslint` + typecheck (server)
