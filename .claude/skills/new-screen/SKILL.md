---
name: new-screen
description: Scaffold a new theme-aware expo-router screen in the splitit app, wired to the design tokens, reusable UI kit, and data store. Use when adding a screen or tab to the mobile app.
---

# New Splitit screen

Generate a screen that matches the app's conventions. Never hardcode colors or
spacing — always pull from the theme and `Spacing`.

## Steps

1. **Location** — file-based routing under `splitit/src/app/`:
   - A tab screen → `src/app/(tabs)/<name>.tsx`, then register it in
     `src/app/(tabs)/_layout.tsx` with a `Tabs.Screen` + emoji `tabBarIcon`.
   - A stacked/detail screen → `src/app/<name>.tsx` (or `src/app/<seg>/[id].tsx`
     for dynamic), then add a `Stack.Screen` in `src/app/_layout.tsx`.

2. **Use the building blocks** (all theme-aware):
   - Wrap content in `Screen` (`@/components/ui/screen`) — handles padding + safe
     area. Pass `topInset` for tab screens (no stack header).
   - Reuse `Button`, `Card`, `TextField`, `Chip`, `Avatar`, `ListItem`,
     `AmountText`, `EmptyState`, `SectionHeader`, `Loader` from
     `@/components/ui`.
   - Text via `ThemedText` (`type="subtitle"` for screen titles); colors via
     `useTheme()` tokens (`theme.primary`, `theme.card`, `theme.border`, …).

3. **Data** — read/write app data through `useStore()`
   (`@/store/store-context`); never touch `@/db/*` directly from a screen. For
   the active split flow use `useFlow()`.

4. **Feedback** — use `toast.success/error/info` from `@/utils/toast` for events
   and errors.

5. **Verify** — `cd splitit && npx tsc --noEmit`. Dynamic route pushes may need
   `router.push(\`/x/${id}\` as Href)` until typed-route types are generated.

## Template

```tsx
import { ThemedText } from '@/components/themed-text';
import { Card, Screen, SectionHeader } from '@/components/ui';
import { useStore } from '@/store/store-context';

export default function ExampleScreen() {
  const { splits } = useStore();
  return (
    <Screen topInset>
      <ThemedText type="subtitle">Example</ThemedText>
      <SectionHeader title="Section" />
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          {splits.length} splits
        </ThemedText>
      </Card>
    </Screen>
  );
}
```

See `docs/ui-guidelines.md` for palette and spacing rules.
