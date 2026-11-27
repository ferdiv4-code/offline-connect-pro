import mobileAds, {
  AdsConsent,
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import {
  LevelPlay,
  LevelPlayInitRequest,
  LevelPlayInterstitialAd,
  LevelPlayPrivacySettings,
  type LevelPlayInitListener,
  type LevelPlayInterstitialAdListener,
} from 'unity-levelplay-mediation';
import { Platform } from 'react-native';
import {
  AD_PROVIDER,
  INTERSTITIAL_MIN_GAP_MS,
  INTERSTITIAL_UNIT_ID,
  LEVELPLAY_APP_KEY,
  LEVELPLAY_INTERSTITIAL_UNIT_ID,
  LEVELPLAY_KEY_OK,
  LEVELPLAY_TEST_SUITE,
} from '@/config/ads';

let initialized = false;
let lastShownAt = Date.now(); // no full-screen ad right after launch

/* ------------------------------------------------------------------ */
/*  LevelPlay "ready" state (the banner waits for this)                */
/* ------------------------------------------------------------------ */
let levelPlayReady = false;
const readyListeners = new Set<(ready: boolean) => void>();

export function isLevelPlayReady() {
  return levelPlayReady;
}

export function subscribeLevelPlayReady(cb: (ready: boolean) => void) {
  readyListeners.add(cb);
  return () => {
    readyListeners.delete(cb);
  };
}

function setLevelPlayReady(value: boolean) {
  levelPlayReady = value;
  readyListeners.forEach((cb) => cb(value));
}

/* ------------------------------------------------------------------ */
/*  LevelPlay interstitial                                             */
/* ------------------------------------------------------------------ */
let lpInterstitial: LevelPlayInterstitialAd | null = null;
let lpInterstitialLoaded = false;
let lpRetryTimer: ReturnType<typeof setTimeout> | null = null;

function loadLevelPlayInterstitial() {
  try {
    lpInterstitial?.loadAd().catch(() => {
      lpInterstitialLoaded = false;
    });
  } catch (e) {
    console.warn('LevelPlay interstitial load failed', e);
  }
}

function scheduleLevelPlayRetry() {
  if (lpRetryTimer) return;
  lpRetryTimer = setTimeout(() => {
    lpRetryTimer = null;
    loadLevelPlayInterstitial();
  }, 60 * 1000);
}

function createLevelPlayInterstitial() {
  try {
    const ad = new LevelPlayInterstitialAd(LEVELPLAY_INTERSTITIAL_UNIT_ID);
    const listener: LevelPlayInterstitialAdListener = {
      onAdLoaded: () => {
        lpInterstitialLoaded = true;
      },
      onAdLoadFailed: () => {
        lpInterstitialLoaded = false;
        scheduleLevelPlayRetry();
      },
      onAdDisplayed: () => {
        lpInterstitialLoaded = false;
      },
      onAdDisplayFailed: () => {
        lpInterstitialLoaded = false;
        scheduleLevelPlayRetry();
      },
      onAdClosed: () => {
        lastShownAt = Date.now();
        lpInterstitialLoaded = false;
        loadLevelPlayInterstitial();
      },
    };
    ad.setListener(listener);
    lpInterstitial = ad;
    loadLevelPlayInterstitial();
  } catch (e) {
    console.warn('LevelPlay interstitial setup failed', e);
  }
}

/** Passes the person's ad-privacy choice on to LevelPlay. */
async function applyLevelPlayConsent() {
  try {
    const info = await AdsConsent.getConsentInfo();
    // Only restrict when a consent form was required and the person has not agreed.
    if (info.status === 'REQUIRED') {
      await LevelPlayPrivacySettings.setGDPRConsent(false);
    } else if (info.status === 'OBTAINED') {
      await LevelPlayPrivacySettings.setGDPRConsent(true);
    }
  } catch (e) {
    console.warn('LevelPlay consent not applied', e);
  }
}

async function startLevelPlay() {
  if (Platform.OS !== 'android') return;
  if (!LEVELPLAY_KEY_OK) {
    console.warn('LevelPlay App Key is not set in src/config/ads.ts - ads are off.');
    return;
  }
  try {
    await applyLevelPlayConsent();

    if (LEVELPLAY_TEST_SUITE) {
      await LevelPlay.setMetaData('is_test_suite', ['enable']);
    }

    const initListener: LevelPlayInitListener = {
      onInitSuccess: () => {
        setLevelPlayReady(true);
        createLevelPlayInterstitial();
        if (LEVELPLAY_TEST_SUITE) {
          LevelPlay.launchTestSuite().catch(() => {});
        }
      },
      onInitFailed: (error) => {
        console.warn('LevelPlay init failed', error);
        setLevelPlayReady(false);
      },
    };

    const initRequest = LevelPlayInitRequest.builder(LEVELPLAY_APP_KEY).build();
    await LevelPlay.init(initRequest, initListener);
  } catch (e) {
    console.warn('LevelPlay start failed', e);
  }
}

/* ------------------------------------------------------------------ */
/*  AdMob (kept so you can switch back later)                          */
/* ------------------------------------------------------------------ */
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

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

async function startAdMob() {
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

/* ------------------------------------------------------------------ */
/*  Public functions (same names the app already uses)                 */
/* ------------------------------------------------------------------ */

/** Asks for consent (needed in EU/UK), then starts the chosen ad network. Call once at launch. */
export async function startAds() {
  if (initialized) return;
  initialized = true;

  if (AD_PROVIDER === 'levelplay') {
    // The consent form (Google UMP) is shown first, then LevelPlay starts.
    try {
      await AdsConsent.gatherConsent();
    } catch (e) {
      console.warn('Consent flow issue', e);
    }
    await startLevelPlay();
  } else {
    await startAdMob();
  }
}

/** Lets the user change their ad privacy choice again (Settings). */
export async function openAdPrivacyOptions() {
  try {
    await AdsConsent.showPrivacyOptionsForm();
    if (AD_PROVIDER === 'levelplay') {
      await applyLevelPlayConsent();
    }
  } catch (e) {
    console.warn('Privacy options unavailable', e);
  }
}

/** Shows a full-screen ad only if one is ready and enough time has passed. */
export function maybeShowInterstitial() {
  try {
    if (Date.now() - lastShownAt < INTERSTITIAL_MIN_GAP_MS) return;

    if (AD_PROVIDER === 'levelplay') {
      if (!lpInterstitial || !lpInterstitialLoaded) return;
      lpInterstitialLoaded = false;
      lpInterstitial.showAd().catch((e) => {
        console.warn('LevelPlay interstitial show failed', e);
      });
      return;
    }

    if (!interstitial || !interstitialLoaded) return;
    interstitial.show();
  } catch (e) {
    console.warn('Interstitial show failed', e);
  }
}
