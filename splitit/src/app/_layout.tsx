import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Colors } from '@/constants/theme';
import { isFirebaseConfigured } from '@/config/env';
import { AppStoreProvider } from '@/store/app-store';
import { AuthProvider, useAuth } from '@/store/auth-store';
import { FlowProvider } from '@/store/flow-context';
import { ThemeModeProvider, useResolvedScheme } from '@/store/theme-context';

SplashScreen.preventAutoHideAsync();

// Safety net: never let a render error leave the user stuck on the splash
// screen forever. If the tree mounts normally the effect below hides it first.
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 4000);

/** Surfaces render errors instead of hanging on the splash screen. */
export { ErrorBoundary } from 'expo-router';

/**
 * Redirects between the (auth) group and the app based on the session:
 *   - not signed in           → /(auth)/sign-in
 *   - signed in, unverified   → /(auth)/verify-email
 *   - signed in + verified    → /(tabs)
 * If Firebase isn't configured yet, auth is skipped so the app still runs.
 */
function useAuthGate() {
  const { user, initializing, emailVerified } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured || initializing) return;
    // Route strings are validated by expo-router typegen at dev start; the
    // (auth) group isn't in the generated union until then, hence the casts.
    const seg = segments as string[];
    const inAuthGroup = seg[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/sign-in' as never);
      return;
    }
    if (!emailVerified) {
      if (seg[1] !== 'verify-email') router.replace('/(auth)/verify-email' as never);
      return;
    }
    if (inAuthGroup) router.replace('/(tabs)');
  }, [user, initializing, emailVerified, segments, router]);
}

function Navigation() {
  const scheme = useResolvedScheme();
  const colors = Colors[scheme];
  useAuthGate();

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          // Theme-aware header so the back button stays visible in dark mode.
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="upload" options={{ headerShown: true, title: 'New split', presentation: 'card' }} />
        <Stack.Screen name="result" options={{ headerShown: true, title: 'AI Result' }} />
        <Stack.Screen name="edit" options={{ headerShown: true, title: 'Edit split' }} />
        <Stack.Screen name="split/[id]" options={{ headerShown: true, title: 'Split' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Hold on the splash until Poppins is ready to avoid a font swap flash.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeModeProvider>
            <AuthProvider>
              <AppStoreProvider>
                <FlowProvider>
                  <Navigation />
                  <Toast />
                </FlowProvider>
              </AppStoreProvider>
            </AuthProvider>
          </ThemeModeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
