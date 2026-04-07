import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { ReceiptScannerScreen } from '../screens/ReceiptScannerScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { LoansScreen } from '../screens/LoansScreen';
import { InvestmentsScreen } from '../screens/InvestmentsScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { AutomationScreen } from '../screens/AutomationScreen';
import { BankImportScreen } from '../screens/BankImportScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  const colors = useThemeColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Add Transaction' }} />
      <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} options={{ title: 'Scan Receipt' }} />
    </Stack.Navigator>
  );
}

function TransactionsStack() {
  const colors = useThemeColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="TransactionsHome" component={TransactionsScreen} options={{ title: 'Transactions' }} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Add Transaction' }} />
      <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} options={{ title: 'Scan Receipt' }} />
    </Stack.Navigator>
  );
}

function BudgetsStack() {
  const colors = useThemeColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="BudgetsHome" component={BudgetsScreen} options={{ title: 'Budgets' }} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  const colors = useThemeColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Loans" component={LoansScreen} />
      <Stack.Screen name="Investments" component={InvestmentsScreen} />
      <Stack.Screen name="Recurring" component={RecurringScreen} options={{ title: 'Recurring' }} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Automation" component={AutomationScreen} />
      <Stack.Screen name="BankImport" component={BankImportScreen} options={{ title: 'Bank Import' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function MoreScreen({ navigation }: any) {
  const colors = useThemeColors();

  const items: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string; color: string }[] = [
    { icon: 'business-outline', label: 'Loans', route: 'Loans', color: '#6366f1' },
    { icon: 'trending-up-outline', label: 'Investments', route: 'Investments', color: '#22c55e' },
    { icon: 'repeat-outline', label: 'Recurring', route: 'Recurring', color: '#f59e0b' },
    { icon: 'alarm-outline', label: 'Reminders', route: 'Reminders', color: '#ef4444' },
    { icon: 'cog-outline', label: 'Automation', route: 'Automation', color: '#8b5cf6' },
    { icon: 'cloud-upload-outline', label: 'Bank Import', route: 'BankImport', color: '#06b6d4' },
    { icon: 'bar-chart-outline', label: 'Reports', route: 'Reports', color: '#ec4899' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications', color: '#14b8a6' },
    { icon: 'settings-outline', label: 'Settings', route: 'Settings', color: '#64748b' },
  ];

  return (
    <View style={[moreStyles.container, { backgroundColor: colors.background }]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.route}
          onPress={() => navigation.navigate(item.route)}
          style={[moreStyles.item, { borderBottomColor: colors.border }]}
          activeOpacity={0.6}
        >
          <View style={[moreStyles.iconWrap, { backgroundColor: item.color + '15' }]}>
            <Ionicons name={item.icon} size={22} color={item.color} />
          </View>
          <Text style={[moreStyles.label, { color: colors.text }]}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const moreStyles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '500' },
});

function AddPlaceholder() {
  return <View />;
}

export function TabNavigator() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddPlaceholder}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={[tabStyles.addBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Transactions', { screen: 'AddTransaction' });
          },
        })}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
