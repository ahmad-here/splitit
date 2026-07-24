// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK (v9+) ships its React Native build via the legacy "main"
// field, not the "exports" map. With package-exports resolution on, Metro loads
// the browser build and `getReactNativePersistence` (and other RN internals) go
// missing at runtime. Disabling package exports restores the documented
// Firebase-in-Expo behaviour.
// https://docs.expo.dev/guides/using-firebase/
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
