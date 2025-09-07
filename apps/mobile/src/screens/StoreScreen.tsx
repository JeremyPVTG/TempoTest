import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native'
import { useStorefront } from '../hooks/useStorefront'
import { useWalletData } from '@habituals/data'
import { SafeStorefront, SafePurchaseButton } from '../components/SafeStorefront'

interface StoreItem {
  sku: string
  title: string
  description: string
  icon: string
  category: 'consumable' | 'cosmetic' | 'bundle'
}

const STORE_ITEMS: StoreItem[] = [
  {
    sku: 'bundle_starter_pack',
    title: 'Starter Pack',
    description: 'Get started with bonus content and exclusive items',
    icon: '🎁',
    category: 'bundle',
  },
  {
    sku: 'cos_theme_teal_nebula',
    title: 'Teal Nebula Theme',
    description: 'Beautiful cosmic theme for your habit tracker',
    icon: '🌌',
    category: 'cosmetic',
  },
  {
    sku: 'consumable_streakshield_1',
    title: 'Streak Shield',
    description: 'Protect your streak from one missed day',
    icon: '🛡️',
    category: 'consumable',
  },
  {
    sku: 'consumable_xp_booster_7d',
    title: '7-Day XP Booster',
    description: 'Double your XP gains for a full week',
    icon: '⚡',
    category: 'consumable',
  },
]

export function StoreScreen() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  const { 
    purchase, 
    getLocalizedPrice,
    entitlements 
  } = useStorefront()
  
  const walletData = useWalletData()

  const handlePurchase = async (item: StoreItem) => {
    try {
      setIsLoading(item.sku)
      const result = await purchase(item.sku)
      
      // For consumables, show success and wallet update
      if (item.category === 'consumable') {
        Alert.alert(
          'Purchase Successful!',
          `${item.title} has been added to your wallet.`
        )
      } else {
        Alert.alert('Purchase Successful!', `You now have ${item.title}!`)
      }
      
    } catch (error) {
      console.error('Purchase failed:', error)
      Alert.alert(
        'Purchase Failed', 
        'Please try again or contact support if the problem persists.'
      )
    } finally {
      setIsLoading(null)
    }
  }

  const renderStoreItem = (item: StoreItem) => {
    const price = getLocalizedPrice(item.sku)
    const isOwned = entitlements[item.sku.replace('cos_', '').replace('_', '')]
    const isPurchasing = isLoading === item.sku
    
    // Check caps for consumables (simplified for now)
    let canPurchase = true
    let capMessage = ''
    
    if (item.sku === 'consumable_streakshield_1') {
      // TODO: Implement real caps checking via API
      capMessage = '1 left this week'
    }

    return (
      <View key={item.sku} style={styles.storeItem}>
        <View style={styles.itemIcon}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          
          {item.category === 'consumable' && (
            <Text style={styles.capInfo}>{capMessage}</Text>
          )}
          
          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>{price || 'Loading...'}</Text>
            
            <SafePurchaseButton onPress={() => handlePurchase(item)}>
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  (!canPurchase || isOwned || isPurchasing) && styles.buyButtonDisabled
                ]}
                disabled={!canPurchase || isOwned || isPurchasing}
              >
                <Text style={[
                  styles.buyButtonText,
                  (!canPurchase || isOwned || isPurchasing) && styles.buyButtonTextDisabled
                ]}>
                  {isPurchasing 
                    ? 'Buying...' 
                    : isOwned 
                      ? 'Owned' 
                      : !canPurchase 
                        ? 'Limit Reached'
                        : 'Buy'
                  }
                </Text>
              </TouchableOpacity>
            </SafePurchaseButton>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeStorefront>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.subtitle}>
          Enhance your habit tracking experience
        </Text>
      </View>

      <View style={styles.walletSection}>
        <Text style={styles.walletTitle}>Your Wallet</Text>
        <View style={styles.walletItems}>
          <View style={styles.walletItem}>
            <Text style={styles.walletIcon}>🛡️</Text>
            <Text style={styles.walletText}>
              Streak Shields: {walletData.streakshields}
            </Text>
          </View>
          <View style={styles.walletItem}>
            <Text style={styles.walletIcon}>⚡</Text>
            <Text style={styles.walletText}>
              XP Booster: {walletData.hasActiveXpBooster ? 'Active' : 'None'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.storeSection}>
        <Text style={styles.sectionTitle}>Bundles & Themes</Text>
        {STORE_ITEMS.filter(item => 
          item.category === 'bundle' || item.category === 'cosmetic'
        ).map(renderStoreItem)}
        
        <Text style={styles.sectionTitle}>Consumables</Text>
        {STORE_ITEMS.filter(item => 
          item.category === 'consumable'
        ).map(renderStoreItem)}
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  walletSection: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  walletItems: {
    gap: 8,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  walletText: {
    fontSize: 16,
    color: '#333',
  },
  storeSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 20,
    color: '#1a1a1a',
  },
  storeItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  itemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  capInfo: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: '#666',
  },
})