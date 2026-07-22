/**
 * Returns the active color token map, honoring the user's chosen theme mode
 * (light / dark / system). See src/store/theme-context.tsx.
 */

import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/store/theme-context';

export function useTheme() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
