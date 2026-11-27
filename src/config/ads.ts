import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * YOUR REAL AdMob AD UNIT IDs.
 * Both look like ca-app-pub-4105406776551148/1234567890  (a "/" not a "~").
 * While an ID is missing or invalid, Google TEST ads are used, which is safe.
 */
const REAL_BANNER_ID = 'ca-app-pub-4105406776551148/9977545790';
const REAL_INTERSTITIAL_ID = 'ca-app-pub-4105406776551148/5445821140';

const isValid = (id: string) => /^ca-app-pub-\d+\/\d+$/.test(id);
const useTest = __DEV__ || Platform.OS !== 'android';

export const BANNER_UNIT_ID =
  useTest || !isValid(REAL_BANNER_ID) ? TestIds.BANNER : REAL_BANNER_ID;

export const INTERSTITIAL_UNIT_ID =
  useTest || !isValid(REAL_INTERSTITIAL_ID)
    ? TestIds.INTERSTITIAL
    : REAL_INTERSTITIAL_ID;

/**
 * ---------------------------------------------------------------------------
 * WHICH AD NETWORK TO USE
 *   'levelplay' = Unity LevelPlay (works without a Play Store listing)
 *   'admob'     = Google AdMob (switch back here once Google Play is ready)
 * ---------------------------------------------------------------------------
 */
export type AdProvider = 'levelplay' | 'admob';
export const AD_PROVIDER: AdProvider = 'levelplay';

/** From the LevelPlay dashboard: Apps > your app > App key. Paste it between the quotes. */
export const LEVELPLAY_APP_KEY = '29f2e05b5';
export const LEVELPLAY_BANNER_UNIT_ID = 'x8gyjz70jr6emc1u';
export const LEVELPLAY_INTERSTITIAL_UNIT_ID = 'p1b3r1ooto4exdck';

/** Set to true for ONE build to open LevelPlay's test suite on start (for checking setup). */
export const LEVELPLAY_TEST_SUITE = true;

/** True only when the App Key has been filled in (otherwise LevelPlay is skipped, no crash). */
export const LEVELPLAY_KEY_OK = /^[a-z0-9]{6,20}$/i.test(LEVELPLAY_APP_KEY);

/** Minimum gap between full-screen ads, so users are not annoyed. */
export const INTERSTITIAL_MIN_GAP_MS = 4 * 60 * 1000;

export const PRIVACY_EMAIL = '9hremidiv@gmail.com';
export const APP_VERSION = '2.4.4.0';
