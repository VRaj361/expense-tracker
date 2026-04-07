import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useThemeColors } from '../theme';
import { expenseAPI, categoryAPI } from '../services/api';
import { Input, Button, Select } from '../components/ui';
import { PAYMENT_METHODS } from '../utils/helpers';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Expense } from '../types';

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  vendor: z.string().optional(),
  date: z.date(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export function AddTransactionScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const transaction = route.params?.transaction as Expense | undefined;
  const isEditing = !!transaction;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data),
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: transaction?.amount?.toString() || '',
      type: transaction?.type || 'expense',
      categoryId: transaction?.categoryId || '',
      description: transaction?.description || '',
      paymentMethod: transaction?.paymentMethod || '',
      vendor: transaction?.vendor || '',
      date: transaction ? new Date(transaction.date) : new Date(),
    },
  });

  const type = watch('type');

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      isEditing ? expenseAPI.update(transaction!._id, data) : expenseAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      Toast.show({ type: 'success', text1: isEditing ? 'Transaction updated' : 'Transaction added' });
      navigation.goBack();
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    },
  });

  const onSubmit = (data: FormData) => {
    const category = categories?.find((c: any) => c._id === data.categoryId);
    createMutation.mutate({
      amount: parseFloat(data.amount),
      type: data.type,
      categoryId: data.categoryId || undefined,
      categoryName: category?.name || undefined,
      description: data.description || undefined,
      paymentMethod: data.paymentMethod || undefined,
      vendor: data.vendor || undefined,
      date: data.date.toISOString(),
    });
  };

  const categoryOptions = (categories || [])
    .filter((c: any) => c.type === type || c.type === 'both')
    .map((c: any) => ({ value: c._id, label: c.name }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.typeToggle}>
        {(['expense', 'income'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setValue('type', t)}
            style={[
              styles.typeBtn,
              {
                backgroundColor: type === t ? (t === 'expense' ? colors.expense : colors.income) : colors.surfaceVariant,
              },
            ]}
          >
            <Ionicons
              name={t === 'expense' ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={16}
              color={type === t ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeText,
                { color: type === t ? '#fff' : colors.textSecondary },
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount"
            placeholder="0"
            keyboardType="numeric"
            value={value}
            onChangeText={onChange}
            error={errors.amount?.message}
            icon={<Ionicons name="cash-outline" size={18} color={colors.textSecondary} />}
          />
        )}
      />

      <Controller
        control={control}
        name="categoryId"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Category"
            placeholder="Select category"
            value={value}
            options={categoryOptions}
            onChange={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description"
            placeholder="What was this for?"
            value={value}
            onChangeText={onChange}
            icon={<Ionicons name="create-outline" size={18} color={colors.textSecondary} />}
          />
        )}
      />

      <Controller
        control={control}
        name="vendor"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Vendor"
            placeholder="Store or vendor name"
            value={value}
            onChangeText={onChange}
            icon={<Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />}
          />
        )}
      />

      <Controller
        control={control}
        name="paymentMethod"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Payment Method"
            placeholder="Select method"
            value={value}
            options={PAYMENT_METHODS}
            onChange={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field: { value } }) => (
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateTrigger, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {value.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={value}
                mode="date"
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setValue('date', date);
                }}
              />
            )}
          </View>
        )}
      />

      <View style={styles.actions}>
        <Button
          title="Scan Receipt"
          onPress={() => navigation.navigate('ReceiptScanner')}
          variant="outline"
          icon={<Ionicons name="camera-outline" size={18} color={colors.primary} />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title={isEditing ? 'Update' : 'Save'}
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateField: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  dateText: {
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
