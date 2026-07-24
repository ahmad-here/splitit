# Modular architecture — build features with minimum changes

This backend is modular by design. **Implement a new feature by adding files that plug into
an existing seam — not by rewriting existing files.** A new feature should require the
minimum possible changes to files that already exist.

Known seams to plug into (prefer these over editing shared code):
- **HTTP feature:** add a `src/<feature>/` module (controller + service + module) and
  register it in `src/app.module.ts`. Controllers stay thin — they receive the request and
  delegate; all logic lives in an injected service (SRP + DIP).
- **LLM logic:** keep prompts, schemas, graph nodes, and split math in `src/core/`
  (framework-agnostic). Add a pipeline stage as a new `NodeSpec` in
  `src/core/graph/nodes/`; add prompts to `src/core/constants.ts`; add schemas to the
  `src/core/schema/` barrel. Swap LLM providers behind `LLMProvider` (`src/core/llm/`).
- **Validation:** reuse `ZodValidationPipe` with a schema from `src/core/schema`.
- **Errors:** throw Nest exceptions; the global `ErrorShapeFilter` renders `{ error }`.

Rules of thumb: inject dependencies, never `new` a service in a controller; one
responsibility per file; if a change forces edits across many existing files, find the seam
instead.
