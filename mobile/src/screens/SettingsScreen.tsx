import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { userAPI, categoryAPI } from '../services/api';
import { useStore } from '../store/useStore';
import { Card, Button, Input, ConfirmDialog } from '../components/ui';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function SettingsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { user, theme, toggleTheme, logout, setUser } = useStore();
  const queryClient = useQueryClient();
  const [showProfile, setShowProfile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currency: user?.currency || 'INR',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userAPI.updateProfile(data),
    onSuccess: ({ data }) => {
      setUser(data);
      Toast.show({ type: 'success', text1: 'Profile updated' });
      setShowProfile(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Toast.show({ type: 'success', text1: 'Category deleted' });
    },
  });

  const handleLogout = async () => {
    await logout();
    setShowLogout(false);
  };

  const menuItems = [
    {
      icon: 'person-outline' as const,
      label: 'Edit Profile',
      onPress: () => setShowProfile(true),
    },
    {
      icon: (theme === 'dark' ? 'sunny-outline' : 'moon-outline') as const,
      label: 'Dark Mode',
      trailing: (
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.primary }}
        />
      ),
    },
    {
      icon: 'notifications-outline' as const,
      label: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.profileHeader}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <Card>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.onPress}
            disabled={!item.onPress}
            style={[
              styles.menuItem,
              i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            {item.trailing || (
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        ))}
      </Card>

      <Card title="Custom Categories">
        {(categories || [])
          .filter((c: any) => !c.isDefault)
          .map((c: any) => (
            <View
              key={c._id}
              style={[styles.categoryItem, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.categoryDot, { backgroundColor: c.color }]} />
              <Text style={[styles.categoryName, { color: colors.text }]}>{c.name}</Text>
              <TouchableOpacity onPress={() => deleteCategoryMutation.mutate(c._id)}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        {(categories || []).filter((c: any) => !c.isDefault).length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No custom categories</Text>
        )}
      </Card>

      <Button
        title="Sign Out"
        onPress={() => setShowLogout(true)}
        variant="danger"
        fullWidth
        icon={<Ionicons name="log-out-outline" size={18} color="#fff" />}
        style={{ marginTop: 8 }}
      />

      <Modal visible={showProfile} transparent animationType="slide">
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowProfile(false)}
        >
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit Profile</Text>
              <Input
                label="Name"
                value={profileForm.name}
                onChangeText={(v) => setProfileForm({ ...profileForm, name: v })}
              />
              <Input
                label="Phone"
                value={profileForm.phone}
                onChangeText={(v) => setProfileForm({ ...profileForm, phone: v })}
                keyboardType="phone-pad"
              />
              <Input
                label="Currency"
                value={profileForm.currency}
                onChangeText={(v) => setProfileForm({ ...profileForm, currency: v })}
              />
              <Button
                title="Save"
                onPress={() => updateProfileMutation.mutate(profileForm)}
                loading={updateProfileMutation.isPending}
                fullWidth
              />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog
        visible={showLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '700' },
  profileEmail: { fontSize: 14, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { flex: 1, fontSize: 14 },
  emptyText: { textAlign: 'center', paddingVertical: 12, fontSize: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});
