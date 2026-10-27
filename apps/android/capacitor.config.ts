import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The Android app is the web app in a WebView. `webDir` points at the
 * SvelteKit static build one directory over, so `bun run build` here builds the
 * web app and syncs the very same files Cloudflare serves.
 */
const config: CapacitorConfig = {
  appId: 'com.vtempest.automata',
  appName: 'Complexity Automata',
  webDir: '../web/build',
  android: {
    // The grid is drawn on a dark canvas; matching the shell avoids a white
    // flash between the splash screen and the first frame.
    backgroundColor: '#080a10',
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
