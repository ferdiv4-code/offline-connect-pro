import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import {
  LevelPlayAdSize,
  LevelPlayBannerAdView,
  type LevelPlayBannerAdViewListener,
  type LevelPlayBannerAdViewMethods,
} from 'unity-levelplay-mediation';
import { AD_PROVIDER, BANNER_UNIT_ID, LEVELPLAY_BANNER_UNIT_ID } from '@/config/ads';
import { isLevelPlayReady, subscribeLevelPlayReady } from '@/services/Ads';

type AdBannerProps = {
  enabled?: boolean;
};

/* ---------------- AdMob banner (kept for later) ---------------- */
function AdMobBanner() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

/* ---------------- LevelPlay banner ---------------- */
function LevelPlayBanner() {
  const bannerRef = useRef<LevelPlayBannerAdViewMethods>(null);
  const [ready, setReady] = useState(isLevelPlayReady());
  const [adSize, setAdSize] = useState<LevelPlayAdSize | null>(null);
  const [failed, setFailed] = useState(false);

  // Wait until LevelPlay has finished starting.
  useEffect(() => {
    setReady(isLevelPlayReady());
    return subscribeLevelPlayReady(setReady);
  }, []);

  // Work out a banner size that fits this phone's width.
  useEffect(() => {
    if (!ready) return;
    let active = true;
    LevelPlayAdSize.createAdaptiveAdSize()
      .then((size) => {
        if (active) setAdSize(size ?? LevelPlayAdSize.BANNER);
      })
      .catch(() => {
        if (active) setAdSize(LevelPlayAdSize.BANNER);
      });
    return () => {
      active = false;
    };
  }, [ready]);

  // Stop banner refresh and free it when the screen goes away.
  useEffect(() => {
    return () => {
      try {
        bannerRef.current?.destroy();
      } catch {
        // already gone
      }
    };
  }, []);

  if (!ready || !adSize) return null;

  const listener: LevelPlayBannerAdViewListener = {
    onAdLoaded: () => setFailed(false),
    onAdLoadFailed: () => setFailed(true),
    onAdDisplayed: () => {},
    onAdDisplayFailed: () => setFailed(true),
    onAdClicked: () => {},
    onAdExpanded: () => {},
    onAdCollapsed: () => {},
    onAdLeftApplication: () => {},
  };

  return (
    <View
      style={[
        styles.container,
        // Hide the empty strip when no ad could be loaded (the banner keeps retrying).
        { height: failed ? 0 : adSize.height },
      ]}
    >
      <LevelPlayBannerAdView
        ref={bannerRef}
        adUnitId={LEVELPLAY_BANNER_UNIT_ID}
        adSize={adSize}
        placementName={null}
        listener={listener}
        onLayout={() => bannerRef.current?.loadAd()}
        style={{ width: adSize.width, height: adSize.height }}
      />
    </View>
  );
}

/** Only the tab you are looking at loads a LevelPlay banner (the other tabs stay quiet). */
function FocusedLevelPlayBanner() {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused ? <LevelPlayBanner /> : null;
}

export default function AdBanner({ enabled = true }: AdBannerProps) {
  if (!enabled) return null;
  return AD_PROVIDER === 'levelplay' ? <FocusedLevelPlayBanner /> : <AdMobBanner />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
