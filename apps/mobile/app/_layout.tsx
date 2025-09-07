import { Stack } from "expo-router";
import React from "react";
import { QueryProvider } from "../src/providers/Query";
import { SyncBoundary } from "../src/providers/SyncBoundary";

export default function RootLayout() {
  return (
    <QueryProvider>
      <SyncBoundary>
        <Stack screenOptions={{ headerShown: true }}>
          <Stack.Screen name="index" options={{ title: "Habits" }} />
          <Stack.Screen name="paywall" options={{ title: "Go Pro" }} />
          <Stack.Screen name="store" options={{ title: "Store" }} />
        </Stack>
      </SyncBoundary>
    </QueryProvider>
  );
}