import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge, Card, Chip, ErrorText, Label, Muted, Screen, Title } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { formatDateJa } from '@/lib/date';
import { CATEGORY_LABEL, EXERCISES, exerciseName } from '@/lib/exercises';
import { useLogs } from '@/lib/logs';
import { diffLabels, diffTrend, formatSet, type LogInsight } from '@/lib/progress';
import type { Category, WorkoutLog } from '@/lib/types';

type Filter = 'all' | Category;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'gym', label: CATEGORY_LABEL.gym },
  { key: 'bodyweight', label: CATEGORY_LABEL.bodyweight },
];

type Section = { title: string; data: WorkoutLog[] };

function confirmDelete(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert('記録を削除', message, [
      { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
      { text: '削除', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function HistoryScreen() {
  const { logs, insights, bests, loading, error, reload, remove } = useLogs();
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredLogs = useMemo(
    () => (filter === 'all' ? logs : logs.filter((l) => l.category === filter)),
    [logs, filter]
  );

  const sections = useMemo<Section[]>(() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const log of filteredLogs) {
      const list = map.get(log.performed_on) ?? [];
      list.push(log);
      map.set(log.performed_on, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, data]) => ({ title: date, data }));
  }, [filteredLogs]);

  // 自己ベストは種目マスタの並び順で表示
  const bestList = useMemo(
    () =>
      EXERCISES.filter((e) => filter === 'all' || e.category === filter)
        .map((e) => bests.get(e.id))
        .filter((b): b is WorkoutLog => !!b),
    [bests, filter]
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }

  async function onLongPress(log: WorkoutLog) {
    const ok = await confirmDelete(
      `${formatDateJa(log.performed_on)} ${exerciseName(log.exercise_id)} ${formatSet(log)} を削除しますか?`
    );
    if (!ok) return;
    setDeleteError(null);
    try {
      await remove(log.id);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '削除に失敗しました');
    }
  }

  const header = (
    <View style={styles.header}>
      <Title>履歴</Title>
      <View style={styles.row}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      <ErrorText>{deleteError}</ErrorText>

      {bestList.length > 0 && (
        <Card>
          <Label>自己ベスト</Label>
          {bestList.map((b) => (
            <View key={b.exercise_id} style={styles.bestRow}>
              <Text style={styles.bestName}>{exerciseName(b.exercise_id)}</Text>
              <View style={styles.bestRight}>
                <Text style={styles.bestValue}>{formatSet(b)}</Text>
                <Muted style={styles.small}>{formatDateJa(b.performed_on)}</Muted>
              </View>
            </View>
          ))}
        </Card>
      )}

      {filteredLogs.length > 0 && <Label>記録</Label>}
    </View>
  );

  return (
    <Screen scroll={false}>
      {loading && logs.length === 0 && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? null : <Muted style={styles.empty}>まだ記録がありません。記録タブから最初のトレーニングを登録しましょう</Muted>
          }
          renderSectionHeader={({ section }) => <Text style={styles.dateHeader}>{formatDateJa(section.title)}</Text>}
          renderItem={({ item }) => (
            <LogRow log={item} insight={insights.get(item.id)} onLongPress={() => onLongPress(item)} />
          )}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      )}
    </Screen>
  );
}

function LogRow({
  log,
  insight,
  onLongPress,
}: {
  log: WorkoutLog;
  insight: LogInsight | undefined;
  onLongPress: () => void;
}) {
  const diff = insight?.diff ?? null;
  const labels = diff ? diffLabels(diff) : [];
  const trend = diff ? diffTrend(diff) : 0;
  const tone = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityHint="長押しで削除"
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <View style={styles.itemTop}>
        <Text style={styles.itemName}>{exerciseName(log.exercise_id)}</Text>
        <Text style={styles.itemValue}>{formatSet(log)}</Text>
      </View>
      <View style={styles.badges}>
        {insight?.isPersonalBest && <Badge label="自己ベスト更新" tone="gold" />}
        {insight?.isFirst && <Badge label="初記録" />}
        {labels.map((l) => (
          <Badge key={l} label={l} tone={tone} />
        ))}
        {diff && labels.length === 0 && <Badge label="前回と同じ" />}
      </View>
      {log.memo ? <Muted>{log.memo}</Muted> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: space.xl, gap: space.sm },
  header: { gap: space.md, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: space.xl },
  small: { fontSize: 12 },
  bestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  bestName: { color: colors.text, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  bestRight: { alignItems: 'flex-end' },
  bestValue: { color: colors.gold, fontSize: 15, fontWeight: '700' },
  dateHeader: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: space.md },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  itemValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
