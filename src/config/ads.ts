import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * YOUR REAL AdMob AD UNIT IDs.
 * Banner: paste yours between the quotes (AdMob > Ad units > your Banner unit).
 * Both must look like ca-app-pub-4105406776551148/1234567890  (a "/" not a "~").
 * While an ID is missing or invalid, Google TEST ads are used, which is safe.
 */
const REAL_BANNER_ID = 'PASTE_YOUR_BANNER_ID_HERE';
const REAL_INTERSTITIAL_ID = 'ca-app-pub-4105406776551148/5445821140';

const isValid = (id: string) => /^ca-app-pub-\d+\/\d+$/.test(id);
const useTest = __DEV__ || Platform.OS !== 'android';

export const BANNER_UNIT_ID =
  useTest || !isValid(REAL_BANNER_ID) ? TestIds.BANNER : REAL_BANNER_ID;

export const INTERSTITIAL_UNIT_ID =
  useTest || !isValid(REAL_INTERSTITIAL_ID)
    ? TestIds.INTERSTITIAL
    : REAL_INTERSTITIAL_ID;

/** Minimum gap between full-screen ads, so users are not annoyed. */
export const INTERSTITIAL_MIN_GAP_MS = 4 * 60 * 1000;

export const PRIVACY_EMAIL = 'your-email@example.com'; // change to your support email
export const APP_VERSION = '2.4.4.0';
