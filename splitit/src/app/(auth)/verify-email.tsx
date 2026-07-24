import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/store/auth-store';
import { toast } from '@/utils/toast';

/**
 * Firebase sends a verification LINK by email (not a 6-digit code). The user
 * taps it, then returns here and taps "I've verified" to re-check status.
 */
export default function VerifyEmailScreen() {
  const { user, resendVerification, reloadUser, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    try {
      await reloadUser();
      // Gating redirects to the app automatically once emailVerified flips true.
      toast.info('Not verified yet', 'Tap the link in your email, then try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>📧</ThemedText>
        <ThemedText type="title">Verify your email</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          We sent a verification link to {user?.email ?? 'your email'}. Open it, then come back and tap below.
        </ThemedText>
      </View>

      <Button title="I've verified — continue" onPress={check} loading={busy} />
      <Button title="Resend email" variant="secondary" onPress={() => resendVerification().then(() => toast.success('Verification email sent'))} />
      <Button title="Use a different account" variant="ghost" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, justifyContent: 'center', flexGrow: 1 },
  header: { gap: Spacing.one, alignItems: 'center', marginBottom: Spacing.two },
  emoji: { fontSize: 44 },
  center: { textAlign: 'center' },
});
