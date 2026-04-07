import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { notificationAPI } from '../services/api';
import { EmptyState, Button } from '../components/ui';
import type { AppNotification } from '../types';

export function NotificationsScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll().then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Toast.show({ type: 'success', text1: 'All marked as read' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Toast.show({ type: 'success', text1: 'Notification deleted' });
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allNotifications: AppNotification[] = notifications || [];
  const hasUnread = allNotifications.some((n) => !n.isRead);

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
      budget_alert: 'warning-outline',
      reminder: 'alarm-outline',
      loan: 'business-outline',
      recurring: 'repeat-outline',
    };
    return map[type] || 'notifications-outline';
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {hasUnread && (
        <TouchableOpacity
          onPress={() => markAllReadMutation.mutate()}
          style={[styles.markAllBtn, { borderBottomColor: colors.border }]}
        >
          <Ionicons name="checkmark-done" size={18} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={allNotifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.isRead && markReadMutation.mutate(item._id)}
            onLongPress={() => deleteMutation.mutate(item._id)}
            style={[
              styles.notifCard,
              {
                backgroundColor: item.isRead ? colors.card : colors.primary + '08',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={getIcon(item.type)} size={20} color={colors.primary} />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
                  {getTimeAgo(item.createdAt)}
                </Text>
              </View>
              <Text style={[styles.notifMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.message}
              </Text>
            </View>
            {!item.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
          ) : (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications"
              description="You're all caught up!"
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  markAllText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1, marginLeft: 12 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  notifTime: { fontSize: 11, marginLeft: 8 },
  notifMessage: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
