import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Image
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { X, Crown, Check, Star, Zap } from 'lucide-react-native';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export default function PaywallModal({ visible, onClose, onPurchaseSuccess }: PaywallModalProps) {
  const theme = useTheme();
  const { offerings, purchasePackage, restorePurchases, loading, error } = useRevenueCat();
  const [purchasing, setPurchasing] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.webNotSupported, { backgroundColor: theme.colors.surface }]}>
            <Crown size={64} color={theme.colors.primary} />
            <Text style={[styles.webNotSupportedText, { color: theme.colors.onSurface }]}>
              Premium Features Available
            </Text>
            <Text style={[styles.webNotSupportedSubtext, { color: theme.colors.onSurfaceVariant }]}>
              Subscriptions are not supported on web platform. Please use the mobile app to access premium features and manage your subscription.
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.onPrimary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Get the current offering - RevenueCat typically has a "default" offering
  const currentOffering = offerings?.[0]; // Use the first available offering
  const packages = currentOffering?.availablePackages || [];

  // Debug logging for troubleshooting
  React.useEffect(() => {
    if (visible) {
      console.log('PaywallModal opened');
      console.log('Offerings:', offerings);
      console.log('Offerings length:', offerings?.length);
      console.log('Current offering:', currentOffering);
      console.log('Current offering identifier:', currentOffering?.identifier);
      console.log('Available packages:', packages);
      console.log('Packages length:', packages.length);
      console.log('Loading:', loading);
      console.log('Error:', error);
      
      // Log each package details
      packages.forEach((pkg, index) => {
        console.log(`Package ${index}:`, {
          identifier: pkg.identifier,
          price: pkg.product.priceString,
          title: pkg.product.title,
          description: pkg.product.description
        });
      });
    }
  }, [visible, offerings, currentOffering, packages, loading, error]);
  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    console.log('Attempting to purchase package:', packageToPurchase.identifier);
    setPurchasing(true);
    try {
      const customerInfo = await purchasePackage(packageToPurchase);
      console.log('Purchase successful:', customerInfo);
      onPurchaseSuccess?.();
      onClose();
      Alert.alert('Success!', 'Welcome to Premium! Enjoy all the premium features.');
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Purchase Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    console.log('Attempting to restore purchases');
    try {
      const customerInfo = await restorePurchases();
      console.log('Restore successful:', customerInfo);
      Alert.alert('Restore Complete', 'Your purchases have been restored successfully.');
      onClose();
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Restore Failed', error instanceof Error ? error.message : 'Failed to restore purchases');
    }
  };

  const formatPrice = (packageItem: PurchasesPackage): string => {
    const { product } = packageItem;
    return product.priceString || '$0.00';
  };

  const getPackageTitle = (packageItem: PurchasesPackage): string => {
    const { identifier } = packageItem;
    if (identifier.includes('monthly')) return 'Monthly';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'Annual';
    if (identifier.includes('weekly')) return 'Weekly';
    return 'Premium';
  };

  const getPackageDescription = (packageItem: PurchasesPackage): string => {
    const { identifier } = packageItem;
    if (identifier.includes('monthly')) return 'Billed monthly';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'Billed annually';
    if (identifier.includes('weekly')) return 'Billed weekly';
    return 'One-time purchase';
  };

  const getPackageSavings = (packageItem: PurchasesPackage): string | null => {
    const { identifier } = packageItem;
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return '15% OFF';
    }
    return null;
  };
  const premiumFeatures = [
    { icon: Check, title: 'Unlimited Tasks', description: 'You can add unlimited tasks in a day.' },
    { icon: Check, title: 'Infinite motivation scroll', description: 'Get unlimited AI generated motivation scrolling' },
    { icon: Check, title: 'Add unlimited habits.', description: 'You can add unlimited habits' },
    { icon: Check, title: 'AI focus music access', description: 'You will get AI generated focus music' },
    { icon: Check, title: 'Get AI habit suggestions.', description: 'Special access to what\'s habits needed.' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
              <X size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroIcon}>
                <Image 
                  source={require('../assets/images/icon.png')} 
                  style={styles.appIcon} 
                />
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
                Get NowDo Pro
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Our most advanced features, for our most dedicated users.
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              {premiumFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                      <IconComponent size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>{feature.title}</Text>
                      <Text style={[styles.featureDescription, { color: theme.colors.onSurfaceVariant }]}>{feature.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Packages */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Loading subscription options...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>Unable to load subscription options. Please try again later.</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={() => window.location.reload()}>
                  <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : packages.length > 0 ? (
              <View style={styles.packagesSection}>
                {packages.map((packageItem, index) => {
                  const savings = getPackageSavings(packageItem);
                  const isPopular = packageItem.identifier.includes('annual') || packageItem.identifier.includes('yearly');
                  
                  return (
                    <TouchableOpacity key={packageItem.identifier} style={[styles.packageItem, { backgroundColor: isPopular ? theme.colors.surfaceVariant : theme.colors.background, borderColor: isPopular ? '#8B5CF6' : theme.colors.outline, borderWidth: isPopular ? 2 : 1 }]} onPress={() => handlePurchase(packageItem)} disabled={purchasing}>
                      {isPopular && (
                        <View style={[styles.popularBadge, { backgroundColor: '#8B5CF6' }]}>
                          <Text style={[styles.popularBadgeText, { color: '#FFFFFF' }]}>15% OFF</Text>
                        </View>
                      )}
                      <View style={styles.packageContent}>
                        <Text style={[styles.packageTitle, { color: theme.colors.onSurface }]}>{getPackageTitle(packageItem)}</Text>
                        <Text style={[styles.packageDescription, { color: theme.colors.onSurfaceVariant }]}>{getPackageDescription(packageItem)}{savings && <Text style={[styles.packageSavings, { color: '#8B5CF6' }]}>{savings}</Text>}</Text>
                      </View>
                      <Text style={[styles.packagePrice, { color: '#8B5CF6' }]}>{formatPrice(packageItem)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noPackagesContainer}>
                <Text style={[styles.noPackagesText, { color: theme.colors.onSurfaceVariant }]}>No subscription options available at the moment. Please check your internet connection and try again.</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={() => window.location.reload()}>
                  <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Restore Button */}
            <TouchableOpacity style={[styles.continueButton, { backgroundColor: '#8B5CF6' }]} onPress={() => handlePurchase(packages[0])} disabled={purchasing}>
              <Text style={[styles.continueButtonText, { color: '#FFFFFF' }]}>Continue</Text>
            </TouchableOpacity>
            <View style={styles.restoreTermsContainer}>
              <TouchableOpacity onPress={handleRestore}>
                <Text style={[styles.restoreText, { color: theme.colors.onSurfaceVariant }]}>Restore Purchases</Text>
              </TouchableOpacity>
              <Text style={[styles.termsSeparator, { color: theme.colors.onSurfaceVariant }]}>|</Text>
              <TouchableOpacity>
                <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>Terms</Text>
              </TouchableOpacity>
              <Text style={[styles.termsSeparator, { color: theme.colors.onSurfaceVariant }]}>|</Text>
              <TouchableOpacity>
                <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {purchasing && (
            <View style={styles.purchasingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.purchasingText, { color: theme.colors.onSurface }]}>Processing purchase...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 0,
  },
  closeIconButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  packagesSection: {
    paddingVertical: 20,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    position: 'relative',
    borderWidth: 1,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageContent: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
  },
  packageSavings: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  noPackagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPackagesText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  restoreTermsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  restoreText: {
    fontSize: 12,
    padding: 4,
  },
  termsText: {
    fontSize: 12,
    padding: 4,
  },
  termsSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  purchasingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  webNotSupported: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  webNotSupportedText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  webNotSupportedSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});