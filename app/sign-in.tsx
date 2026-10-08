import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Chip, ErrorText, Field, Muted, Screen } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('メールアドレスを正しく入力してください');
    if (password.length < 6) return setError('パスワードは6文字以上にしてください');

    setLoading(true);
    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // メール確認が有効な Supabase プロジェクトではセッションが返らない
        if (!data.session) setInfo('確認メールを送信しました。メール内のリンクを開いてからログインしてください。');
      }
    } catch (e) {
      setError(translateAuthError(e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: space.sm, marginTop: space.xl * 2, marginBottom: space.lg }}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800', letterSpacing: 2 }}>KINTORE RANK</Text>
        <Text style={{ color: colors.text, fontSize: 30, fontWeight: '900', lineHeight: 38 }}>
          筋トレを「記録」から{'\n'}「成長と競争」へ。
        </Text>
        <Muted>前回比較と自己ベストで、日々の小さな成長を見逃さない。</Muted>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="ログイン" selected={mode === 'signIn'} onPress={() => setMode('signIn')} />
          <Chip label="新規登録" selected={mode === 'signUp'} onPress={() => setMode('signUp')} />
        </View>
        <Field
          label="メールアドレス"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="パスワード (6文字以上)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          onSubmitEditing={submit}
        />
        <ErrorText>{error}</ErrorText>
        {info ? <Text style={{ color: colors.up }}>{info}</Text> : null}
        <Button title={mode === 'signIn' ? 'ログイン' : 'アカウントを作成'} onPress={submit} loading={loading} />
      </Card>
    </Screen>
  );
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'メールアドレスまたはパスワードが違います';
  if (/already registered/i.test(message)) return 'このメールアドレスは登録済みです。ログインしてください';
  if (/email not confirmed/i.test(message)) return 'メールアドレスの確認が完了していません';
  if (/rate limit/i.test(message)) return '試行回数が多すぎます。しばらく待ってから再度お試しください';
  return message || '認証に失敗しました';
}
