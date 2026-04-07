import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  'utensils': '🍽️',
  'shopping-bag': '🛍️',
  'car': '🚗',
  'zap': '⚡',
  'film': '🎬',
  'heart': '❤️',
  'book': '📚',
  'shopping-cart': '🛒',
  'home': '🏠',
  'briefcase': '💼',
  'laptop': '💻',
  'trending-up': '📈',
  'more-horizontal': '📦',
  'other': '📦',
};
