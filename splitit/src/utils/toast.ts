/**
 * Thin wrapper around react-native-toast-message so screens import a stable,
 * app-specific API. The <Toast /> host is mounted in src/app/_layout.tsx.
 */

import Toast from 'react-native-toast-message';

export const toast = {
  success(text1: string, text2?: string) {
    Toast.show({ type: 'success', text1, text2 });
  },
  error(text1: string, text2?: string) {
    Toast.show({ type: 'error', text1, text2 });
  },
  info(text1: string, text2?: string) {
    Toast.show({ type: 'info', text1, text2 });
  },
};
