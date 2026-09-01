import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// We use test IDs so we don't violate AdMob policies during testing.
// In a real release, you would swap these out for your real ad unit IDs.
const rawUnitId = Platform.OS === 'ios' 
  ? 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy' 
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz';

const isValidUnitId = (id?: string | null): boolean => {
  if (!id) return false;
  if (id.includes('xxxxxxxx') || id.includes('yyyyyyyy') || id.includes('zzzzzzzz')) return false;
  return id.startsWith('ca-app-pub-');
};

const resolvedAdUnitId = __DEV__ 
  ? TestIds.BANNER 
  : (isValidUnitId(rawUnitId) ? rawUnitId : null);

export function AdBanner() {
  const [hasError, setHasError] = useState(false);

  if (!resolvedAdUnitId || hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={resolvedAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: '100%',
    // Slightly distinct background color to match the app theme 
    // but clearly separate the ad from the content.
    backgroundColor: 'rgba(0,0,0,0.2)',
  }
});
