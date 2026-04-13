import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useActiveAccount } from "thirdweb/react";
import { Redirect } from "expo-router";

export default function AppLayout() {
  const account = useActiveAccount();

  if (!account) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "#1E293B",
          paddingBottom: 4,
        },
        tabBarActiveTintColor: "#F59E0B",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="promotion-screen"
        options={{
          title: "Promotions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lineage-screen"
        options={{
          title: "Lineage",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-network" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
