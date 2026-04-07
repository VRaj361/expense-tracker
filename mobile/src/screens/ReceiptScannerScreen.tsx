import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { Button } from '../components/ui';
import { expenseAPI } from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function ReceiptScannerScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission required' });
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadReceipt = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'receipt.jpg';
      const { data } = await expenseAPI.uploadReceipt(imageUri, fileName, 'image/jpeg');
      Toast.show({ type: 'success', text1: 'Receipt scanned!' });
      navigation.navigate('AddTransaction', { transaction: data });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to scan receipt' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {imageUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          <View style={styles.actions}>
            <Button
              title="Retake"
              onPress={() => setImageUri(null)}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Scan & Extract"
              onPress={uploadReceipt}
              loading={loading}
              style={{ flex: 1, marginLeft: 8 }}
              icon={<Ionicons name="scan-outline" size={18} color="#fff" />}
            />
          </View>
        </View>
      ) : (
        <View style={styles.options}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="receipt-outline" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Scan Receipt</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            Take a photo or pick from gallery to auto-extract transaction details
          </Text>
          <Button
            title="Take Photo"
            onPress={() => pickImage(true)}
            fullWidth
            size="lg"
            icon={<Ionicons name="camera-outline" size={20} color="#fff" />}
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Choose from Gallery"
            onPress={() => pickImage(false)}
            variant="outline"
            fullWidth
            size="lg"
            icon={<Ionicons name="images-outline" size={20} color={colors.primary} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  options: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  preview: {
    flex: 1,
  },
  image: {
    flex: 1,
    borderRadius: 16,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
