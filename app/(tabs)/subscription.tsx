import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { useAuth } from '../../hooks/useAuth';
import PaywallModal from '../../components/PaywallModal';
import { 
  Crown, 
  ArrowLeft, 
  Check, 
  Star, 
  Zap, 
  Shield,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react-native';

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { 
    customerInfo, 
    isSubscribed, 
    getActiveEntitlements, 
    hasActiveEntitlement,
    identifyUser,
    loading,
    refresh
  } = useRevenueCat();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeRevenueCat();
  }, [user]);

  const initializeRevenueCat = async () => {
    if (Platform.OS === 'web') {
      setInitializing(false);
      return;
    }

    if (user?.id) {
      try {
        await identifyUser(user.id);
      } catch (error) {
        console.error('Failed to identify user with RevenueCat:', error);
      }
    }
    setInitializing(false);
  };

  const handleSubscribe = () => {
    console.log('Opening paywall modal');
    setShowPaywall(true);
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, go to Settings > Apple ID > Subscriptions on your device.',
        [{ text: 'OK' }]
      );
    } else if (Platform.OS === 'android') {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, open the Google Play Store app and go to Menu > Subscriptions.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeEntitlements = getActiveEntitlements();
  const subscribed = isSubscribed();

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Subscription
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.webNotSupported}>
          <Crown size={64} color={theme.colors.primary} />
          <Text style={[styles.webNotSupportedTitle, { color: theme.colors.onSurface }]}>
            Subscriptions Not Available
          </Text>
          <Text style={[styles.webNotSupportedText, { color: theme.colors.onSurfaceVariant }]}>
            Subscriptions are not supported on the web platform. Please use the mobile app to manage your subscription.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Subscription
        </Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <RefreshCw size={20} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusIcon, 
              { backgroundColor: subscribed ? '#4CAF50' + '15' : theme.colors.primary + '15' }
            ]}>
              <Crown size={32} color={subscribed ? '#4CAF50' : theme.colors.primary} />
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                {subscribed ? 'Premium Active' : 'Free Plan'}
              </Text>
              <Text style={[styles.statusSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {subscribed 
                  ? 'You have access to all premium features'
                  : 'Upgrade to unlock premium features'
                }
              </Text>
            </View>
          </View>

          {subscribed && activeEntitlements.length > 0 && (
            <View style={styles.subscriptionDetails}>
              {activeEntitlements.map((entitlement, index) => (
                <View key={index} style={styles.entitlementItem}>
                  <Text style={[styles.entitlementTitle, { color: theme.colors.onSurface }]}>
                    {entitlement.identifier}
                  </Text>
                  {entitlement.expirationDate && (
                    <Text style={[styles.entitlementExpiry, { color: theme.colors.onSurfaceVariant }]}>
                      {entitlement.willRenew 
                        ? `Renews on ${formatDate(entitlement.expirationDate)}`
                        : `Expires on ${formatDate(entitlement.expirationDate)}`
                      }
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Premium Features */}
        <View style={[styles.featuresCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
            Premium Features
          </Text>
          
          {[
            { icon: Check, title: 'Unlimited Tasks', description: 'You can add unlimited tasks in a day.' },
            { icon: Check, title: 'Infinite motivation scroll', description: 'Get unlimited AI generated motivation scrolling' },
            { icon: Check, title: 'Add unlimited habits', description: 'You can add unlimited habits' },
            { icon: Check, title: 'AI focus music access', description: 'You will get AI generated focus music' },
            { icon: Check, title: 'Get AI habit suggestions', description: 'Special access to what\'s habits needed.' },
          ].map((feature, index) => {
            const IconComponent = feature.icon;
            const hasFeature = subscribed || hasActiveEntitlement('premium');
            
            return (
              <View key={index} style={styles.featureItem}>
                <View style={[
                  styles.featureIcon, 
                  { backgroundColor: hasFeature ? '#8B5CF6' + '15' : theme.colors.surfaceVariant }
                ]}>
                  <IconComponent 
                    size={20} 
                    color={hasFeature ? '#8B5CF6' : theme.colors.onSurfaceVariant} 
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {feature.description}
                  </Text>
                </View>
                {hasFeature && (
                  <Check size={16} color="#8B5CF6" />
                )}
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!subscribed ? (
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubscribe}
            >
              <Crown size={20} color={theme.colors.onPrimary} />
              <Text style={[styles.subscribeButtonText, { color: theme.colors.onPrimary }]}>
                Upgrade to Premium
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleManageSubscription}
            >
              <CreditCard size={20} color={theme.colors.onSurface} />
              <Text style={[styles.manageButtonText, { color: theme.colors.onSurface }]}>
                Manage Subscription
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Info Debug (only in development) */}
        {__DEV__ && customerInfo && (
          <View style={[styles.debugCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.debugTitle, { color: theme.colors.onSurface }]}>
              Debug Info
            </Text>
            <Text style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}>
              Customer ID: {customerInfo.originalAppUserId}
            </Text>
            <Text style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}>
              Active Entitlements: {Object.keys(customerInfo.entitlements.active).length}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={() => {
          refresh();
          Alert.alert('Success!', 'Welcome to Premium! Enjoy all the premium features.');
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  subscriptionDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  entitlementItem: {
    marginBottom: 8,
  },
  entitlementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  entitlementExpiry: {
    fontSize: 14,
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  debugCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  webNotSupportedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  webNotSupportedText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});