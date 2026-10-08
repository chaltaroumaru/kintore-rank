import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Muted, Screen, Title } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Title>ページが見つかりません</Title>
      <Muted>URL が間違っているか、ページが移動しました。</Muted>
      <Link href="/">
        <Text style={{ color: colors.primary, fontWeight: '700' }}>ホームへ戻る</Text>
      </Link>
    </Screen>
  );
}
