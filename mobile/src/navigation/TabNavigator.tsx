import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Home' }} />
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

function ReportsStack() {
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
      <Stack.Screen name="ReportsHome" component={ReportsScreen} options={{ title: 'Reports' }} />
    </Stack.Navigator>
  );
}

/** Remaining tools & settings (not in main 5 tabs) */
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
      <Stack.Screen name="MoreHome" component={MoreMenuScreen} options={{ title: 'Others' }} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Add Transaction' }} />
      <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} options={{ title: 'Scan Receipt' }} />
      <Stack.Screen name="Loans" component={LoansScreen} />
      <Stack.Screen name="Investments" component={InvestmentsScreen} />
      <Stack.Screen name="Recurring" component={RecurringScreen} options={{ title: 'Recurring' }} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Automation" component={AutomationScreen} />
      <Stack.Screen name="BankImport" component={BankImportScreen} options={{ title: 'Bank Import' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
  color: string;
};

const MORE_MENU_ITEMS: MenuItem[] = [
  {
    icon: 'add-circle-outline',
    label: 'Add transaction',
    description: 'Record income or expense',
    route: 'AddTransaction',
    color: '#6366f1',
  },
  {
    icon: 'scan-outline',
    label: 'Scan receipt',
    description: 'Capture and extract details',
    route: 'ReceiptScanner',
    color: '#8b5cf6',
  },
  {
    icon: 'business-outline',
    label: 'Loans',
    description: 'EMIs and loan tracking',
    route: 'Loans',
    color: '#0ea5e9',
  },
  {
    icon: 'trending-up-outline',
    label: 'Investments',
    description: 'Portfolio and holdings',
    route: 'Investments',
    color: '#22c55e',
  },
  {
    icon: 'repeat-outline',
    label: 'Recurring',
    description: 'Scheduled income & expenses',
    route: 'Recurring',
    color: '#f59e0b',
  },
  {
    icon: 'alarm-outline',
    label: 'Reminders',
    description: 'Bills and due dates',
    route: 'Reminders',
    color: '#ef4444',
  },
  {
    icon: 'construct-outline',
    label: 'Automation',
    description: 'Rules and vendor mapping',
    route: 'Automation',
    color: '#a855f7',
  },
  {
    icon: 'cloud-upload-outline',
    label: 'Bank import',
    description: 'CSV statements',
    route: 'BankImport',
    color: '#06b6d4',
  },
  {
    icon: 'notifications-outline',
    label: 'Notifications',
    description: 'Alerts and messages',
    route: 'Notifications',
    color: '#14b8a6',
  },
  {
    icon: 'settings-outline',
    label: 'Settings',
    description: 'Profile, theme, sign out',
    route: 'Settings',
    color: '#64748b',
  },
];

function MoreMenuScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[moreStyles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={moreStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[moreStyles.sectionHint, { color: colors.textSecondary }]}>
        Quick actions and tools
      </Text>
      {MORE_MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.route}
          onPress={() => navigation.navigate(item.route)}
          style={[moreStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.65}
        >
          <View style={[moreStyles.iconWrap, { backgroundColor: item.color + '18' }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <View style={moreStyles.textBlock}>
            <Text style={[moreStyles.title, { color: colors.text }]}>{item.label}</Text>
            <Text style={[moreStyles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const moreStyles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  sectionHint: {
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 13, marginTop: 3, lineHeight: 18 },
});

type Ion = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: boolean, outline: Ion, solid: Ion, color: string, size: number) {
  return <Ionicons name={focused ? solid : outline} size={size} color={color} />;
}

export function TabNavigator() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPad;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: bottomPad,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Transactions"
        component={TransactionsStack}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'receipt-outline', 'receipt', color, size),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsStack}
        options={{
          tabBarLabel: 'Budgets',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'pie-chart-outline', 'pie-chart', color, size),
        }}
      />
      <Tab.Screen
        name="Home"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'home-outline', 'home', color, size),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'bar-chart-outline', 'bar-chart', color, size),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarLabel: 'Others',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'apps-outline', 'apps', color, size),
        }}
      />
    </Tab.Navigator>
  );
}
