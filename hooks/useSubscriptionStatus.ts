import { useRevenueCat } from './useRevenueCat';
import { useCallback } from 'react';

export function useSubscriptionStatus() {
  const { 
    customerInfo, 
    hasActiveEntitlement, 
    isSubscribed, 
    loading 
  } = useRevenueCat();

  // Check if user has premium access
  const hasPremiumAccess = useCallback((): boolean => {
    // Check for any active subscription or premium entitlement
    return isSubscribed() || hasActiveEntitlement('premium') || hasActiveEntitlement('pro');
  }, [isSubscribed, hasActiveEntitlement]);

  // Get subscription status details
  const getSubscriptionDetails = useCallback(() => {
    if (!customerInfo) {
      return {
        isPremium: false,
        status: 'free',
        expirationDate: null,
        willRenew: false,
      };
    }

    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    const hasActive = activeEntitlements.length > 0;

    if (hasActive) {
      const primaryEntitlement = activeEntitlements[0];
      return {
        isPremium: true,
        status: 'premium',
        expirationDate: primaryEntitlement.expirationDate,
        willRenew: primaryEntitlement.willRenew,
      };
    }

    return {
      isPremium: false,
      status: 'free',
      expirationDate: null,
      willRenew: false,
    };
  }, [customerInfo]);

  return {
    hasPremiumAccess,
    getSubscriptionDetails,
    loading,
    customerInfo,
  };
}