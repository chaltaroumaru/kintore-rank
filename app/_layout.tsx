import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import SetupNotice from '@/components/SetupNotice';
import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LogsProvider } from '@/lib/logs';
import { initNotifications } from '@/lib/notifications';
import { isSupabaseConfigured } from '@/lib/supabase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();
initNotifications().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        {isSupabaseConfigured ? (
          <AuthProvider>
            <LogsProvider>
              <RootNavigator />
            </LogsProvider>
          </AuthProvider>
        ) : (
          <SetupNotice />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  const signedIn = !!session;
  const hasProfile = !!profile;
  // 読み込み中にガードを false にすると開いていたURL(例: /record)からリダイレクトされてしまうため、
  // 読み込み完了までは全ルートを許可し、上からローディング表示で覆う
  const allow = (cond: boolean) => loading || cond;

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={allow(signedIn && hasProfile)}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={allow(signedIn && !hasProfile)}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={allow(!signedIn)}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
