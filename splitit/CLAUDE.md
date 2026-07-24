@AGENTS.md

# Modular architecture — build features with minimum changes

This codebase is modular by design. **Implement a new feature by adding files that plug into
an existing seam — not by rewriting existing files.** A new feature should require the
minimum possible changes to files that already exist.

Known seams to plug into (prefer these over editing shared code):
- **Persistence:** implement `StorageAdapter` (`src/db/storage-adapter.ts`) or add a
  `Repository<T>` (`src/db/repository.ts`); wire it once in `src/db/repositories.ts`.
  Never import `AsyncStorage` (or any storage engine) outside the adapter.
- **State:** add a focused per-domain store under `src/store/` (like `friends-store`,
  `splits-store`) and compose it in `src/store/app-store.tsx`. Keep domains separate (ISP).
- **UI:** compose the existing kit in `src/components/ui/` instead of new one-off styles.
- **Screen logic:** put logic in a `src/helpers/use-*.ts` hook; screens only render.

Rules of thumb: depend on interfaces, not implementations (DIP); one responsibility per
file/module (SRP); if a change forces edits across many existing files, you're fighting the
architecture — find the seam instead.
