import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';

import { colors } from '@/constants/theme';

type IconName = { ios: SFSymbol; android: string; web: string };

function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  // android/web は Material Symbols の名前
  return <SymbolView name={name as never} tintColor={color} size={26} />;
}

function icon(name: IconName) {
  const Icon = ({ color }: { color: ColorValue }) => <TabIcon name={name} color={color} />;
  Icon.displayName = `TabIcon(${name.web})`;
  return Icon;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', tabBarIcon: icon({ ios: 'house.fill', android: 'home', web: 'home' }) }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '記録',
          tabBarIcon: icon({ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          tabBarIcon: icon({ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: icon({ ios: 'person.crop.circle', android: 'person', web: 'person' }),
        }}
      />
    </Tabs>
  );
}
