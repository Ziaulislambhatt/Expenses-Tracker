import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Transaction, Wallet, Category, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, TrendingUp, Calendar } from 'lucide-react';
import { startOfMonth, subMonths, format, isSameMonth } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, wallets, categories }) => {
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current month, 1 = last month
  
  const totalBalance = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);
  
  const targetDate = useMemo(() => subMonths(new Date(), periodOffset), [periodOffset]);
  
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isSameMonth(new Date(t.date), targetDate));
  }, [transactions, targetDate]);

  const income = useMemo(() => 
    filteredTransactions.filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0)
  , [filteredTransactions]);

  const expense = useMemo(() => 
    filteredTransactions.filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0)
  , [filteredTransactions]);

  // Chart Data Preparation (Daily aggregation for selected month)
  const chartData = useMemo(() => {
    const data: any[] = [];
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTx = transactions.filter(t => t.date.startsWith(dateStr));
      
      const inc = dayTx.filter(t => t.type === TransactionType.INCOME).reduce((a, t) => a + t.amount, 0);
      const exp = dayTx.filter(t => t.type === TransactionType.EXPENSE).reduce((a, t) => a + t.amount, 0);
      
      // Only push if there's data or it's a key interval to reduce noise, but for Area chart continuous is better
      if (i % 5 === 0 || i === 1 || i === daysInMonth || inc > 0 || exp > 0) {
         data.push({ name: String(i), income: inc, expense: exp, fullDate: dateStr });
      }
    }
    return data;
  }, [transactions, targetDate]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        if (cat) {
          map.set(cat.name, (map.get(cat.name) || 0) + t.amount);
        }
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions, categories]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">Overview</h2>
         <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700">
            <button 
                onClick={() => setPeriodOffset(1)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${periodOffset === 1 ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
            >
                Last Month
            </button>
            <button 
                onClick={() => setPeriodOffset(0)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${periodOffset === 0 ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
            >
                This Month
            </button>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
            <WalletIcon size={18} />
            <span className="text-sm font-medium">Total Balance</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">${totalBalance.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-emerald-600 mb-2">
            <ArrowUpRight size={18} />
            <span className="text-sm font-medium">Income ({format(targetDate, 'MMM')})</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">+${income.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-rose-500 mb-2">
            <ArrowDownRight size={18} />
            <span className="text-sm font-medium">Expenses ({format(targetDate, 'MMM')})</span>
          </div>
          <div className="text-3xl font-bold text-rose-500">-${expense.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
            <TrendingUp size={20} className="mr-2 text-accent" />
            Cash Flow
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Top Spending</h3>
          {categoryData.length > 0 ? (
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#fff'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No expense data for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;