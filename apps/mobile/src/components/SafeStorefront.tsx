import React from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { useStorefrontEnabled } from '@habituals/data'
import { useOfflineProtection } from '../hooks/useNetworkSafety'

interface SafeStorefrontProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SafeStorefront({ children, fallback }: SafeStorefrontProps) {
  const isStorefrontEnabled = useStorefrontEnabled()
  const { isOffline, getOfflineMessage } = useOfflineProtection()

  // Show fallback if storefront is disabled
  if (!isStorefrontEnabled) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.title}>Store Coming Soon</Text>
        <Text style={styles.message}>
          The Habituals store is currently in development. 
          Check back soon for premium features and customizations!
        </Text>
      </View>
    )
  }

  // Show offline message if no connection
  if (isOffline) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Connection</Text>
        <Text style={styles.message}>
          {getOfflineMessage()}
        </Text>
      </View>
    )
  }

  return <>{children}</>
}

interface SafePurchaseButtonProps {
  onPress: () => void
  children: React.ReactNode
  disabled?: boolean
  style?: any
}

export function SafePurchaseButton({ 
  onPress, 
  children, 
  disabled = false,
  style 
}: SafePurchaseButtonProps) {
  const { shouldBlockPurchases, getOfflineMessage } = useOfflineProtection()
  
  const handlePress = () => {
    if (shouldBlockPurchases) {
      Alert.alert('No Connection', getOfflineMessage())
      return
    }
    onPress()
  }

  return (
    <View style={[style, (disabled || shouldBlockPurchases) && styles.disabled]}>
      {React.cloneElement(children as React.ReactElement, {
        onPress: handlePress,
        disabled: disabled || shouldBlockPurchases,
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  disabled: {
    opacity: 0.6,
  },
})