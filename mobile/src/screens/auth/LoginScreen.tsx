import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { useThemeColors } from '../../theme';
import { Button } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { authAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiBase';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const API_BASE = getApiBaseUrl();

/** Avoid `new URL()` on RN Hermes — query parsing only */
function parseOAuthCallbackUrl(raw: string): { token: string | null; refreshToken: string | null } {
  const q = raw.includes('?') ? raw.split('?')[1]?.split('#')[0] ?? '' : '';
  const params = new Map<string, string>();
  for (const part of q.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const k = eq >= 0 ? decodeURIComponent(part.slice(0, eq)) : decodeURIComponent(part);
    const v = eq >= 0 ? decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' ')) : '';
    params.set(k, v);
  }
  return {
    token: params.get('token') ?? null,
    refreshToken: params.get('refreshToken') ?? null,
  };
}

export function LoginScreen() {
  const colors = useThemeColors();
  const { setTokens, setUser } = useStore();
  // Expo Go on iOS needs the AuthSession proxy redirect.
  const useProxy = Constants.appOwnership === 'expo';
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'fintrack', useProxy });

  const handleGoogleLogin = async () => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/auth/google?redirect=${encodeURIComponent(redirectUri)}`,
        redirectUri,
      );

      if (result.type === 'success' && result.url) {
        const { token, refreshToken } = parseOAuthCallbackUrl(result.url);

        if (token && refreshToken) {
          await setTokens(token, refreshToken);
          const { data } = await authAPI.getMe();
          setUser(data);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet" size={48} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>FinTrack</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Smart expense tracking{'\n'}and financial management
        </Text>
      </View>

      <View style={styles.bottom}>
        <Button
          title="Continue with Google"
          onPress={handleGoogleLogin}
          fullWidth
          size="lg"
          icon={<Ionicons name="logo-google" size={20} color="#fff" />}
        />
        <Text style={[styles.terms, { color: colors.textTertiary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 48,
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    alignItems: 'center',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
