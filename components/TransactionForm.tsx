import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, Category, Wallet, Tag } from '../types';
import { Camera, Loader2, Check, X, Calendar, Tag as TagIcon, Repeat, ArrowRightLeft } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  tags: Tag[];
  onSave: (transaction: Partial<Transaction>) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'lumina_transaction_draft';

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, wallets, tags, onSave, onCancel }) => {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState<string>(wallets.length > 1 ? wallets[1].id : '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [isScanning, setIsScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setAmount(parsed.amount || '');
        setType(parsed.type || TransactionType.EXPENSE);
        setCategoryId(parsed.categoryId || categories[0]?.id);
        setWalletId(parsed.walletId || wallets[0]?.id);
        setNote(parsed.note || '');
        setSelectedTags(parsed.selectedTags || []);
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const draft = { amount, type, categoryId, walletId, note, selectedTags };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [amount, type, categoryId, walletId, note, selectedTags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !walletId) return;
    if (type === TransactionType.EXPENSE && !categoryId) return;
    if (type === TransactionType.TRANSFER && !toWalletId) return;

    onSave({
      amount: parseFloat(amount),
      type,
      categoryId: type === TransactionType.TRANSFER ? '' : categoryId,
      walletId,
      toWalletId: type === TransactionType.TRANSFER ? toWalletId : undefined,
      date: new Date(date).toISOString(),
      note,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      tags: selectedTags,
    });
    
    // Clear draft
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const data = await analyzeReceipt(base64);
        if (data.total) setAmount(data.total.toString());
        if (data.date) setDate(data.date);
        if (data.merchant) setNote(prev => (prev ? `${prev} - ` : '') + data.merchant);
        
        // Match category
        if (data.category) {
            const matchedCat = categories.find(c => 
                c.name.toLowerCase().includes(data.category.toLowerCase()) || 
                data.category.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matchedCat) setCategoryId(matchedCat.id);
        }
      } catch (err) {
        alert("Failed to analyze receipt. Please try again manually.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-lg mx-auto border border-slate-100 dark:border-slate-700 h-full overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Transaction</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={24} />
        </button>
      </div>

      <div className="mb-6">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-accent/40 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors text-accent font-medium"
        >
          {isScanning ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
          <span>{isScanning ? 'Scanning Receipt...' : 'Scan Receipt (AI)'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
          {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                type === t 
                ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-2xl font-bold placeholder-slate-300"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type !== TransactionType.TRANSFER && (
            <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
            <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white"
            >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            </div>
            )}
            
            <div className={type === TransactionType.TRANSFER ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {type === TransactionType.TRANSFER ? 'From Wallet' : 'Wallet'}
                </label>
                <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white"
                >
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
                </select>
            </div>

            {type === TransactionType.TRANSFER && (
                <div className="col-span-2">
                    <div className="flex justify-center -my-2 relative z-10">
                        <div className="bg-slate-100 dark:bg-slate-600 p-1 rounded-full text-slate-500">
                             <ArrowRightLeft size={16} />
                        </div>
                    </div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">To Wallet</label>
                    <select
                        value={toWalletId}
                        onChange={(e) => setToWalletId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white"
                    >
                        {wallets.filter(w => w.id !== walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Date</label>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
             />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-none h-20"
            placeholder="Description, Merchant, etc."
          />
        </div>

        {/* Tags */}
        <div>
           <label className="flex items-center text-xs font-semibold uppercase text-slate-500 mb-2">
             <TagIcon size={12} className="mr-1" /> Tags
           </label>
           <div className="flex flex-wrap gap-2">
             {tags.map(tag => (
               <button
                 key={tag.id}
                 type="button"
                 onClick={() => toggleTag(tag.id)}
                 className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                   selectedTags.includes(tag.id)
                     ? 'bg-primary text-white border-primary'
                     : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                 }`}
               >
                 {tag.name}
               </button>
             ))}
           </div>
        </div>

        {/* Recurring */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Repeat size={18} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Recurring Payment?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
             </div>
             
             {isRecurring && (
                 <div className="mt-3">
                     <select
                        value={recurringFrequency}
                        onChange={(e) => setRecurringFrequency(e.target.value as any)}
                        className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-500 dark:bg-slate-600 dark:text-white"
                     >
                         <option value="DAILY">Daily</option>
                         <option value="WEEKLY">Weekly</option>
                         <option value="MONTHLY">Monthly</option>
                     </select>
                 </div>
             )}
        </div>

        <div className="pt-2 flex space-x-3">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-primary/20 flex justify-center items-center space-x-2"
            >
                <Check size={18} />
                <span>Save</span>
            </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;