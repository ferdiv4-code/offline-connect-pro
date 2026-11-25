import mobileAds, {
  AdsConsent,
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import { INTERSTITIAL_MIN_GAP_MS, INTERSTITIAL_UNIT_ID } from '@/config/ads';

let initialized = false;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let lastShownAt = Date.now(); // no full-screen ad right after launch

function loadInterstitial() {
  try {
    interstitialLoaded = false;
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      lastShownAt = Date.now();
      loadInterstitial();
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded = false;
    });
    interstitial.load();
  } catch (e) {
    console.warn('Interstitial load failed', e);
  }
}

/** Asks for consent (needed in EU/UK), then starts AdMob. Safe to call once at launch. */
export async function startAds() {
  if (initialized) return;
  initialized = true;
  try {
    await AdsConsent.gatherConsent();
  } catch (e) {
    console.warn('Consent flow issue', e);
  }
  try {
    await mobileAds().initialize();
    loadInterstitial();
  } catch (e) {
    console.warn('AdMob initialization failed', e);
  }
}

/** Lets the user change their ad privacy choice again (Settings). */
export async function openAdPrivacyOptions() {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    console.warn('Privacy options unavailable', e);
  }
}

/** Shows a full-screen ad only if one is ready and enough time has passed. */
export function maybeShowInterstitial() {
  try {
    if (!interstitial || !interstitialLoaded) return;
    if (Date.now() - lastShownAt < INTERSTITIAL_MIN_GAP_MS) return;
    interstitial.show();
  } catch (e) {
    console.warn('Interstitial show failed', e);
  }
}
