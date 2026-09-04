import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, radii, spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/useSettingsStore';

const TIERS = [
  { id: 'monthly', title: 'Monthly', price: '.99 / mo', save: '' },
  { id: 'quarterly', title: 'Quarterly', price: '.99 / 3 mo', save: 'Save 13%' },
  { id: 'half-yearly', title: 'Half-Yearly', price: '.99 / 6 mo', save: 'Save 23%' },
  { id: 'yearly', title: 'Yearly', price: '.99 / yr', save: 'Save 33%', popular: true },
];

export default function SubscribeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const handleSubscribe = (tierId: string) => {
    alert(Subscribed to \! (Mock Action));
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#060913', '#1B1428']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={15}>
          <Ionicons name="close" size={24} color={colors.cream} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.iconGradient}
          >
            <Ionicons name="star" size={32} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={[styles.title, isNe && styles.titleNe]}>
          {isNe ? 'साँझ प्रिमियम' : 'Saanjh Premium'}
        </Text>
        <Text style={[styles.subtitle, isNe && styles.subtitleNe]}>
          {isNe 
            ? 'सबै कथाहरू सुन्नुहोस्, विज्ञापन बिना, र अफलाइन सुरक्षित गर्नुहोस्।' 
            : 'Unlock all bedtime stories, ad-free listening, and offline downloads.'}
        </Text>

        <View style={styles.features}>
          {['Unlimited Access to Premium Stories', 'Ad-Free Experience', 'Offline Downloads', 'Support Local Authors'].map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.emerald} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tiersContainer}>
          {TIERS.map((tier) => {
            const Container = Platform.OS === 'ios' ? BlurView : View;
            return (
              <Pressable key={tier.id} onPress={() => handleSubscribe(tier.id)} style={({ pressed }) => [
                styles.tierCardContainer,
                pressed && { opacity: 0.8 }
              ]}>
                <Container tint="dark" intensity={50} style={[styles.tierCard, tier.popular && styles.tierCardPopular]}>
                  {tier.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierTitle}>{tier.title}</Text>
                    {tier.save ? <Text style={styles.tierSave}>{tier.save}</Text> : null}
                  </View>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                </Container>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060913',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: colors.cream,
    textAlign: 'center',
    marginBottom: 10,
  },
  titleNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  subtitleNe: {
    fontFamily: 'NotoSansDevanagari_600SemiBold',
  },
  features: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: colors.cream,
  },
  tiersContainer: {
    gap: 12,
  },
  tierCardContainer: {
    width: '100%',
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.08)' : 'transparent',
    padding: 20,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  tierCardPopular: {
    borderColor: colors.amber,
    backgroundColor: Platform.OS === 'android' ? 'rgba(245,158,11,0.1)' : 'transparent',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 20,
    backgroundColor: colors.amber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  popularText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 10,
    color: '#000',
    textTransform: 'uppercase',
  },
  tierInfo: {
    flex: 1,
  },
  tierTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: colors.cream,
  },
  tierSave: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: colors.emerald,
    marginTop: 2,
  },
  tierPrice: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: '#fff',
  },
});
