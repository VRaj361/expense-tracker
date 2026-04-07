import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Bell,
  CreditCard,
  TrendingUp,
  Bot,
  Upload,
  Inbox,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';

const ITEMS: {
  to: string;
  label: string;
  description: string;
  icon: typeof RefreshCw;
  color: string;
}[] = [
  {
    to: '/recurring',
    label: 'Recurring',
    description: 'Scheduled income & expenses',
    icon: RefreshCw,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    to: '/reminders',
    label: 'Reminders',
    description: 'Bills and due dates',
    icon: Bell,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    to: '/loans',
    label: 'Loans & EMI',
    description: 'Track EMIs and balances',
    icon: CreditCard,
    color: 'text-sky-600 dark:text-sky-400',
  },
  {
    to: '/investments',
    label: 'Investments',
    description: 'Portfolio and holdings',
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    to: '/automation',
    label: 'Automation',
    description: 'Rules and vendor mapping',
    icon: Bot,
    color: 'text-violet-600 dark:text-violet-400',
  },
  {
    to: '/bank-import',
    label: 'Bank import',
    description: 'Upload CSV statements',
    icon: Upload,
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    to: '/notifications',
    label: 'Notifications',
    description: 'Alerts and messages',
    icon: Inbox,
    color: 'text-teal-600 dark:text-teal-400',
  },
  {
    to: '/settings',
    label: 'Settings',
    description: 'Profile, theme, sign out',
    icon: Settings,
    color: 'text-slate-600 dark:text-slate-400',
  },
];

export function MoreMenuPage() {
  return (
    <div className="mx-auto max-w-lg space-y-3 pb-4 lg:max-w-none">
      <div>
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Others</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          More tools and settings — same as the sidebar on larger screens.
        </p>
      </div>
      <ul className="space-y-2">
        {ITEMS.map(({ to, label, description, icon: Icon, color }) => (
          <li key={to}>
            <Link
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5',
                'transition-colors hover:bg-[hsl(var(--accent))]',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))]/50',
                  color,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[hsl(var(--foreground))]">{label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
