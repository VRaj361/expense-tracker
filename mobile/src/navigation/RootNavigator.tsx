import React, { Suspense, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { Colors } from '../theme';

/** Load heavy tab stack only after login — faster first paint + smaller initial JS parse */
const TabNavigator = React.lazy(() => import('./TabNavigator').then((m) => ({ default: m.TabNavigator })));

const Stack = createNativeStackNavigator();

function MainTabs() {
  const theme = useStore((s) => s.theme);
  return (
    <Suspense
      fallback={
        <View style={[styles.loader, { backgroundColor: Colors[theme].background }]}>
          <ActivityIndicator size="large" color={Colors[theme].primary} />
        </View>
      }
    >
      <TabNavigator />
    </Suspense>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isReady } = useAuth();
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  const navTheme = theme === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: Colors.dark.primary,
          background: Colors.dark.background,
          card: Colors.dark.surface,
          text: Colors.dark.text,
          border: Colors.dark.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: Colors.light.primary,
          background: Colors.light.background,
          card: Colors.light.surface,
          text: Colors.light.text,
          border: Colors.light.border,
        },
      };

  if (!isReady) {
    return (
      <View style={[styles.loader, { backgroundColor: Colors[theme].background }]}>
        <ActivityIndicator size="large" color={Colors[theme].primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1 },
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
