# Splitit — UI Guidelines

## 1. Brand palette

| Token          | Hex        | Usage |
|----------------|------------|-------|
| `primary`      | `#6cbd32`  | Primary actions, active states, brand accents, CTAs |
| `primaryLight` | `#89ca5b`  | Hover/pressed/gradient partner, subtle highlights, chips |
| `white`        | `#ffffff`  | Light-mode surfaces, text on primary |
| `lightGrey`    | `#f0f0f3`  | Light-mode app background / muted surfaces |

Derived (dark mode and semantics defined in `constants/theme.ts`):
- **Backgrounds:** light `#ffffff` / dark `#0f1113`.
- **Cards:** light `#f7f8f7` / dark `#1a1d1a`.
- **Success** = `primary` family; **Error** `#e5484d`; **Warning** `#f5a524`.
- **Balance colors:** *is owed* (positive) uses `primary` green; *owes*
  (negative) uses error red; *settled* uses secondary text.

### Usage rules
- Never hardcode hex in screens — always read tokens via `useTheme()`.
- Primary green is for one clear action per view. Don't fill large areas with it.
- Text on `primary` is always white; ensure ≥ 4.5:1 contrast for body text.

## 2. Typography
Reuse `ThemedText` variants: `title` (48), `subtitle` (32), `default` (16),
`small`/`smallBold` (14), `code`. Add domain use:
- Screen titles → `subtitle`.
- Amounts → tabular, `smallBold`/`default`, colored via `AmountText`.

## 3. Spacing
Use the `Spacing` scale only: `half 2, one 4, two 8, three 16, four 24, five 32, six 64`.
- Screen horizontal padding: `Spacing.three` (16).
- Card padding: `Spacing.three`; gap between cards: `Spacing.two`.

## 4. Components (do / don't)
- **Button** — primary (green fill), secondary (outline), ghost (text). One
  primary per screen. Full-width for main CTAs.
- **Card** — rounded 16, subtle border in light, elevated surface in dark.
- **Avatar** — friend initials on a `primaryLight` circle.
- **AmountText** — green when owed, red when owing, muted when zero.
- **EmptyState** — icon + one line + a single action; used on empty History/Friends.
- Do **not** mix custom colors outside the token set.

## 5. Theming
- Three modes: **light**, **dark**, **system** (default). Chosen in Settings,
  persisted to AsyncStorage, resolved against the OS scheme.
- Every screen and component must render correctly in both light and dark.

## 6. Toasts
- `success` (green) for saves/shares, `error` (red) for failures, `info` (neutral).
- Keep messages short and action-oriented ("Split saved", "Couldn't reach server").

## 7. Screens
Home · Upload Invoice · AI Result · Edit Split · History · Friends · Settings —
each built from the reusable kit, following the palette and spacing above.
