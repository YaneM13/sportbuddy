import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/lib/AppContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabLayout() {
  const { isDark, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.navBg,
          borderTopColor: colors.navBorder,
          borderTopWidth: 0.5,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'All Sports',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>⚽</Text>,
        }}
      />
    </Tabs>
  );
}