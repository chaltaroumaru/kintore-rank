import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import NotificationSettingsCard from '@/components/NotificationSettingsCard';
import ProfileForm from '@/components/ProfileForm';
import { Button, Card, Label, Muted, Screen, Title } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatDateJa } from '@/lib/date';
import { useLogs } from '@/lib/logs';
import type { Profile } from '@/lib/types';

export default function ProfileScreen() {
  const { session, profile, setProfile, signOut } = useAuth();
  const { logs, bests } = useLogs();
  const [savedMsg, setSavedMsg] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const stats = useMemo(() => {
    const days = new Set(logs.map((l) => l.performed_on));
    let first: string | null = null;
    for (const d of days) if (first === null || d < first) first = d;
    return { total: logs.length, days: days.size, bestCount: bests.size, first };
  }, [logs, bests]);

  function handleSaved(p: Profile) {
    setProfile(p);
    setSavedMsg(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSavedMsg(false), 2500);
  }

  function confirmSignOut() {
    const message = 'ログアウトしますか?';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) signOut();
      return;
    }
    Alert.alert('ログアウト', message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Title>プロフィール</Title>
        {session?.user.email && <Muted>{session.user.email} でログイン中</Muted>}
      </View>

      <Card>
        <Text style={styles.cardTitle}>これまでの実績</Text>
        <View style={styles.grid}>
          <Stat label="総記録数" value={`${stats.total} 件`} />
          <Stat label="トレーニング日数" value={`${stats.days} 日`} />
          <Stat label="自己ベストのある種目" value={`${stats.bestCount} 種目`} />
          <Stat label="最初の記録日" value={stats.first ? formatDateJa(stats.first) : '—'} />
        </View>
      </Card>

      <Card style={{ opacity: 0.8 }}>
        <Text style={styles.cardTitle}>体重比の目安</Text>
        <View style={styles.weightRow}>
          <Label>現在の体重</Label>
          <Text style={styles.weightValue}>{profile ? `${profile.weight_kg} kg` : '—'}</Text>
        </View>
        <Muted>推定1RM ÷ 体重 で筋力を評価します(Phase 2)</Muted>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>プロフィール編集</Text>
        {session && (
          <ProfileForm
            key={profile?.id ?? 'new'}
            userId={session.user.id}
            initial={profile}
            submitLabel="保存する"
            onSaved={handleSaved}
          />
        )}
        {savedMsg && <Text style={styles.saved}>保存しました</Text>}
      </Card>

      <NotificationSettingsCard />

      <Button title="ログアウト" variant="secondary" onPress={confirmSignOut} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  weightRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  weightValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  saved: { color: colors.up, fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
