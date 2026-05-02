import React from 'react';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Hide the tab bar — this group only houses the login screen.
        // Navigation to the real app happens via router.replace("/dashboard").
        tabBarStyle: { display: 'none' },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{ headerShown: false }}
      />
    </Tabs>
  );
}
