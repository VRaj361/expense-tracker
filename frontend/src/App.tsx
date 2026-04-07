import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { RecurringPage } from './pages/RecurringPage';
import { RemindersPage } from './pages/RemindersPage';
import { LoansPage } from './pages/LoansPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { AutomationPage } from './pages/AutomationPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BankImportPage } from './pages/BankImportPage';
import { MoreMenuPage } from './pages/MoreMenuPage';
import { SharedWalletsPage } from './pages/SharedWalletsPage';
import { SharedWalletDetailPage } from './pages/SharedWalletDetailPage';
import { SharedWalletJoinPage } from './pages/SharedWalletJoinPage';
import { useStore } from './store/useStore';
import { authAPI } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthInit() {
  const { token, setUser, logout } = useStore();

  useEffect(() => {
    if (token) {
      authAPI
        .getMe()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, [token, setUser, logout]);

  return null;
}

function ThemeInit() {
  const { theme } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInit />
        <ThemeInit />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/shared-wallets/join" element={<SharedWalletJoinPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/recurring" element={<RecurringPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/bank-import" element={<BankImportPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/more" element={<MoreMenuPage />} />
            <Route path="/shared-wallets" element={<SharedWalletsPage />} />
            <Route path="/shared-wallets/:walletId" element={<SharedWalletDetailPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
