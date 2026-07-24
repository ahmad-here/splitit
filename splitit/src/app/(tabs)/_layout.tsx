import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePushRegistration } from '@/helpers/use-push-registration';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Minimal shape of the props expo-router passes to a custom `tabBar`. */
type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

/** Icon + label for each real (navigable) tab route. */
const TAB_META: Record<string, { label: string; icon: IoniconName; activeIcon: IoniconName }> = {
  index: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  history: { label: 'History', icon: 'receipt-outline', activeIcon: 'receipt' },
  members: { label: 'Members', icon: 'people-outline', activeIcon: 'people' },
  settings: { label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
};

/**
 * Custom bar: Home · History · (center FAB) · Members · Settings.
 * The FAB is a raised action button — not a route — that opens the split flow.
 */
function TabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const routes = state.routes.filter((r) => TAB_META[r.name]);
  const mid = Math.ceil(routes.length / 2);
  const left = routes.slice(0, mid);
  const right = routes.slice(mid);

  const renderTab = (route: (typeof routes)[number]) => {
    const meta = TAB_META[route.name];
    const active = state.routes[state.index].key === route.key;
    const color = active ? theme.primary : theme.muted;

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={styles.tab}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name);
        }}
      >
        <Ionicons name={active ? meta.activeIcon : meta.icon} size={24} color={color} />
        <ThemedText type="small" style={[styles.label, { color }]}>
          {meta.label}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.barWrap, { paddingBottom: insets.bottom, backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <View style={styles.row}>
        {left.map(renderTab)}
        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Split a bill"
            onPress={() => router.push('/upload')}
            style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary }, pressed && styles.fabPressed]}
          >
            <Ionicons name="add" size={32} color={theme.onPrimary} />
          </Pressable>
        </View>
        {right.map(renderTab)}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  // Register for push + refresh the feed while the tabs are mounted.
  usePushRegistration();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader />
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="members" options={{ title: 'Members' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  barWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'flex-end', height: 60, paddingHorizontal: Spacing.two },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%' },
  label: { fontSize: 11, lineHeight: 14 },
  fabSlot: { width: 72, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
