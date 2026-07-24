import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useGoogleSignIn } from '@/helpers/use-google-signin';
import { useAuth } from '@/store/auth-store';
import { toast } from '@/utils/toast';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const google = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      toast.error('Enter your email and password');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      // Gating in the root layout redirects on the resulting auth change.
    } catch (err) {
      toast.error('Sign in failed', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title">Welcome back</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Sign in to continue splitting bills.
        </ThemedText>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
      />

      <Button title="Sign in" onPress={onSubmit} loading={busy} />

      {google.available ? (
        <Button title="Continue with Google" variant="secondary" onPress={() => google.prompt()} />
      ) : null}

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          No account?{' '}
        </ThemedText>
        <Link href={'/(auth)/sign-up' as never}>
          <ThemedText type="smallBold" themeColor="primary">
            Create one
          </ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, justifyContent: 'center', flexGrow: 1 },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.two },
});
