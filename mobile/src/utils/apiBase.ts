import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Private LAN IPv4 — safe to use for backend URL when Metro reports this host */
function isPrivateLanHost(host: string): boolean {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}

function warnDev(message: string) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(`[FinTrack API] ${message}`);
  }
}

/**
 * Backend API base URL.
 * - Set EXPO_PUBLIC_API_URL in .env (e.g. http://192.168.1.137:3000/api) when using tunnel or if auto-detect fails.
 * - In dev, we derive LAN IP from Expo only when it is a private IP (tunnel hosts must not be used for :3000).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const manifest2 = Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | undefined;
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (isPrivateLanHost(host)) {
      return `http://${host}:3000/api`;
    }
    warnDev(
      `Metro host "${host}" is not a LAN IP (often tunnel). Set EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:3000/api in mobile/.env — otherwise iOS shows "offline" when calling localhost.`,
    );
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';

  if (Platform.OS === 'ios') {
    warnDev(
      'No EXPO_PUBLIC_API_URL and no LAN Metro host — using localhost. On a real iPhone this fails; set EXPO_PUBLIC_API_URL to your PC IP (see mobile/.env.example).',
    );
  }
  return 'http://localhost:3000/api';
}
