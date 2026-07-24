import { Link } from 'expo-router';
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

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const google = useGoogleSignIn();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!firstName.trim() || !email.trim() || password.length < 6) {
      toast.error('Fill in your name, email, and a 6+ char password');
      return;
    }
    setBusy(true);
    try {
      await signUp(firstName, lastName, email, password);
      // A verification email is sent; the root gating shows the verify screen.
    } catch (err) {
      toast.error('Sign up failed', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title">Create account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Split bills with friends and keep balances in sync.
        </ThemedText>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label="First name" value={firstName} onChangeText={setFirstName} placeholder="FirstName" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Last name" value={lastName} onChangeText={setLastName} placeholder="LastName" />
        </View>
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
        placeholder="At least 6 characters"
        secureTextEntry
      />

      <Button title="Create account" onPress={onSubmit} loading={busy} />

      {google.available ? (
        <Button title="Continue with Google" variant="secondary" onPress={() => google.prompt()} />
      ) : null}

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Already have an account?{' '}
        </ThemedText>
        <Link href={'/(auth)/sign-in' as never}>
          <ThemedText type="smallBold" themeColor="primary">
            Sign in
          </ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, justifyContent: 'center', flexGrow: 1 },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.two },
});
