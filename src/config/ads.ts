import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * PASTE YOUR REAL AdMob AD UNIT IDs HERE (AdMob > Apps > Offline Connect Pro > Ad units).
 * They look like: ca-app-pub-4105406776551148/1234567890  (a "/" not a "~").
 * While a value is empty, Google TEST ads are shown, which is safe.
 */
const REAL_BANNER_ID = '';
const REAL_INTERSTITIAL_ID = '';

const useTest = __DEV__ || Platform.OS !== 'android';

export const BANNER_UNIT_ID =
  useTest || !REAL_BANNER_ID ? TestIds.BANNER : REAL_BANNER_ID;

export const INTERSTITIAL_UNIT_ID =
  useTest || !REAL_INTERSTITIAL_ID ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL_ID;

/** Minimum gap between full-screen ads, so users are not annoyed. */
export const INTERSTITIAL_MIN_GAP_MS = 4 * 60 * 1000;

export const PRIVACY_EMAIL = 'your-email@example.com'; // change to your support email
export const APP_VERSION = '2.4.4.0';
