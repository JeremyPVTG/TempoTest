import React from "react";
import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { Q, M } from "../src/lib/data";
import { occurredAt } from "@habituals/domain/time/occurredAt";
import { Link } from "expo-router";

export default function Index() {
  const { data: habits, isLoading } = Q.useHabits();
  const markDone = M.useMarkDone();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading habits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigationRow}>
        <Link href="/paywall" style={styles.link}>
          <Text style={styles.linkText}>Paywall</Text>
        </Link>
        <Link href="/store" style={styles.link}>
          <Text style={styles.linkText}>Store</Text>
        </Link>
      </View>

      <FlatList
        data={habits || []}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <View style={styles.habitItem}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Button
              title="Mark Done"
              onPress={() =>
                markDone.mutate({
                  habit_id: item.id,
                  occurred_at_tz: occurredAt()
                } as any)
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No habits yet. Start building better habits!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  navigationRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  link: {
    padding: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  linkText: {
    color: "white",
    fontWeight: "600",
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  habitTitle: {
    fontSize: 16,
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 32,
  },
});