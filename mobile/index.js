import 'react-native-gesture-handler';
// Polyfill must load before axios / any code that uses URL.protocol (Hermes bridgeless).
import 'react-native-url-polyfill/auto';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';
import App from './App';

// Keep native splash until auth init finishes (avoids long blank + spinner flash).
SplashScreen.preventAutoHideAsync().catch(() => {});

registerRootComponent(App);
