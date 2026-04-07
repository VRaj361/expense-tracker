import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';

/** expo-secure-store is a no-op on web (native module missing); use AsyncStorage there. */
export async function getStoredAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(REFRESH_KEY);
  }
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setStoredTokens(token: string, refreshToken: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [REFRESH_KEY, refreshToken],
    ]);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearStoredTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
