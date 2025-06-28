import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PurchasesEntitlementInfo,
  PURCHASES_ERROR_CODE,
  LOG_LEVEL
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

    // Enable debug logging for troubleshooting
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    console.log('RevenueCat: Loading initial data...');
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if RevenueCat is configured
      const isConfigured = await Purchases.isConfigured();
      console.log('RevenueCat configured:', isConfigured);
      
      if (!isConfigured) {
        throw new Error('RevenueCat is not configured. Please check your API keys.');
      }
      
      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      console.log('RevenueCat: Customer info loaded:', customerInfo);
      console.log('RevenueCat: Offerings loaded:', offerings);
      
      const offeringsArray = offerings.all ? Object.values(offerings.all) : [];
      console.log('RevenueCat: Available offerings:', offeringsArray);
      setState(prev => ({
        ...prev,
        customerInfo,
        offerings: offeringsArray,
        loading: false,
      }));
      
      // Log available packages for debugging
      offeringsArray.forEach(offering => {
        console.log(`Offering "${offering.identifier}" has ${offering.availablePackages.length} packages:`, 
          offering.availablePackages.map(pkg => ({
            identifier: pkg.identifier,
            price: pkg.product.priceString,
            title: pkg.product.title
          }))
        );
      });
      
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

    console.log('RevenueCat: Attempting to purchase package:', packageToPurchase.identifier);
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('RevenueCat: Purchase successful:', customerInfo);
      
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
      } else if (error.code === PURCHASES_ERROR_CODE.STORE_PROBLEM) {
        errorMessage = 'There was a problem with the App Store. Please try again later.';
      } else if (error.code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
        errorMessage = 'Network error. Please check your internet connection.';
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

    console.log('RevenueCat: Attempting to restore purchases...');
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('RevenueCat: Restore successful:', customerInfo);
      
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
    const isActive = entitlement?.isActive === true;
    console.log(`RevenueCat: Checking entitlement "${entitlementId}":`, isActive);
    return isActive;
  }, [state.customerInfo]);

  // Get all active entitlements
  const getActiveEntitlements = useCallback((): PurchasesEntitlementInfo[] => {
    if (!state.customerInfo) return [];
    
    const activeEntitlements = Object.values(state.customerInfo.entitlements.active);
    console.log('RevenueCat: Active entitlements:', activeEntitlements);
    return activeEntitlements;
  }, [state.customerInfo]);

  // Check if user is subscribed to any product
  const isSubscribed = useCallback((): boolean => {
    const subscribed = getActiveEntitlements().length > 0;
    console.log('RevenueCat: Is subscribed:', subscribed);
    return subscribed;
  }, [getActiveEntitlements]);

  // Identify user (call this after user authentication)
  const identifyUser = useCallback(async (userId: string) => {
    if (Platform.OS === 'web') return;

    console.log('RevenueCat: Identifying user:', userId);
    
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('RevenueCat: User identified successfully:', customerInfo);
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

    console.log('RevenueCat: Logging out user...');
    
    try {
      const { customerInfo } = await Purchases.logOut();
      console.log('RevenueCat: User logged out successfully:', customerInfo);
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