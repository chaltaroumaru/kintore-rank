import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, ErrorText, Muted } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import {
  cancelAll,
  getPermission,
  loadSettings,
  notificationsSupported,
  requestPermission,
  saveSettings,
  sendTestNotification,
  type NotificationSettings,
  type PermissionState,
} from '@/lib/notifications';

const PERMISSION_LABEL: Record<PermissionState, string> = {
  granted: '許可されています',
  denied: '許可されていません',
  undetermined: 'まだ確認していません',
  unsupported: 'この環境では使えません',
};

/** プロフィール画面の「通知設定」 */
export default function NotificationSettingsCard() {
  const [settings, setSettings] = useState<NotificationSettings>(() => loadSettings());
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  const refreshPermission = useCallback(() => {
    getPermission()
      .then(setPermission)
      .catch(() => setPermission('unsupported'));
  }, []);

  // 端末の設定アプリで許可を変えて戻ってきたときに状態を反映する
  useEffect(() => {
    refreshPermission();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refreshPermission());
    return () => sub.remove();
  }, [refreshPermission]);

  function update(next: NotificationSettings) {
    setSettings(next);
    saveSettings(next);
  }

  async function toggle(enabled: boolean) {
    setError(null);
    setTestSent(false);
    if (!enabled) {
      update({ ...settings, enabled: false });
      await cancelAll().catch(() => {});
      return;
    }
    const state = permission === 'granted' ? permission : await requestPermission().catch(() => 'denied' as const);
    setPermission(state);
    if (state !== 'granted') {
      setError('通知が許可されていません。端末の設定アプリから通知を許可してください。');
      return;
    }
    update({ ...settings, enabled: true });
  }

  async function test() {
    setError(null);
    try {
      await sendTestNotification(5);
      setTestSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'テスト通知に失敗しました');
    }
  }

  const active = settings.enabled && permission === 'granted';

  return (
    <Card>
      <Text style={styles.cardTitle}>通知設定</Text>

      {!notificationsSupported ? (
        <Muted>通知はスマホアプリ版でのみ使えます(ブラウザ版は非対応)。</Muted>
      ) : (
        <>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowTitle}>通知を受け取る</Text>
              <Muted style={{ fontSize: 12 }}>端末の許可: {PERMISSION_LABEL[permission]}</Muted>
            </View>
            <Switch
              accessibilityLabel="通知を受け取る"
              value={active}
              onValueChange={toggle}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.text}
            />
          </View>

          {permission === 'denied' && (
            <Button title="端末の通知設定を開く" variant="secondary" onPress={() => Linking.openSettings()} />
          )}

          {active && (
            <>
              <Button title="テスト通知を送る(5秒後)" variant="secondary" onPress={test} />
              {testSent && <Text style={styles.ok}>5秒後に通知が届きます。アプリを閉じて待ってみてください。</Text>}
            </>
          )}

          <Muted style={{ fontSize: 12 }}>
            トレーニングのリマインダーなど、通知の内容は今後のアップデートで追加予定です。
          </Muted>
        </>
      )}
      <ErrorText>{error}</ErrorText>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  ok: { color: colors.up, fontSize: 13 },
});
