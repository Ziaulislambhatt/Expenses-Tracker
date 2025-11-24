import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Assuming standard handling, but for single file constraints I'll simple render text or assume user can parse markdown or just read raw text. I'll just render raw text with simple formatting for this constraint.

interface AIInsightsProps {
  transactions: Transaction[];
  categories: Category[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, categories }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const result = await getFinancialInsights(transactions, categories);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-yellow-300" />
          <h2 className="text-xl font-bold">AI Financial Insights</h2>
        </div>
        <button 
          onClick={generate}
          disabled={loading}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-h-[120px]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-white/70 space-y-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Analyzing your spending habits...</span>
          </div>
        ) : insight ? (
          <div className="prose prose-invert prose-sm max-w-none">
             <p className="whitespace-pre-line leading-relaxed">{insight}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/60 text-center">
            <p className="mb-2">Tap the refresh button to get personalized advice based on your recent transactions.</p>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-white/40 flex justify-between items-center">
        <span>Powered by Gemini 2.5 Flash</span>
        <span>Secure & Private</span>
      </div>
    </div>
  );
};

export default AIInsights;
