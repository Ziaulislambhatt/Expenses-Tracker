export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  INR = 'INR',
}

export interface Wallet {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT' | 'SAVINGS' | 'DIGITAL';
  balance: number;
  currency: Currency;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number; // Monthly budget limit
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  walletId: string;
  toWalletId?: string; // For transfers
  date: string; // ISO string
  note?: string;
  receiptUrl?: string; // Base64 or URL
  tags: string[]; // Array of Tag IDs
  isRecurring: boolean;
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
  spent: number; // Calculated field
  period: 'MONTHLY';
}

export interface AppSettings {
  baseCurrency: Currency;
  theme: 'light' | 'dark';
  enableNotifications: boolean;
  lastBackupDate?: string;
}

export interface AppData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  tags: Tag[];
  settings: AppSettings;
}

export interface AIReceiptResponse {
  total: number;
  date: string;
  merchant: string;
  category: string;
  items?: string[];
  summary?: string;
}