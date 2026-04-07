import { NavLink, useLocation } from 'react-router-dom';
import {
  Receipt,
  PiggyBank,
  LayoutDashboard,
  FileDown,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const TABS = [
  { to: '/expenses', label: 'Transactions', icon: Receipt, end: false },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank, end: false },
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/reports', label: 'Reports', icon: FileDown, end: false },
  { to: '/more', label: 'Others', icon: LayoutGrid, end: false },
] as const;

const OTHERS_PREFIXES = [
  '/more',
  '/recurring',
  '/reminders',
  '/loans',
  '/investments',
  '/automation',
  '/bank-import',
  '/notifications',
  '/settings',
];

function isOthersActive(pathname: string): boolean {
  return OTHERS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-md',
        'pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]',
      )}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {TABS.map(({ to, label, icon: Icon, end }) => {
          const othersTab = to === '/more';
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => {
                const active = othersTab ? isOthersActive(pathname) : isActive;
                return cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 px-0.5 transition-colors',
                  active
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
                );
              }}
            >
              {({ isActive }) => {
                const active = othersTab ? isOthersActive(pathname) : isActive;
                return (
                  <>
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                    <span className="max-w-full truncate text-[10px] font-semibold leading-tight">{label}</span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
