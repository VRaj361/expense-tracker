/** Seeded / merged for every account — everyday spending + common income types. */

export type DefaultCategorySeed = {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isDefault: true;
};

export const DEFAULT_CATEGORY_SEEDS: DefaultCategorySeed[] = [
  // Expenses — daily life
  { name: 'Groceries', icon: 'shopping-cart', color: '#84cc16', type: 'expense', isDefault: true },
  { name: 'Food & Dining', icon: 'utensils', color: '#ef4444', type: 'expense', isDefault: true },
  // { name: 'Coffee & Snacks', icon: 'coffee', color: '#b45309', type: 'expense', isDefault: true },
  // { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'expense', isDefault: true },
  { name: 'Fuel', icon: 'fuel', color: '#2563eb', type: 'expense', isDefault: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#f59e0b', type: 'expense', isDefault: true },
  { name: 'Bills & Utilities', icon: 'zap', color: '#8b5cf6', type: 'expense', isDefault: true },
  { name: 'Subscriptions', icon: 'repeat', color: '#7c3aed', type: 'expense', isDefault: true },
  // { name: 'Rent & Mortgage', icon: 'home', color: '#f97316', type: 'expense', isDefault: true },
  // { name: 'Household', icon: 'package', color: '#ca8a04', type: 'expense', isDefault: true },
  { name: 'Health & Pharmacy', icon: 'heart-pulse', color: '#10b981', type: 'expense', isDefault: true },
  // { name: 'Personal Care', icon: 'sparkles', color: '#db2777', type: 'expense', isDefault: true },
  { name: 'Entertainment', icon: 'film', color: '#ec4899', type: 'expense', isDefault: true },
  { name: 'Education', icon: 'book', color: '#06b6d4', type: 'expense', isDefault: true },
  { name: 'Travel', icon: 'plane', color: '#0ea5e9', type: 'expense', isDefault: true },
  // { name: 'Pets', icon: 'paw-print', color: '#a16207', type: 'expense', isDefault: true },
  // { name: 'Childcare & Family', icon: 'baby', color: '#c026d3', type: 'expense', isDefault: true },
  // { name: 'Gifts & Donations', icon: 'gift', color: '#e11d48', type: 'expense', isDefault: true },
  // { name: 'Insurance', icon: 'shield', color: '#475569', type: 'expense', isDefault: true },
  // { name: 'Taxes & Fees', icon: 'receipt', color: '#64748b', type: 'expense', isDefault: true },
  // Income (keep legacy label spelling where users may already have it)
  { name: 'Salary', icon: 'briefcase', color: '#22c55e', type: 'income', isDefault: true },
  // { name: 'Freelance', icon: 'laptop', color: '#14b8a6', type: 'income', isDefault: true },
  // { name: 'Business income', icon: 'building-2', color: '#059669', type: 'income', isDefault: true },
  // { name: 'Investment Returns', icon: 'trending-up', color: '#6366f1', type: 'income', isDefault: true },
  { name: 'Interest & dividends', icon: 'percent', color: '#4f46e5', type: 'income', isDefault: true },
  // { name: 'Rental income', icon: 'landmark', color: '#15803d', type: 'income', isDefault: true },
  // { name: 'Refunds & cashback', icon: 'undo-2', color: '#0d9488', type: 'income', isDefault: true },
  // { name: 'Other income', icon: 'circle-dollar-sign', color: '#65a30d', type: 'income', isDefault: true },
  { name: 'Other', icon: 'more-horizontal', color: '#6b7280', type: 'both', isDefault: true },
];

/** Transactions and rules are moved here when their category is deleted. */
export const FALLBACK_CATEGORY_NAME = 'Other';

/** Bump this when DEFAULT_CATEGORY_SEEDS changes so OnModuleInit migration runs again. */
export const DEFAULT_CATEGORIES_MIGRATION_KEY = 'category-defaults-daily-v2';
