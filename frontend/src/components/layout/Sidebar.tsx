import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, PiggyBank, RefreshCw, Bell, CreditCard,
  TrendingUp, Settings, Wallet, Bot, FileDown, Upload, X, ChevronLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/expenses', icon: Receipt, label: 'Transactions' },
  { path: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { path: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { path: '/reminders', icon: Bell, label: 'Reminders' },
  { path: '/loans', icon: CreditCard, label: 'Loans & EMI' },
  { path: '/investments', icon: TrendingUp, label: 'Investments' },
  { path: '/automation', icon: Bot, label: 'Automation' },
  { path: '/bank-import', icon: Upload, label: 'Bank Import' },
  { path: '/reports', icon: FileDown, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useStore();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar — slides in from left, fully hidden when closed */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--border))]">
          <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <Wallet className="h-7 w-7 text-[hsl(var(--primary))]" />
            <span className="font-bold text-lg">FinTrack</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Desktop sidebar — collapsible between icon-only and full */}
      <aside
        className={cn(
          'relative hidden lg:flex h-full bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex-col transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--border))]">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <Wallet className="h-7 w-7 text-[hsl(var(--primary))]" />
              <span className="font-bold text-lg">FinTrack</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer mx-auto"
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]',
                  !sidebarOpen && 'justify-center px-2',
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
