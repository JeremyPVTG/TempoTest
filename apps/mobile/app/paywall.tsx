import React from "react";
import { View, Text, Button, StyleSheet, ScrollView, Platform } from "react-native";
import { useStorefront } from "../src/hooks/useStorefront";

export default function Paywall() {
  const { isPro, offerings, purchase, restore, loading } = useStorefront();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Go Pro</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusValue, isPro ? styles.proStatus : styles.freeStatus]}>
          {isPro ? "Pro ✅" : "Free"}
        </Text>
      </View>

      {loading && (
        <Text style={styles.loadingText}>Loading offerings...</Text>
      )}

      {!loading && offerings?.current && (
        <View style={styles.offeringsSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {offerings.current.availablePackages?.map((pkg: any) => (
            <View key={pkg.identifier} style={styles.packageCard}>
              <View style={styles.packageInfo}>
                <Text style={styles.packageType}>{pkg.packageType}</Text>
                <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                <Text style={styles.packageDescription}>
                  {pkg.product.description || "Full access to premium features"}
                </Text>
              </View>
              <Button
                title={`Buy ${pkg.packageType}`}
                onPress={() => purchase(pkg)}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsSection}>
        <Button
          title="Restore Purchases"
          onPress={restore}
          color="#34C759"
        />
        
        <View style={styles.spacer} />
        
        <Button
          title={`Manage Subscription (${Platform.OS})`}
          onPress={() => {
            // In production, this would open platform-specific subscription management
            console.log("Open subscription management");
          }}
          color="#FF9500"
        />
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Premium Features</Text>
        <Text style={styles.feature}>✨ Advanced analytics and insights</Text>
        <Text style={styles.feature}>🔥 Streak shields and boosters</Text>
        <Text style={styles.feature}>🎨 Custom themes and personalization</Text>
        <Text style={styles.feature}>🤖 AI-powered coaching and suggestions</Text>
        <Text style={styles.feature}>☁️ Cloud sync across all devices</Text>
        <Text style={styles.feature}>📊 Detailed progress reports</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#1D1D1F",
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    color: "#666",
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  proStatus: {
    color: "#34C759",
  },
  freeStatus: {
    color: "#666",
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginVertical: 24,
  },
  offeringsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1D1D1F",
  },
  packageCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packageInfo: {
    marginBottom: 12,
  },
  packageType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D1D1F",
    textTransform: "capitalize",
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginVertical: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: "#666",
  },
  actionsSection: {
    marginBottom: 24,
  },
  spacer: {
    height: 12,
  },
  featuresSection: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    color: "#1D1D1F",
  },
});