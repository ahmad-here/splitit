import { Ionicons } from '@expo/vector-icons';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/helpers/use-settings';
import { useAuth } from '@/store/auth-store';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/utils/toast';
import type { ThemeMode } from '@/store/theme-context';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

export default function SettingsScreen() {
  const { mode, setMode, code, codeError, loadingCode, reloadCode } = useSettings();
  const { user, signOut } = useAuth();
  const theme = useTheme();

  return (
    <Screen>
      <ThemedText type="subtitle">Settings</ThemedText>

      <SectionHeader title="Your code" />
      <Card style={styles.codeCard}>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" themeColor="textSecondary">
            Share this code so friends can add you
          </ThemedText>
          {code ? (
            <ThemedText type="title" style={styles.code}>
              {code}
            </ThemedText>
          ) : codeError ? (
            <Pressable onPress={reloadCode}>
              <ThemedText type="small" style={{ color: theme.owe ?? '#e5484d' }}>
                {codeError} — tap to retry
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText type="title" themeColor="muted" style={styles.code}>
              {loadingCode ? 'Loading…' : '——————'}
            </ThemedText>
          )}
        </View>
        <Pressable
          hitSlop={8}
          disabled={!code}
          accessibilityLabel="Share my code"
          onPress={() => {
            if (!code) return;
            Share.share({ message: `Add me on Splitit with my code: ${code}` }).catch(() =>
              toast.error('Could not open share'),
            );
          }}
          style={[styles.shareBtn, { borderColor: theme.primary, opacity: code ? 1 : 0.4 }]}
        >
          <Ionicons name="share-outline" size={18} color={theme.primary} />
        </Pressable>
      </Card>

      <SectionHeader title="Appearance" />
      <Card>
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Theme mode
        </ThemedText>
        <View style={styles.chips}>
          {MODES.map((m) => (
            <Chip key={m} label={m[0].toUpperCase() + m.slice(1)} selected={mode === m} onPress={() => setMode(m)} />
          ))}
        </View>
      </Card>

      <SectionHeader title="Account" />
      <Card style={{ gap: Spacing.three }}>
        {user?.email ? (
          <ThemedText type="small" themeColor="textSecondary">
            Signed in as {user.email}
          </ThemedText>
        ) : null}
        <Button title="Log out" variant="secondary" onPress={() => signOut()} />
      </Card>

      <SectionHeader title="About" />
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Splitit — AI bill splitting. Upload a receipt, describe who bought what, and share the split.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: Spacing.two },
  chips: { flexDirection: 'row', gap: Spacing.two },
  codeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  code: { letterSpacing: 3 },
  shareBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
