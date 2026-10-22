import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'home', icon: 'view-dashboard-outline' },
  { name: 'stock', title: 'stock', icon: 'package-variant-closed' },
  { name: 'vente', title: 'sales', icon: 'cart-outline' },
  { name: 'historique', title: 'history', icon: 'history' },
];

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(title),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name={icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
