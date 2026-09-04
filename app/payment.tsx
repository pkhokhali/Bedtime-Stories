import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { colors } from '@/constants/theme';

export default function PaymentScreen() {
  const router = useRouter();
  const { tier, gateway } = useLocalSearchParams<{ tier: string; gateway: string }>();
  const [loading, setLoading] = useState(true);

  // Pricing based on tier (mock)
  const priceMap: Record<string, string> = {
    Monthly: '499',
    Quarterly: '1299',
    Yearly: '3999',
  };
  const amount = priceMap[tier || 'Monthly'];
  const gatewayName = gateway === 'esewa' ? 'eSewa' : gateway === 'khalti' ? 'Khalti' : 'Fonepay';
  const gatewayColor = gateway === 'esewa' ? '#60BB46' : gateway === 'khalti' ? '#5C2D91' : '#E42127';

  // Mock HTML to simulate the ePayment gateway portal
  const mockGatewayHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 320px; text-align: center; }
        .header { font-size: 24px; font-weight: bold; color: ${gatewayColor}; margin-bottom: 20px; }
        .amount { font-size: 32px; font-weight: 800; color: #333; margin-bottom: 10px; }
        .desc { color: #666; font-size: 14px; margin-bottom: 30px; }
        .btn { background: ${gatewayColor}; color: white; border: none; padding: 14px; width: 100%; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .btn:active { opacity: 0.8; }
        .cancel { margin-top: 15px; color: #888; font-size: 14px; text-decoration: underline; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">${gatewayName} Secure Pay</div>
        <div class="desc">Saanjh Premium - ${tier} Subscription</div>
        <div class="amount">NPR ${amount}</div>
        <button class="btn" onclick="window.location.href='https://saanjh.app/payment-success'">Pay Securely</button>
        <div class="cancel" onclick="window.location.href='https://saanjh.app/payment-failure'">Cancel Transaction</div>
      </div>
    </body>
    </html>
  `;

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (url.includes('saanjh.app/payment-success')) {
      // Mock Success Logic
      Alert.alert(
        'Payment Successful! 🎉',
        \`Thank you for subscribing to the \${tier} plan via \${gatewayName}. Your premium features are now unlocked.\`,
        [{ text: 'OK', onPress: () => router.navigate('/') }]
      );
    } else if (url.includes('saanjh.app/payment-failure')) {
      Alert.alert('Payment Cancelled', 'Your transaction was cancelled.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>
      </View>
      <WebView
        originWhitelist={['*']}
        source={{ html: mockGatewayHtml }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={gatewayColor} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f4f4f4',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
