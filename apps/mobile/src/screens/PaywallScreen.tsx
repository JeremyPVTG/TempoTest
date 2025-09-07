import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native'
import { useStorefront } from '../hooks/useStorefront'
import { SafeStorefront, SafePurchaseButton } from '../components/SafeStorefront'

type PlanType = 'monthly' | 'annual'

export function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual')
  const [isLoading, setIsLoading] = useState(false)
  
  const { 
    purchase, 
    restore, 
    getLocalizedPrice,
    isPro,
    offerings 
  } = useStorefront()

  if (isPro) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You're already Pro!</Text>
        <Text style={styles.subtitle}>Thanks for supporting Habituals</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleManageSubscription()}
        >
          <Text style={styles.buttonText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const monthlyPrice = getLocalizedPrice('pro_month')
  const annualPrice = getLocalizedPrice('pro_year')

  const handlePurchase = async () => {
    try {
      setIsLoading(true)
      const sku = selectedPlan === 'monthly' ? 'pro_month' : 'pro_year'
      await purchase(sku)
      Alert.alert('Success!', 'Welcome to Habituals Pro!')
    } catch (error) {
      console.error('Purchase failed:', error)
      Alert.alert(
        'Purchase Failed', 
        'Please try again or contact support if the problem persists.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    try {
      setIsLoading(true)
      await restore()
      Alert.alert('Restored!', 'Your purchases have been restored.')
    } catch (error) {
      console.error('Restore failed:', error)
      Alert.alert('Restore Failed', 'No purchases found to restore.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = () => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions',
    })
    
    if (url) {
      Linking.openURL(url)
    }
  }

  return (
    <SafeStorefront>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          Unlock advanced features and support the app
        </Text>
      </View>

      <View style={styles.planSelector}>
        <TouchableOpacity
          style={[
            styles.planOption,
            selectedPlan === 'monthly' && styles.planOptionSelected
          ]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <Text style={styles.planTitle}>Monthly</Text>
          <Text style={styles.planPrice}>{monthlyPrice || 'Loading...'}</Text>
          <Text style={styles.planDescription}>Billed monthly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.planOption,
            selectedPlan === 'annual' && styles.planOptionSelected
          ]}
          onPress={() => setSelectedPlan('annual')}
        >
          <Text style={styles.planTitle}>Annual</Text>
          <Text style={styles.planPrice}>{annualPrice || 'Loading...'}</Text>
          <Text style={styles.planDescription}>Best value • Save 30%</Text>
          {selectedPlan === 'annual' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>RECOMMENDED</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Pro Features:</Text>
        <Text style={styles.feature}>• Unlimited habit tracking</Text>
        <Text style={styles.feature}>• Advanced analytics and insights</Text>
        <Text style={styles.feature}>• Custom themes and personalization</Text>
        <Text style={styles.feature}>• Priority support</Text>
        <Text style={styles.feature}>• Sync across all devices</Text>
      </View>

      <SafePurchaseButton onPress={handlePurchase}>
        <TouchableOpacity
          style={[styles.purchaseButton, isLoading && styles.buttonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.purchaseButtonText}>
            {isLoading ? 'Processing...' : 'Start Free Trial'}
          </Text>
        </TouchableOpacity>
      </SafePurchaseButton>

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={isLoading}
      >
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manageButton}
        onPress={handleManageSubscription}
      >
        <Text style={styles.manageButtonText}>Manage Subscription</Text>
      </TouchableOpacity>

      <View style={styles.legal}>
        <Text style={styles.legalText}>
          Subscription renews automatically. Cancel anytime via App Store/Google Play. 
          Prices vary by region.
        </Text>
        <Text style={styles.legalText}>
          Purchases handled by Apple/Google. We do not store payment details.
        </Text>
      </View>
      </ScrollView>
    </SafeStorefront>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  planSelector: {
    marginBottom: 30,
  },
  planOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  planOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  features: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  restoreButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  manageButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  manageButtonText: {
    color: '#666',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  legal: {
    marginTop: 20,
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
})