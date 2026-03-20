// capacitor.config.ts — KavachForWork
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.kavachforwork.app',
  appName: 'KavachForWork',
  webDir: '../client/dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: 'kavach-release.keystore',
      keystoreAlias: 'kavach',
    },
  },
  plugins: {
    Geolocation: {
      // Fine location for GPS coordinates
    },
    Device: {
      // Battery info
    },
  },
};

export default config;
