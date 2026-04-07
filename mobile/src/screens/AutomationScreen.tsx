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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { automationAPI, categoryAPI } from '../services/api';
import { EmptyState, Button, Input, Select, Badge, ConfirmDialog } from '../components/ui';
import type { AutomationRule, VendorMapping } from '../types';

const CONDITION_FIELDS = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'description', label: 'Description' },
  { value: 'amount', label: 'Amount' },
];

const OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
];

const ACTION_TYPES = [
  { value: 'set_category', label: 'Set Category' },
  { value: 'set_payment_method', label: 'Set Payment Method' },
  { value: 'add_tag', label: 'Add Tag' },
];

export function AutomationScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'rules' | 'mappings'>('rules');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', field: 'vendor', operator: 'contains', value: '', actionType: 'set_category', actionValue: '' });

  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => automationAPI.getRules().then((r) => r.data),
  });

  const { data: mappings, isLoading: mappingsLoading, refetch: refetchMappings } = useQuery({
    queryKey: ['vendor-mappings'],
    queryFn: () => automationAPI.getMappings().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => automationAPI.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      Toast.show({ type: 'success', text1: 'Rule created' });
      setShowForm(false);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => automationAPI.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      Toast.show({ type: 'success', text1: 'Deleted' });
      setDeleteId(null);
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (id: string) => automationAPI.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-mappings'] });
      Toast.show({ type: 'success', text1: 'Mapping deleted' });
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const categoryOptions = (categories || []).map((c: any) => ({ value: c._id, label: c.name }));

  const handleCreate = () => {
    if (!form.name || !form.value) return;
    createRuleMutation.mutate({
      name: form.name,
      condition: { field: form.field, operator: form.operator, value: form.value },
      action: { type: form.actionType, value: form.actionValue },
      isActive: true,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabs}>
        {(['rules', 'mappings'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, { borderBottomColor: tab === t ? colors.primary : 'transparent' }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.textSecondary }]}>
              {t === 'rules' ? 'Rules' : 'Vendor Mappings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'rules' ? (
        <FlatList
          data={rules || []}
          keyExtractor={(item: AutomationRule) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setDeleteId(item._id)} style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ruleHeader}>
                <Text style={[styles.ruleName, { color: colors.text }]}>{item.name}</Text>
                <Badge text={item.isActive ? 'Active' : 'Off'} variant={item.isActive ? 'success' : 'default'} />
              </View>
              <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>
                When {item.condition.field} {item.condition.operator} "{item.condition.value}" → {item.action.type}: {item.action.value}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetchRules(); setRefreshing(false); }} />}
          ListEmptyComponent={
            rulesLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> :
              <EmptyState icon="cog-outline" title="No automation rules" description="Create rules to auto-categorize transactions" actionLabel="Add Rule" onAction={() => setShowForm(true)} />
          }
        />
      ) : (
        <FlatList
          data={mappings || []}
          keyExtractor={(item: VendorMapping) => item._id}
          renderItem={({ item }) => (
            <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ruleHeader}>
                <Text style={[styles.ruleName, { color: colors.text }]}>{item.vendorPattern}</Text>
                <TouchableOpacity onPress={() => deleteMappingMutation.mutate(item._id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>→ {item.categoryName}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetchMappings(); setRefreshing(false); }} />}
          ListEmptyComponent={
            mappingsLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> :
              <EmptyState icon="git-merge-outline" title="No vendor mappings" description="Train vendors from transactions to auto-map" />
          }
        />
      )}

      {tab === 'rules' && (
        <TouchableOpacity onPress={() => setShowForm(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowForm(false)}>
          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Create Rule</Text>
              <Input label="Rule Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g. Zomato → Food" />
              <Select label="When Field" value={form.field} options={CONDITION_FIELDS} onChange={(v) => setForm({ ...form, field: v })} />
              <Select label="Operator" value={form.operator} options={OPERATORS} onChange={(v) => setForm({ ...form, operator: v })} />
              <Input label="Value" value={form.value} onChangeText={(v) => setForm({ ...form, value: v })} placeholder="Match value" />
              <Select label="Action" value={form.actionType} options={ACTION_TYPES} onChange={(v) => setForm({ ...form, actionType: v })} />
              {form.actionType === 'set_category' ? (
                <Select label="Category" value={form.actionValue} options={categoryOptions} onChange={(v) => setForm({ ...form, actionValue: v })} />
              ) : (
                <Input label="Action Value" value={form.actionValue} onChangeText={(v) => setForm({ ...form, actionValue: v })} />
              )}
              <Button title="Create Rule" onPress={handleCreate} loading={createRuleMutation.isPending} fullWidth />
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog visible={!!deleteId} title="Delete Rule" message="Are you sure?" destructive onConfirm={() => deleteId && deleteRuleMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteRuleMutation.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 80 },
  ruleCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ruleName: { fontSize: 15, fontWeight: '700' },
  ruleDesc: { fontSize: 13, lineHeight: 18 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});
