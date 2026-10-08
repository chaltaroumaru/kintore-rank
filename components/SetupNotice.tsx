import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { Card, Muted, Screen, Title } from '@/components/ui';
import { colors } from '@/constants/theme';

/** .env に Supabase の接続情報が無いときに出す案内 */
export default function SetupNotice() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Screen>
      <Title>セットアップが必要です</Title>
      <Card>
        <Muted>Supabase の接続情報が設定されていません。プロジェクト直下に .env を作成してください。</Muted>
        <Text style={{ color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>
          EXPO_PUBLIC_SUPABASE_URL=...{'\n'}EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
        </Text>
        <Muted>手順は docs/DESIGN.md の「6. セットアップ手順」を参照。設定後に開発サーバーを再起動してください。</Muted>
      </Card>
    </Screen>
  );
}
