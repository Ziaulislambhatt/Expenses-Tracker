import { AppData, Currency, TransactionType } from './types';

export const INITIAL_DATA: AppData = {
  settings: {
    baseCurrency: Currency.USD,
    theme: 'light',
    enableNotifications: true,
  },
  wallets: [
    { id: 'w1', name: 'Wallet', type: 'CASH', balance: 50.00, currency: Currency.USD, color: '#3b82f6' },
    { id: 'w2', name: 'Main Checking', type: 'BANK', balance: 2450.00, currency: Currency.USD, color: '#10b981' },
    { id: 'w3', name: 'Savings', type: 'SAVINGS', balance: 10000.00, currency: Currency.USD, color: '#8b5cf6' },
  ],
  categories: [
    { id: 'c1', name: 'Food & Dining', icon: 'utensils', color: '#ef4444', budgetLimit: 600 },
    { id: 'c2', name: 'Transportation', icon: 'car', color: '#f59e0b', budgetLimit: 300 },
    { id: 'c3', name: 'Shopping', icon: 'shopping-bag', color: '#8b5cf6', budgetLimit: 400 },
    { id: 'c4', name: 'Entertainment', icon: 'film', color: '#ec4899', budgetLimit: 200 },
    { id: 'c5', name: 'Housing', icon: 'home', color: '#3b82f6', budgetLimit: 1500 },
    { id: 'c6', name: 'Salary', icon: 'briefcase', color: '#10b981' },
    { id: 'c7', name: 'Investments', icon: 'trending-up', color: '#06b6d4' },
    { id: 'c8', name: 'Health', icon: 'heart', color: '#ef4444', budgetLimit: 150 },
    { id: 'c9', name: 'Utilities', icon: 'zap', color: '#fbbf24', budgetLimit: 250 },
  ],
  tags: [
    { id: 'tg1', name: 'Personal', color: '#94a3b8' },
    { id: 'tg2', name: 'Business', color: '#3b82f6' },
    { id: 'tg3', name: 'Vacation', color: '#f59e0b' },
  ],
  transactions: [],
};

// Mock data generator for demo purposes
export const MOCK_TRANSACTIONS = [
  { 
    id: 't1', 
    amount: 45.50, 
    type: TransactionType.EXPENSE, 
    categoryId: 'c1', 
    walletId: 'w2', 
    date: new Date(Date.now() - 86400000).toISOString(), 
    note: 'Dinner at Mario\'s', 
    isRecurring: false,
    tags: ['tg1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 't2', 
    amount: 12.00, 
    type: TransactionType.EXPENSE, 
    categoryId: 'c2', 
    walletId: 'w1', 
    date: new Date(Date.now() - 172800000).toISOString(), 
    note: 'Uber ride', 
    isRecurring: false,
    tags: ['tg1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 't3', 
    amount: 3200.00, 
    type: TransactionType.INCOME, 
    categoryId: 'c6', 
    walletId: 'w2', 
    date: new Date(Date.now() - 400000000).toISOString(), 
    note: 'Monthly Salary', 
    isRecurring: true, 
    recurringFrequency: 'MONTHLY',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];