import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartlabs.lms',
  appName: 'SMART LABS',
  webDir: 'public',
  server: {
    url: 'https://lms.smartlabs.lk/',
    androidScheme: 'https',
    cleartext: false, // Force HTTPS
    allowNavigation: [
      'lms.smartlabs.lk',
      '*.smartlabs.lk',
      'accounts.google.com',
      '*.google.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
      'zoom.us',
      '*.zoom.us',
      '*.b-cdn.net',
      '*.bunny.net'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      showSpinner: true,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: false, // Block insecure content
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
