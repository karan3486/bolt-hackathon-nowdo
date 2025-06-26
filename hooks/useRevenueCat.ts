import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PurchasesEntitlementInfo,
  PURCHASES_ERROR_CODE
} from 'react-native-purchases';

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;
  loading: boolean;
  error: string | null;
}

export function useRevenueCat() {
  const [state, setState] = useState<RevenueCatState>({
    customerInfo: null,
    offerings: null,
    loading: true,
    error: null,
  });

  // Initialize RevenueCat data
  useEffect(() => {
    if (Platform.OS === 'web') {
      setState(prev => ({ ...prev, loading: false, error: 'RevenueCat not supported on web' }));
      return;
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      setState(prev => ({
        ...prev,
        customerInfo,
        offerings: offerings.all ? Object.values(offerings.all) : [],
        loading: false,
      }));
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize RevenueCat',
      }));
    }
  };

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: PurchasesPackage) => {
    if (Platform.OS === 'web') {
      throw new Error('Purchases not supported on web platform');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      setState(prev => ({
        ...prev,
        customerInfo,
        loading: false,
      }));

      return customerInfo;
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Purchase failed';
      
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED) {
        errorMessage = 'Purchase was cancelled';
      } else if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING) {
        errorMessage = 'Payment is pending';
      } else if (error.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE) {
        errorMessage = 'Product not available for purchase';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      throw new Error(errorMessage);
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') {
      throw new Error('Restore not supported on web platform');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const customerInfo = await Purchases.restorePurchases();
      
      setState(prev => ({
        ...prev,
        customerInfo,
        loading: false,
      }));

      return customerInfo;
    } catch (error) {
      console.error('Restore purchases error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore purchases';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      throw new Error(errorMessage);
    }
  }, []);

  // Check if user has active entitlement
  const hasActiveEntitlement = useCallback((entitlementId: string): boolean => {
    if (!state.customerInfo) return false;
    
    const entitlement = state.customerInfo.entitlements.active[entitlementId];
    return entitlement?.isActive === true;
  }, [state.customerInfo]);

  // Get all active entitlements
  const getActiveEntitlements = useCallback((): PurchasesEntitlementInfo[] => {
    if (!state.customerInfo) return [];
    
    return Object.values(state.customerInfo.entitlements.active);
  }, [state.customerInfo]);

  // Check if user is subscribed to any product
  const isSubscribed = useCallback((): boolean => {
    return getActiveEntitlements().length > 0;
  }, [getActiveEntitlements]);

  // Identify user (call this after user authentication)
  const identifyUser = useCallback(async (userId: string) => {
    if (Platform.OS === 'web') return;

    try {
      const { customerInfo } = await Purchases.logIn(userId);
      setState(prev => ({ ...prev, customerInfo }));
      return customerInfo;
    } catch (error) {
      console.error('RevenueCat identify user error:', error);
      throw error;
    }
  }, []);

  // Log out user
  const logOutUser = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const { customerInfo } = await Purchases.logOut();
      setState(prev => ({ ...prev, customerInfo }));
      return customerInfo;
    } catch (error) {
      console.error('RevenueCat log out error:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    hasActiveEntitlement,
    getActiveEntitlements,
    isSubscribed,
    identifyUser,
    logOutUser,
    refresh: loadInitialData,
  };
}