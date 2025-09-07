import React from "react";
import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { useStorefront } from "../src/hooks/useStorefront";

const CONSUMABLE_SKUS = [
  { 
    id: "consumable_streakshield_1", 
    name: "Streak Shield", 
    description: "Protect your streak on difficult days",
    icon: "🛡️"
  },
  { 
    id: "consumable_xp_booster_7d", 
    name: "XP Booster (7 days)", 
    description: "Double XP for a week",
    icon: "🚀"
  },
  { 
    id: "cos_theme_teal_nebula", 
    name: "Theme: Teal Nebula", 
    description: "Beautiful teal color theme",
    icon: "🌌"
  }
];

export default function Store() {
  const { purchaseSku, loading, isPro } = useStorefront();

  const renderItem = ({ item }: { item: typeof CONSUMABLE_SKUS[0] }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </View>
      </View>
      <Button
        title="Buy"
        onPress={() => purchaseSku(item.id)}
        disabled={loading}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        {isPro && (
          <View style={styles.proTag}>
            <Text style={styles.proTagText}>PRO</Text>
          </View>
        )}
      </View>

      {loading && (
        <Text style={styles.loadingText}>Loading products...</Text>
      )}

      <FlatList
        data={CONSUMABLE_SKUS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Pro users get exclusive discounts on all store items!
        </Text>
        {!isPro && (
          <Text style={styles.upgradeHint}>
            Upgrade to Pro for better deals →
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1D1D1F",
  },
  proTag: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proTagText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginVertical: 24,
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  upgradeHint: {
    textAlign: "center",
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
});