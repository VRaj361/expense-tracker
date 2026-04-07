import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { expenseAPI } from '../services/api';
import { formatCurrency, formatDateShort, getMonthName } from '../utils/cn';
import type { Expense, OverviewStats, SpendingPrediction } from '../types';

const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

function tooltipAmount(value: unknown): string {
  const n = Array.isArray(value) ? Number(value[0]) : Number(value);
  return formatCurrency(Number.isFinite(n) ? n : 0);
}

function StatCard({ title, value, icon: Icon, trend, trendValue, color }: {
  title: string; value: string; icon: any; trend?: 'up' | 'down'; trendValue?: string; color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: overview, isLoading: statsLoading } = useQuery<OverviewStats>({
    queryKey: ['overview-stats'],
    queryFn: () => expenseAPI.getOverview().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => expenseAPI.getCategoryBreakdown().then((r) => r.data),
  });

  const { data: trends = [] } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: () => expenseAPI.getMonthlyTrends(6).then((r) => r.data),
  });

  const { data: weekly = [] } = useQuery({
    queryKey: ['weekly-spending'],
    queryFn: () => expenseAPI.getWeeklySpending().then((r) => r.data),
  });

  const { data: prediction } = useQuery<SpendingPrediction>({
    queryKey: ['prediction'],
    queryFn: () => expenseAPI.getPrediction().then((r) => r.data),
  });

  const { data: recent = [] } = useQuery<Expense[]>({
    queryKey: ['recent-transactions'],
    queryFn: () => expenseAPI.getRecent(8).then((r) => r.data),
  });

  const pieData = (categories as any[]).map((c: any) => ({
    name: c._id || 'Other',
    value: c.total,
  }));

  const trendMap = new Map<string, { income: number; expense: number; label: string }>();
  (trends as any[]).forEach((t: any) => {
    const key = `${t._id.year}-${t._id.month}`;
    if (!trendMap.has(key)) {
      trendMap.set(key, { income: 0, expense: 0, label: getMonthName(t._id.month).slice(0, 3) });
    }
    const entry = trendMap.get(key)!;
    if (t._id.type === 'income') entry.income = t.total;
    else entry.expense = t.total;
  });
  const barData = Array.from(trendMap.values());

  const weeklyData = (weekly as any[]).map((w: any) => ({
    name: `W${w._id.week}`,
    amount: w.total,
  }));

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const balance = overview?.totalBalance || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(balance)}
          icon={Wallet}
          color="#6366f1"
          trend={balance >= 0 ? 'up' : 'down'}
          trendValue={`${overview?.transactionCount || 0} transactions`}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(overview?.monthlyIncome || 0)}
          icon={TrendingUp}
          color="#10b981"
          trend={(overview?.monthlyIncome || 0) > 0 ? 'up' : undefined}
          trendValue={`All-time: ${formatCurrency(overview?.totalIncome || 0)}`}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(overview?.monthlyExpenses || 0)}
          icon={TrendingDown}
          color="#ef4444"
          trend={(overview?.monthlyExpenses || 0) > 0 ? 'down' : undefined}
          trendValue={`All-time: ${formatCurrency(overview?.totalExpenses || 0)}`}
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(overview?.monthlySavings || 0)}
          icon={PiggyBank}
          color="#f59e0b"
          trend={prediction?.trend === 'decreasing' ? 'up' : prediction?.trend === 'increasing' ? 'down' : undefined}
          trendValue={prediction?.trend === 'decreasing' ? 'Spending decreasing' : prediction?.trend === 'increasing' ? 'Spending increasing' : 'Stable'}
        />
      </div>

      {prediction && (
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />
              <h3 className="font-semibold">AI Spending Prediction</h3>
              <Badge variant={prediction.trend === 'decreasing' ? 'success' : prediction.trend === 'increasing' ? 'warning' : 'secondary'}>
                {prediction.trend}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Predicted Expenses</p>
                <p className="text-lg font-bold">{formatCurrency(prediction.predictedExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Predicted Savings</p>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(prediction.predictedSavings)}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Monthly Average</p>
                <p className="text-lg font-bold">{formatCurrency(prediction.avgMonthlyExpense)}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Trend</p>
                <p className="text-lg font-bold capitalize">{prediction.trend}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipAmount} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                No expense data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipAmount} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                No trend data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipAmount} />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                No weekly data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.length === 0 && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No transactions yet</p>
              )}
              {recent.map((t) => (
                <div key={t._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm ${
                      t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {t.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || t.categoryName || t.type}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDateShort(t.date)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold whitespace-nowrap ${
                    t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
