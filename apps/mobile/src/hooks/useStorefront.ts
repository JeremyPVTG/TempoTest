import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Purchases, { 
  type PurchasesOffering, 
  type PurchasesPackage, 
  type CustomerInfo 
} from "react-native-purchases";

type StorefrontResult = {
  offerings: { current?: PurchasesOffering } | null;
  isPro: boolean;
  loading: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  purchaseSku: (sku: string) => Promise<void>;
  restore: () => Promise<void>;
};

export function useStorefront(): StorefrontResult {
  const [offerings, setOfferings] = useState<{ current?: PurchasesOffering } | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const iosKey = process.env.EXPO_PUBLIC_RC_API_KEY_IOS!;
    const androidKey = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID!;
    const apiKey = Platform.select({ ios: iosKey, android: androidKey })!;
    
    Purchases.configure({ apiKey });
    // TODO: set stable appUserID when mobile auth is wired

    let mounted = true;
    
    (async () => {
      try {
        const [offeringsResult, customerInfoResult] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo()
        ]);
        
        if (!mounted) return;
        
        setOfferings(offeringsResult);
        setCustomerInfo(customerInfoResult);
      } catch (error) {
        console.warn("Failed to initialize RevenueCat:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => { 
      mounted = false; 
    };
  }, []);

  const isPro = !!customerInfo?.entitlements?.active?.["pro"];

  const purchase = async (pkg: PurchasesPackage): Promise<void> => {
    await Purchases.purchasePackage(pkg);
    const updatedInfo = await Purchases.getCustomerInfo();
    setCustomerInfo(updatedInfo);
  };

  const purchaseSku = async (sku: string): Promise<void> => {
    const currentOfferings = await Purchases.getOfferings();
    const pkg = currentOfferings.current?.availablePackages?.find(
      p => p.product.identifier === sku
    );
    
    if (pkg) {
      return purchase(pkg);
    }
    
    await Purchases.purchaseProduct(sku);
    const updatedInfo = await Purchases.getCustomerInfo();
    setCustomerInfo(updatedInfo);
  };

  const restore = async (): Promise<void> => {
    await Purchases.restorePurchases();
    const updatedInfo = await Purchases.getCustomerInfo();
    setCustomerInfo(updatedInfo);
  };

  return useMemo(() => ({ 
    offerings, 
    isPro, 
    loading, 
    purchase, 
    purchaseSku, 
    restore 
  }), [offerings, isPro, loading]);
}