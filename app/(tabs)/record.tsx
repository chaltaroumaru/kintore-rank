import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Chip, ErrorText, Field, Label, Muted, Screen, Title } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { daysAgo, formatDateJa, isValidISODate, today } from '@/lib/date';
import { CATEGORY_LABEL, exerciseName, exercisesOf } from '@/lib/exercises';
import { useLogs } from '@/lib/logs';
import { diffLabels, diffTrend, formatSet, type LogInsight } from '@/lib/progress';
import type { Category } from '@/lib/types';

const CATEGORIES: Category[] = ['gym', 'bodyweight'];

function parseIntStrict(s: string): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
}

export default function RecordScreen() {
  const { profile } = useAuth();
  const { logs, bests, add } = useLogs();

  // 未選択の間はプロフィールのメインカテゴリに従う (プロフィールが後から読み込まれても追従する)
  const [chosenCategory, setChosenCategory] = useState<Category | null>(null);
  const category: Category = chosenCategory ?? profile?.main_category ?? 'gym';
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('1');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<LogInsight | null>(null);

  const exercises = useMemo(() => exercisesOf(category), [category]);
  const previous = useMemo(
    () => (exerciseId ? (logs.find((l) => l.exercise_id === exerciseId) ?? null) : null),
    [logs, exerciseId]
  );
  const best = exerciseId ? (bests.get(exerciseId) ?? null) : null;
  const isGym = category === 'gym';

  function changeCategory(c: Category) {
    if (c === category) return;
    setChosenCategory(c);
    setExerciseId(null);
    setWeight('');
    setError(null);
  }

  function fillPrevious() {
    if (!previous) return;
    setWeight(previous.category === 'bodyweight' && previous.weight_kg === 0 ? '' : String(previous.weight_kg));
    setReps(String(previous.reps));
    setSets(String(previous.sets));
  }

  async function save() {
    setError(null);
    if (!exerciseId) return setError('種目を選んでください');
    if (!isValidISODate(date)) return setError('日付は YYYY-MM-DD の形式で正しい日付を入力してください');

    const w = weight.trim();
    let weightKg = 0;
    if (w === '') {
      if (isGym) return setError('重量を入力してください');
    } else {
      const n = Number(w.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || n > 1000) return setError('重量は0〜1000kgの数値で入力してください');
      if (isGym && n === 0) return setError('重量は0より大きい値を入力してください');
      weightKg = Math.round(n * 100) / 100;
    }

    const r = parseIntStrict(reps);
    if (r === null || r < 1 || r > 1000) return setError('回数は1〜1000の整数で入力してください');
    const s = parseIntStrict(sets);
    if (s === null || s < 1 || s > 100) return setError('セット数は1〜100の整数で入力してください');

    setSaving(true);
    try {
      const insight = await add({
        performed_on: date,
        exercise_id: exerciseId,
        category,
        weight_kg: weightKg,
        reps: r,
        sets: s,
        memo: memo.trim() === '' ? null : memo.trim(),
      });
      setResult(insight);
      // 連続入力しやすいよう、回数とメモだけクリア
      setReps('');
      setMemo('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Title>トレーニング記録</Title>

      {result && <ResultCard insight={result} />}

      <View style={styles.section}>
        <Label>カテゴリ</Label>
        <View style={styles.row}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => changeCategory(c)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Label>種目</Label>
        <View style={styles.wrap}>
          {exercises.map((e) => (
            <Chip key={e.id} label={e.name} selected={exerciseId === e.id} onPress={() => setExerciseId(e.id)} />
          ))}
        </View>
      </View>

      {exerciseId && (
        <Card>
          <View style={styles.infoRow}>
            <Muted>前回の記録</Muted>
            <Text style={styles.infoValue}>
              {previous ? `${formatSet(previous)}(${formatDateJa(previous.performed_on)})` : 'まだありません'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Muted>自己ベスト</Muted>
            <Text style={[styles.infoValue, best && { color: colors.gold }]}>
              {best ? `${formatSet(best)}(${formatDateJa(best.performed_on)})` : 'まだありません'}
            </Text>
          </View>
          {previous && <Button title="前回と同じ値を入れる" variant="secondary" onPress={fillPrevious} />}
        </Card>
      )}

      <View style={styles.section}>
        <Field
          label="日付 (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder="2026-01-01"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
        />
        <View style={styles.row}>
          <Chip label="今日" selected={date === today()} onPress={() => setDate(today())} />
          <Chip label="昨日" selected={date === daysAgo(1)} onPress={() => setDate(daysAgo(1))} />
        </View>
      </View>

      <Field
        label={isGym ? '重量 (kg)' : '加重 (kg・任意)'}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder={isGym ? '例: 60' : '例: 0'}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="回数" value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="例: 10" />
        </View>
        <View style={styles.half}>
          <Field label="セット数" value={sets} onChangeText={setSets} keyboardType="number-pad" placeholder="1" />
        </View>
      </View>

      <Field
        label="メモ (任意)"
        value={memo}
        onChangeText={setMemo}
        multiline
        style={{ minHeight: 88, textAlignVertical: "top" }}
        maxLength={500}
        placeholder="フォームの気づきなど"
      />

      <ErrorText>{error}</ErrorText>
      <Button title="保存する" onPress={save} loading={saving} />
    </Screen>
  );
}

function ResultCard({ insight }: { insight: LogInsight }) {
  const { log, diff, isFirst, isPersonalBest } = insight;
  const labels = diff ? diffLabels(diff) : [];
  const trend = diff ? diffTrend(diff) : 0;
  const tone = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

  return (
    <Card style={[styles.result, isPersonalBest && { borderColor: colors.gold }]}>
      <Muted>保存しました</Muted>
      <Text style={styles.resultTitle}>
        {exerciseName(log.exercise_id)} {formatSet(log)}
      </Text>
      <View style={styles.wrap}>
        {isFirst && <Badge label="初記録!" tone="gold" />}
        {isPersonalBest && <Badge label="自己ベスト更新!" tone="gold" />}
        {diff && labels.map((l) => <Badge key={l} label={l} tone={tone} />)}
        {diff && labels.length === 0 && <Badge label="前回と同じ" />}
      </View>
      {insight.previous && <Muted>前回: {formatSet(insight.previous)}</Muted>}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  half: { flex: 1 },
  infoRow: { gap: space.xs },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  result: { borderColor: colors.primary, borderWidth: 1 },
  resultTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
