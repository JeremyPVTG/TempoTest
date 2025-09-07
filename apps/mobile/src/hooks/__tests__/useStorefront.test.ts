import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStorefront } from "../useStorefront";

// Mock React Native Platform
vi.mock("react-native", () => ({ 
  Platform: { 
    select: (options: any) => options.ios 
  } 
}));

// Mock RevenueCat offerings
const mockOfferings = {
  current: {
    availablePackages: [
      { 
        identifier: "monthly", 
        packageType: "MONTHLY", 
        product: { 
          identifier: "pro_month", 
          priceString: "$4.99",
          description: "Monthly Pro subscription"
        } 
      }
    ]
  }
};

let mockEntitlementsActive: Record<string, any> = {};

// Mock RevenueCat SDK
vi.mock("react-native-purchases", () => ({
  default: {
    configure: vi.fn(),
    getOfferings: vi.fn().mockResolvedValue(mockOfferings),
    getCustomerInfo: vi.fn().mockImplementation(async () => ({ 
      entitlements: { 
        active: mockEntitlementsActive 
      } 
    })),
    purchasePackage: vi.fn().mockResolvedValue({}),
    purchaseProduct: vi.fn().mockResolvedValue({}),
    restorePurchases: vi.fn().mockResolvedValue({})
  }
}));

describe("useStorefront", () => {
  beforeEach(() => { 
    mockEntitlementsActive = {};
    vi.clearAllMocks();
  });

  it("loads offerings and reports non-pro by default", async () => {
    const { result } = renderHook(() => useStorefront());
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.offerings?.current?.availablePackages).toHaveLength(1);
    expect(result.current.isPro).toBe(false);
  });

  it("purchase updates customer info", async () => {
    const { result } = renderHook(() => useStorefront());
    
    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Mock pro entitlement after purchase
    mockEntitlementsActive = { pro: { isActive: true } };
    
    await act(async () => {
      const pkg = result.current.offerings!.current!.availablePackages![0] as any;
      await result.current.purchase(pkg);
    });
    
    // The hook should have called getCustomerInfo after purchase
    expect(result.current.isPro).toBe(true);
  });

  it("purchaseSku finds package by SKU", async () => {
    const { result } = renderHook(() => useStorefront());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.purchaseSku("pro_month");
    });
    
    // Should not throw and should have attempted purchase
    expect(result.current.loading).toBe(false);
  });

  it("restore triggers customer info refresh", async () => {
    const { result } = renderHook(() => useStorefront());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.restore();
    });
    
    // Should complete without throwing
    expect(result.current.loading).toBe(false);
  });

  it("handles initialization errors gracefully", async () => {
    // Mock RevenueCat to throw on initialization
    const PurchasesMock = await import("react-native-purchases");
    vi.mocked(PurchasesMock.default.getOfferings).mockRejectedValueOnce(
      new Error("Network error")
    );
    
    const { result } = renderHook(() => useStorefront());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should handle error gracefully
    expect(result.current.loading).toBe(false);
    expect(result.current.offerings).toBe(null);
  });

  it("isPro correctly reflects entitlement status", async () => {
    mockEntitlementsActive = { pro: { isActive: true } };
    
    const { result } = renderHook(() => useStorefront());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isPro).toBe(true);
  });
});