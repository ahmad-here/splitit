import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AmountText } from '@/components/ui/amount-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import type { Assignment } from '@/db/models';
import { useFlow } from '@/store/flow-context';
import { computePerPerson } from '@/utils/compute-split';

export default function EditScreen() {
  const router = useRouter();
  const { draft, updateResult } = useFlow();

  const initialAssignments = draft?.result.assignments ?? [];
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);

  const participants = useMemo(() => draft?.participants ?? [], [draft]);

  const perPerson = useMemo(() => {
    if (!draft) return [];
    return computePerPerson(draft.result.items, assignments, participants, draft.result.tax, draft.result.tip);
  }, [draft, assignments, participants]);

  if (!draft) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="textSecondary">
          Nothing to edit.
        </ThemedText>
      </Screen>
    );
  }

  function togglePerson(item: string, person: string) {
    setAssignments((prev) => {
      const existing = prev.find((a) => a.item === item);
      if (!existing) return [...prev, { item, people: [person] }];
      const has = existing.people.includes(person);
      const people = has ? existing.people.filter((p) => p !== person) : [...existing.people, person];
      return prev.map((a) => (a.item === item ? { ...a, people } : a));
    });
  }

  function done() {
    updateResult({ ...draft!.result, assignments, perPerson });
    router.back();
  }

  return (
    <Screen>
      <SectionHeader title="Assign each item" />
      {draft.result.items.map((item, idx) => {
        const assigned = assignments.find((a) => a.item === item.name)?.people ?? [];
        return (
          <Card key={`${item.name}-${idx}`} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                {item.qty > 1 ? `${item.qty}× ` : ''}
                {item.name}
              </ThemedText>
              <AmountText amount={item.price} type="small" />
            </View>
            <View style={styles.chips}>
              {participants.map((p) => (
                <Chip key={p} label={p} selected={assigned.includes(p)} onPress={() => togglePerson(item.name, p)} />
              ))}
            </View>
          </Card>
        );
      })}

      <SectionHeader title="New totals" />
      <Card>
        {perPerson.map((p, i) => (
          <View key={p.name} style={[styles.row, i > 0 && styles.divider]}>
            <ThemedText type="smallBold" style={{ flex: 1 }}>
              {p.name}
            </ThemedText>
            <AmountText amount={p.amount} />
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button title="Apply changes" onPress={done} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemCard: { gap: Spacing.two, marginBottom: Spacing.two },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#8883' },
  actions: { marginTop: Spacing.four },
});
