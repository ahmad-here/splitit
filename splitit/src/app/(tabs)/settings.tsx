import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/helpers/use-settings';
import type { ThemeMode } from '@/store/theme-context';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

export default function SettingsScreen() {
  const { mode, setMode, confirmClearData } = useSettings();

  return (
    <Screen>
      <ThemedText type="subtitle">Settings</ThemedText>

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

      <SectionHeader title="Data" />
      <Card style={{ gap: Spacing.three }}>
        <ThemedText type="small" themeColor="textSecondary">
          Permanently delete all members, splits and payments from this device. If your device has a lock screen, you’ll
          be asked to authenticate first.
        </ThemedText>
        <Button title="Clear app data" variant="secondary" onPress={confirmClearData} />
      </Card>

      <SectionHeader title="About" />
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Splitit — AI bill splitting. Upload a receipt, describe who bought what, and share the split. Data is stored
          locally on your device.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: Spacing.two },
  chips: { flexDirection: 'row', gap: Spacing.two },
});
