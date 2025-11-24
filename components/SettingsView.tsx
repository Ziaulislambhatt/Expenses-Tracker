import React from 'react';
import { Download, Upload, Trash2, Moon, Sun, ShieldCheck } from 'lucide-react';
import { AppData, AppSettings } from '../types';

interface SettingsViewProps {
  data: AppData;
  onImport: (data: AppData) => void;
  onClear: () => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ data, onImport, onClear, onUpdateSettings }) => {
  
  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `lumina_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else {
      // Simple CSV export for transactions
      const headers = ['Date', 'Amount', 'Type', 'Category', 'Wallet', 'Note'];
      const rows = data.transactions.map(t => {
        const cat = data.categories.find(c => c.id === t.categoryId)?.name || 'N/A';
        const wallet = data.wallets.find(w => w.id === t.walletId)?.name || 'N/A';
        return [t.date, t.amount, t.type, cat, wallet, `"${t.note || ''}"`].join(',');
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `lumina_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.wallets && parsed.transactions) {
           if(confirm("This will overwrite your current data. Are you sure?")) {
               onImport(parsed);
               alert("Data imported successfully!");
           }
        } else {
            alert("Invalid file format.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
            {data.settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span>Dark Mode</span>
          </div>
          <button 
            onClick={() => onUpdateSettings({...data.settings, theme: data.settings.theme === 'light' ? 'dark' : 'light'})}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${data.settings.theme === 'dark' ? 'bg-primary' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${data.settings.theme === 'dark' ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Data Management</h3>
        
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">Backup Data (JSON)</div>
                    <div className="text-sm text-slate-500">Download full backup of wallets and history.</div>
                </div>
                <button onClick={() => handleExport('json')} className="p-2 text-primary hover:bg-white rounded-lg transition-colors">
                    <Download size={20} />
                </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">Export Transactions (CSV)</div>
                    <div className="text-sm text-slate-500">Excel-compatible format for reporting.</div>
                </div>
                <button onClick={() => handleExport('csv')} className="p-2 text-emerald-600 hover:bg-white rounded-lg transition-colors">
                    <Download size={20} />
                </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">Import Backup</div>
                    <div className="text-sm text-slate-500">Restore from a JSON file.</div>
                </div>
                <label className="p-2 text-primary hover:bg-white rounded-lg transition-colors cursor-pointer">
                    <Upload size={20} />
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
         <h3 className="text-lg font-bold mb-4 text-danger flex items-center">
            <ShieldCheck size={20} className="mr-2" />
            Danger Zone
         </h3>
         <div className="p-4 border border-red-100 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-between">
             <div className="text-red-800 dark:text-red-200 text-sm">
                 Permanently delete all data from this device. This action cannot be undone.
             </div>
             <button onClick={onClear} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                 Reset App
             </button>
         </div>
      </div>
      
      <div className="text-center text-xs text-slate-400">
        Lumina Finance v1.0.0 • Local-First Architecture
      </div>
    </div>
  );
};

export default SettingsView;