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
  const { offerings, purchasePackage, restorePurchases, loading } = useRevenueCat();
  const [purchasing, setPurchasing] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.webNotSupported, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.webNotSupportedText, { color: theme.colors.onSurface }]}>
              Subscriptions are not supported on web. Please use the mobile app to subscribe.
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

  const currentOffering = offerings?.[0]; // Get the first offering
  const packages = currentOffering?.availablePackages || [];

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchasing(true);
    try {
      await purchasePackage(packageToPurchase);
      onPurchaseSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert('Purchase Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Restore Complete', 'Your purchases have been restored successfully.');
    } catch (error) {
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

  const premiumFeatures = [
    { icon: Crown, title: 'Unlimited Tasks', description: 'Create unlimited tasks and projects' },
    { icon: Star, title: 'Advanced Analytics', description: 'Detailed productivity insights and reports' },
    { icon: Zap, title: 'Priority Support', description: 'Get help when you need it most' },
    { icon: Check, title: 'Cloud Sync', description: 'Sync across all your devices' },
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
              <View style={[styles.heroIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Crown size={48} color={theme.colors.primary} />
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
                Unlock Premium
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Get the most out of your productivity journey
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              {premiumFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                      <IconComponent size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                        {feature.title}
                      </Text>
                      <Text style={[styles.featureDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Packages */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                  Loading subscription options...
                </Text>
              </View>
            ) : packages.length > 0 ? (
              <View style={styles.packagesSection}>
                <Text style={[styles.packagesTitle, { color: theme.colors.onSurface }]}>
                  Choose Your Plan
                </Text>
                {packages.map((packageItem, index) => (
                  <TouchableOpacity
                    key={packageItem.identifier}
                    style={[
                      styles.packageItem,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.outline,
                      }
                    ]}
                    onPress={() => handlePurchase(packageItem)}
                    disabled={purchasing}
                  >
                    <View style={styles.packageContent}>
                      <Text style={[styles.packageTitle, { color: theme.colors.onSurface }]}>
                        {getPackageTitle(packageItem)}
                      </Text>
                      <Text style={[styles.packageDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {getPackageDescription(packageItem)}
                      </Text>
                    </View>
                    <Text style={[styles.packagePrice, { color: theme.colors.primary }]}>
                      {formatPrice(packageItem)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noPackagesContainer}>
                <Text style={[styles.noPackagesText, { color: theme.colors.onSurfaceVariant }]}>
                  No subscription options available at the moment.
                </Text>
              </View>
            )}

            {/* Restore Button */}
            <TouchableOpacity
              style={[styles.restoreButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleRestore}
              disabled={purchasing}
            >
              <Text style={[styles.restoreButtonText, { color: theme.colors.onSurface }]}>
                Restore Purchases
              </Text>
            </TouchableOpacity>

            {/* Terms */}
            <View style={styles.termsSection}>
              <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>
                Subscriptions auto-renew unless cancelled. You can manage your subscription in your device settings.
              </Text>
            </View>
          </ScrollView>

          {purchasing && (
            <View style={styles.purchasingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.purchasingText, { color: theme.colors.onSurface }]}>
                Processing purchase...
              </Text>
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
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  packagesSection: {
    paddingVertical: 20,
  },
  packagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
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
  },
  restoreButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsSection: {
    paddingBottom: 20,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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