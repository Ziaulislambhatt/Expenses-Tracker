import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet as WalletIcon, 
  Plus, 
  Settings as SettingsIcon,
  Menu,
  X,
  PieChart,
  WifiOff
} from 'lucide-react';

import { AppData, Transaction, Wallet, TransactionType, AppSettings } from './types';
import { INITIAL_DATA, MOCK_TRANSACTIONS } from './constants';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import AIInsights from './components/AIInsights';
import SettingsView from './components/SettingsView';

// Helper for local storage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

const App: React.FC = () => {
  const [data, setData] = useLocalStorage<AppData>('lumina_data_v2', INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'wallets' | 'settings'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme effect
  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // Load mock data if empty
  useEffect(() => {
    if (data.transactions.length === 0 && data.wallets[0].balance === 50) {
      const updatedWallets = [...data.wallets];
      updatedWallets[0].balance = 1250.00;
      updatedWallets[1].balance = 4500.00;
      
      setData({
        ...data,
        wallets: updatedWallets,
        transactions: MOCK_TRANSACTIONS as Transaction[],
      });
    }
  }, []);

  const handleAddTransaction = (t: Partial<Transaction>) => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: t.amount || 0,
      type: t.type || TransactionType.EXPENSE,
      categoryId: t.categoryId || '',
      walletId: t.walletId || '',
      toWalletId: t.toWalletId,
      date: t.date || new Date().toISOString(),
      note: t.note || '',
      tags: t.tags || [],
      isRecurring: t.isRecurring || false,
      recurringFrequency: t.recurringFrequency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedWallets = [...data.wallets];

    if (newTx.type === TransactionType.TRANSFER && newTx.toWalletId) {
        // Handle Transfer
        updatedWallets = updatedWallets.map(w => {
            if (w.id === newTx.walletId) return { ...w, balance: w.balance - newTx.amount };
            if (w.id === newTx.toWalletId) return { ...w, balance: w.balance + newTx.amount };
            return w;
        });
    } else {
        // Handle Income/Expense
        updatedWallets = updatedWallets.map(w => {
        if (w.id === newTx.walletId) {
            const bal = w.balance;
            const amt = newTx.amount;
            return {
            ...w,
            balance: newTx.type === TransactionType.INCOME ? bal + amt : bal - amt
            };
        }
        return w;
        });
    }

    setData({
      ...data,
      wallets: updatedWallets,
      transactions: [newTx, ...data.transactions]
    });
    setShowAddModal(false);
  };

  const handleImport = (newData: AppData) => {
      setData(newData);
  };

  const handleClearData = () => {
      if(confirm("Are you sure? This cannot be undone.")) {
          setData(INITIAL_DATA);
          window.location.reload();
      }
  }

  const handleUpdateSettings = (newSettings: AppSettings) => {
      setData({...data, settings: newSettings});
  }

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans text-slate-900 dark:text-white transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 p-6 z-10">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">L</div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Lumina</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="transactions" icon={Receipt} label="Transactions" />
          <NavItem id="wallets" icon={WalletIcon} label="Wallets & Budget" />
          <NavItem id="settings" icon={SettingsIcon} label="Settings" />
        </nav>

        {isOffline && (
            <div className="mt-auto mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center space-x-2 text-amber-700 dark:text-amber-400 text-sm">
                <WifiOff size={16} />
                <span>Offline Mode</span>
            </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
          <div className="lg:hidden flex items-center space-x-3">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                {mobileMenuOpen ? <X /> : <Menu />}
             </button>
             <span className="font-bold text-lg">Lumina</span>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold text-slate-800 dark:text-white capitalize">{activeTab}</h1>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline font-medium">Add Transaction</span>
          </button>
        </header>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-[65px] left-0 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xl z-30 p-4 lg:hidden flex flex-col space-y-2">
             <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
             <NavItem id="transactions" icon={Receipt} label="Transactions" />
             <NavItem id="wallets" icon={WalletIcon} label="Wallets" />
             <NavItem id="settings" icon={SettingsIcon} label="Settings" />
          </div>
        )}

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                <AIInsights transactions={data.transactions} categories={data.categories} />
                <Dashboard transactions={data.transactions} wallets={data.wallets} categories={data.categories} />
              </>
            )}

            {activeTab === 'transactions' && (
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">All Transactions</h3>
                    <span className="text-sm text-slate-400">{data.transactions.length} entries</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Category/Type</th>
                          <th className="px-6 py-4">Note</th>
                          <th className="px-6 py-4">Wallet</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {data.transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                {t.type === TransactionType.TRANSFER ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Transfer
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                                        {data.categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized'}
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                {t.note}
                                {t.isRecurring && <span className="ml-2 text-xs text-accent bg-accent/10 px-1 rounded">Recurring</span>}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{data.wallets.find(w => w.id === t.walletId)?.name}</td>
                            <td className={`px-6 py-4 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                              {t.type === TransactionType.INCOME ? '+' : t.type === TransactionType.TRANSFER ? '' : '-'}${t.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.transactions.length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                        No transactions found. Add one to get started!
                      </div>
                    )}
                  </div>
               </div>
            )}

            {activeTab === 'wallets' && (
              <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.wallets.map(w => (
                    <div key={w.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-700 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
                            <WalletIcon size={24} />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{w.type}</span>
                        </div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">{w.name}</h3>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">${w.balance.toFixed(2)}</div>
                        </div>
                    </div>
                    ))}
                </div>
                
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mt-4">
                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center">
                        <PieChart size={20} className="mr-2 text-accent" />
                        Monthly Budgets
                    </h3>
                    <div className="space-y-6">
                      {data.categories.filter(c => c.budgetLimit).map(c => {
                         const now = new Date();
                         const spent = data.transactions
                          .filter(t => t.categoryId === c.id && t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === now.getMonth())
                          .reduce((sum, t) => sum + t.amount, 0);
                         const percent = Math.min(100, (spent / (c.budgetLimit || 1)) * 100);
                         
                         return (
                           <div key={c.id}>
                             <div className="flex justify-between text-sm mb-2">
                               <div className="flex items-center">
                                   <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: c.color}}></span>
                                   <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                               </div>
                               <span className="text-slate-500 dark:text-slate-400">${spent.toFixed(0)} / ${c.budgetLimit}</span>
                             </div>
                             <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                                  style={{width: `${percent}%`}}
                               ></div>
                             </div>
                             {percent > 90 && <div className="text-xs text-red-500 mt-1">Almost exceeding budget!</div>}
                           </div>
                         )
                      })}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'settings' && (
                <SettingsView 
                    data={data} 
                    onImport={handleImport} 
                    onClear={handleClearData} 
                    onUpdateSettings={handleUpdateSettings}
                />
            )}

          </div>
        </div>
      </main>

      {/* Modal Layer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <TransactionForm 
              categories={data.categories} 
              wallets={data.wallets}
              tags={data.tags}
              onSave={handleAddTransaction}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;