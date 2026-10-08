import { router } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, ErrorText, Label, Muted } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { daysAgo, today } from '@/lib/date';
import { CATEGORY_LABEL, exerciseName } from '@/lib/exercises';
import { useLogs } from '@/lib/logs';
import { diffLabels, diffTrend, formatSet } from '@/lib/progress';

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS'] as const;
const FIRST_STEPS = [
  { title: '記録する', body: '種目・重量・回数を入力して保存' },
  { title: '前回と比べる', body: '同じ種目の前回から何が伸びたかを表示' },
  { title: '自己ベストを更新', body: 'ベストを超えたらゴールドバッジ' },
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const { logs, insights, loading, error, reload } = useLogs();

  const week = useMemo(() => {
    const from = daysAgo(6);
    const to = today();
    const inWeek = logs.filter((l) => l.performed_on >= from && l.performed_on <= to);
    return {
      days: new Set(inWeek.map((l) => l.performed_on)).size,
      count: inWeek.length,
      bests: inWeek.filter((l) => insights.get(l.id)?.isPersonalBest).length,
    };
  }, [logs, insights]);

  const growth = useMemo(() => {
    const result = [];
    for (const log of logs) {
      const ins = insights.get(log.id);
      if (ins?.diff && diffTrend(ins.diff) > 0) result.push(ins);
      if (result.length >= 5) break;
    }
    return result;
  }, [logs, insights]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.textMuted} colors={[colors.primary]} />
        }>
        <View style={{ gap: space.xs }}>
          <Text style={styles.greeting}>{profile?.nickname ?? ''} さん</Text>
          {profile && <Muted>メインカテゴリ: {CATEGORY_LABEL[profile.main_category]}</Muted>}
        </View>

        <ErrorText>{error}</ErrorText>

        {/* 階級カード (Phase 2 予告) */}
        <Card>
          <Label>あなたの階級</Label>
          <View style={styles.locked}>
            <Text style={styles.rankBig}>—</Text>
            <View style={styles.rankRow}>
              {RANKS.map((r) => (
                <View key={r} style={styles.rankPill}>
                  <Text style={styles.rankPillText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
          <Muted>階級・ポイント・全国ランキングは Phase 2 で公開予定</Muted>
        </Card>

        {/* 今週のサマリ */}
        <View style={{ gap: space.sm }}>
          <Label>今週のサマリ (直近7日)</Label>
          <View style={styles.statRow}>
            <StatTile value={week.days} unit="日" label="トレーニング" />
            <StatTile value={week.count} unit="件" label="記録数" />
            <StatTile value={week.bests} unit="回" label="自己ベスト更新" highlight />
          </View>
        </View>

        <Button title="記録する" onPress={() => router.push('/record')} />

        {logs.length === 0 && !loading ? (
          <Card>
            <Text style={styles.cardTitle}>はじめの一歩</Text>
            {FIRST_STEPS.map((s, i) => (
              <View key={s.title} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Muted>{s.body}</Muted>
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>最近の成長</Text>
            {growth.length === 0 ? (
              <Muted>記録を続けると、ここに成長が表示されます</Muted>
            ) : (
              growth.map((ins) => (
                <View key={ins.log.id} style={styles.growthRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.growthName}>{exerciseName(ins.log.exercise_id)}</Text>
                    <Muted>{formatSet(ins.log)}</Muted>
                  </View>
                  <View style={styles.badges}>
                    {ins.isPersonalBest && <Badge label="自己ベスト" tone="gold" />}
                    {diffLabels(ins.diff!).map((d) => (
                      <Badge key={d} label={d} tone="up" />
                    ))}
                  </View>
                </View>
              ))
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ value, unit, label, highlight }: { value: number; unit: string; label: string; highlight?: boolean }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, highlight && value > 0 && { color: colors.gold }]}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  locked: { opacity: 0.45, alignItems: 'center', gap: space.md },
  rankBig: { color: colors.text, fontSize: 56, fontWeight: '900', lineHeight: 64 },
  rankRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.xs },
  rankPill: {
    minWidth: 34,
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  rankPillText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: space.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '800' },
  statUnit: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  statLabel: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.primaryText, fontWeight: '800' },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  growthName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: space.xs, maxWidth: '55%' },
});
