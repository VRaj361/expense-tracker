import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { bankImportAPI } from '../services/api';
import { EmptyState, Button, Input, Card } from '../components/ui';
import type { BankProfile, ParsedTransaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { useStore } from '../store/useStore';

export function BankImportScreen() {
  const colors = useThemeColors();
  const currency = useStore((s) => s.user?.currency) || 'INR';
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [fileUri, setFileUri] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<ParsedTransaction[] | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bankName: '',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    withdrawalColumn: 'Withdrawal',
    depositColumn: 'Deposit',
    dateFormat: 'DD/MM/YYYY',
    headerRowIndex: '0',
    delimiter: ',',
  });

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['bank-profiles'],
    queryFn: () => bankImportAPI.getProfiles().then((r) => r.data),
  });

  const createProfileMutation = useMutation({
    mutationFn: (data: any) => bankImportAPI.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-profiles'] });
      Toast.show({ type: 'success', text1: 'Profile created' });
      setShowProfileForm(false);
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => bankImportAPI.preview(selectedProfile, fileUri, fileName),
    onSuccess: ({ data }) => {
      setPreview(data.transactions || data);
      Toast.show({ type: 'success', text1: `${(data.transactions || data).length} transactions found` });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Preview failed' }),
  });

  const importMutation = useMutation({
    mutationFn: () => bankImportAPI.import(selectedProfile, fileUri, fileName, skipDuplicates),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      Toast.show({ type: 'success', text1: `Imported ${data.imported || 0} transactions` });
      setPreview(null);
      setFileUri('');
      setFileName('');
    },
    onError: () => Toast.show({ type: 'error', text1: 'Import failed' }),
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (!result.canceled && result.assets?.[0]) {
      setFileUri(result.assets[0].uri);
      setFileName(result.assets[0].name);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} />}
    >
      <Card title="Select Bank Profile">
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            {(profiles || []).map((p: BankProfile) => (
              <TouchableOpacity
                key={p._id}
                onPress={() => setSelectedProfile(p._id)}
                style={[
                  styles.profileItem,
                  {
                    backgroundColor: selectedProfile === p._id ? colors.primary + '15' : colors.surfaceVariant,
                    borderColor: selectedProfile === p._id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons name="business-outline" size={18} color={selectedProfile === p._id ? colors.primary : colors.textSecondary} />
                <Text style={[styles.profileName, { color: selectedProfile === p._id ? colors.primary : colors.text }]}>
                  {p.bankName}
                </Text>
              </TouchableOpacity>
            ))}
            <Button title="+ New Profile" onPress={() => setShowProfileForm(true)} variant="ghost" size="sm" />
          </>
        )}
      </Card>

      <Card title="Upload Statement">
        <TouchableOpacity onPress={pickFile} style={[styles.fileBtn, { borderColor: colors.border }]}>
          <Ionicons name="document-outline" size={24} color={colors.primary} />
          <Text style={[styles.fileText, { color: fileName ? colors.text : colors.textTertiary }]}>
            {fileName || 'Choose CSV file...'}
          </Text>
        </TouchableOpacity>

        {fileUri && selectedProfile && (
          <View style={styles.importActions}>
            <Button title="Preview" onPress={() => previewMutation.mutate()} loading={previewMutation.isPending} variant="outline" style={{ flex: 1, marginRight: 8 }} />
            <Button title="Import" onPress={() => importMutation.mutate()} loading={importMutation.isPending} style={{ flex: 1, marginLeft: 8 }} />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Skip duplicates</Text>
          <Switch value={skipDuplicates} onValueChange={setSkipDuplicates} trackColor={{ true: colors.primary }} />
        </View>
      </Card>

      {preview && (
        <Card title={`Preview (${preview.length} transactions)`}>
          {preview.slice(0, 10).map((t, i) => (
            <View key={i} style={[styles.previewRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewDesc, { color: colors.text }]} numberOfLines={1}>{t.description}</Text>
                <Text style={[styles.previewDate, { color: colors.textSecondary }]}>{t.date}</Text>
              </View>
              <Text style={{ color: t.type === 'income' ? colors.income : colors.expense, fontWeight: '600' }}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
              </Text>
            </View>
          ))}
          {preview.length > 10 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              +{preview.length - 10} more transactions
            </Text>
          )}
        </Card>
      )}

      <Modal visible={showProfileForm} transparent animationType="slide">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowProfileForm(false)}>
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Bank Profile</Text>
              <Input label="Bank Name" value={profileForm.bankName} onChangeText={(v) => setProfileForm({ ...profileForm, bankName: v })} placeholder="e.g. HDFC Bank" />
              <Input label="Date Column" value={profileForm.dateColumn} onChangeText={(v) => setProfileForm({ ...profileForm, dateColumn: v })} />
              <Input label="Description Column" value={profileForm.descriptionColumn} onChangeText={(v) => setProfileForm({ ...profileForm, descriptionColumn: v })} />
              <Input label="Withdrawal Column" value={profileForm.withdrawalColumn} onChangeText={(v) => setProfileForm({ ...profileForm, withdrawalColumn: v })} />
              <Input label="Deposit Column" value={profileForm.depositColumn} onChangeText={(v) => setProfileForm({ ...profileForm, depositColumn: v })} />
              <Input label="Date Format" value={profileForm.dateFormat} onChangeText={(v) => setProfileForm({ ...profileForm, dateFormat: v })} />
              <Input label="Delimiter" value={profileForm.delimiter} onChangeText={(v) => setProfileForm({ ...profileForm, delimiter: v })} />
              <Button
                title="Create Profile"
                onPress={() => {
                  if (!profileForm.bankName) return;
                  createProfileMutation.mutate({
                    ...profileForm,
                    headerRowIndex: parseInt(profileForm.headerRowIndex) || 0,
                  });
                }}
                loading={createProfileMutation.isPending}
                fullWidth
              />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  profileItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  profileName: { fontSize: 15, fontWeight: '600' },
  fileBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  fileText: { fontSize: 15 },
  importActions: { flexDirection: 'row', marginTop: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  switchLabel: { fontSize: 14 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  previewDesc: { fontSize: 14 },
  previewDate: { fontSize: 12, marginTop: 2 },
  moreText: { textAlign: 'center', paddingTop: 12, fontSize: 13 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});
