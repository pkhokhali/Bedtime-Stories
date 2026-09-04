import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { colors, radii, spacing } from '@/constants/theme';
import { AtmosphericBackground } from '@/components/background/AtmosphericBackground';

export default function SubscribeScreen() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

  const handleSelectTier = (tier: string) => {
    setSelectedTier(tier);
    setPaymentModalVisible(true);
  };

  const handlePay = (gateway: 'esewa' | 'khalti' | 'fonepay') => {
    setPaymentModalVisible(false);
    // Navigate to payment webview route with parameters
    router.push(`/payment?tier=${selectedTier}&gateway=${gateway}`);
  };

  return (
    <AtmosphericBackground style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.cream} />
          </Pressable>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Icon */}
          <View style={styles.heroIconContainer}>
            <LinearGradient colors={[colors.amber, '#D97706']} style={styles.heroIconBg}>
              <Ionicons name="star" size={42} color="#fff" />
            </LinearGradient>
          </View>

          {/* Copy */}
          <Text style={styles.title}>Unlock the Full Story</Text>
          <Text style={styles.subtitle}>
            Support independent storytellers and get access to our entire library of premium bedtime stories, novels, and exclusive soundscapes.
          </Text>

          {/* Feature List */}
          <View style={styles.featuresList}>
            {[
              'Unlimited access to all stories and novels',
              'Ad-free uninterrupted listening',
              'Exclusive bedtime soundscapes',
              'Offline downloads for travel',
            ].map((feat, i) => (
              <View key={i} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.emerald} />
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* Subscription Tiers */}
          <View style={styles.tiersContainer}>
            {/* Monthly */}
            <Pressable style={styles.tierCard} onPress={() => handleSelectTier('Monthly')}>
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.tierBlur}>
                <View style={styles.tierContent}>
                  <View>
                    <Text style={styles.tierName}>Monthly</Text>
                    <Text style={styles.tierPrice}>रु 499 / mo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.cream} />
                </View>
              </BlurView>
            </Pressable>

            {/* Quarterly */}
            <Pressable style={styles.tierCard} onPress={() => handleSelectTier('Quarterly')}>
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.tierBlur}>
                <View style={styles.tierContent}>
                  <View>
                    <Text style={styles.tierName}>Quarterly</Text>
                    <Text style={styles.tierPrice}>रु 1299 / 3 mo</Text>
                    <Text style={styles.tierSavings}>Save 13%</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.cream} />
                </View>
              </BlurView>
            </Pressable>

            {/* Yearly (Best Value) */}
            <Pressable style={styles.tierCard} onPress={() => handleSelectTier('Yearly')}>
              <LinearGradient colors={['rgba(217, 119, 6, 0.2)', 'rgba(217, 119, 6, 0.05)']} style={styles.tierGradientBg}>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
                <View style={styles.tierContent}>
                  <View>
                    <Text style={styles.tierName}>Yearly</Text>
                    <Text style={styles.tierPrice}>रु 3999 / yr</Text>
                    <Text style={styles.tierSavings}>Save 33%</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.amber} />
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.legalText}>
            Subscriptions will automatically renew unless canceled at least 24 hours before the end of the current period.
          </Text>
        </ScrollView>

        {/* Payment Method Modal */}
        <Modal
          visible={isPaymentModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Payment Method</Text>
                <Pressable onPress={() => setPaymentModalVisible(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={colors.cream} />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                You selected the {selectedTier} plan. How would you like to pay?
              </Text>

              <View style={styles.paymentMethods}>
                {/* eSewa */}
                <Pressable style={styles.paymentCard} onPress={() => handlePay('esewa')}>
                  <View style={[styles.paymentIconBg, { backgroundColor: '#60BB46' }]}>
                    <Text style={styles.paymentIconText}>e</Text>
                  </View>
                  <Text style={styles.paymentName}>eSewa</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </Pressable>

                {/* Khalti */}
                <Pressable style={styles.paymentCard} onPress={() => handlePay('khalti')}>
                  <View style={[styles.paymentIconBg, { backgroundColor: '#5C2D91' }]}>
                    <Text style={styles.paymentIconText}>K</Text>
                  </View>
                  <Text style={styles.paymentName}>Khalti</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </Pressable>

                {/* Fonepay */}
                <Pressable style={styles.paymentCard} onPress={() => handlePay('fonepay')}>
                  <View style={[styles.paymentIconBg, { backgroundColor: '#E42127' }]}>
                    <Text style={styles.paymentIconText}>F</Text>
                  </View>
                  <Text style={styles.paymentName}>Fonepay</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </Pressable>
              </View>
            </BlurView>
          </View>
        </Modal>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.full,
  },
  headerTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
    alignItems: 'center',
  },
  heroIconContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  featuresList: {
    width: '100%',
    marginBottom: spacing.xl * 1.5,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    color: colors.cream,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
  },
  tiersContainer: {
    width: '100%',
    gap: spacing.md,
  },
  tierCard: {
    borderRadius: radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierBlur: {
    padding: spacing.lg,
  },
  tierGradientBg: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    borderRadius: radii.card,
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierName: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  tierPrice: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
  },
  tierSavings: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    marginTop: 4,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: colors.amber,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
  },
  bestValueText: {
    color: '#000',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  legalText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: spacing.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
  },
  modalCloseButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.full,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  paymentMethods: {
    gap: spacing.md,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paymentIconBg: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  paymentIconText: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
  },
  paymentName: {
    flex: 1,
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  }
});
