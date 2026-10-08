import ProfileForm from '@/components/ProfileForm';
import { Button, Card, Muted, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function OnboardingScreen() {
  const { session, setProfile, signOut } = useAuth();
  if (!session) return null;

  return (
    <Screen>
      <Title>はじめに</Title>
      <Muted>体重は、Phase 2 で導入する「体重比」での筋力評価に使います。あとからプロフィールで変更できます。</Muted>
      <Card>
        <ProfileForm userId={session.user.id} initial={null} submitLabel="はじめる" onSaved={setProfile} />
      </Card>
      <Button title="ログアウト" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
