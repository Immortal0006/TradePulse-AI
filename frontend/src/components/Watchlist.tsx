// frontend/src/components/Watchlist.tsx
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, TrendingUp, Sparkles, Target, ShieldX, Coins } from 'lucide-react';

interface StockTick {
  symbol: string;
  name: string;
  price: number;
  change: string;
  timestamp: string;
}
interface WatchlistProps {
  marketTicks: StockTick[];
}
// High-fidelity fallback matrix to provide instant value if server stream is buffering
const DEFAULT_GRID_DATA: StockTick[] = [
  { symbol: "SBIN.NS", name: "State Bank of India", price: 842.15, change: "+1.85%", timestamp: "Live" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", price: 2945.60, change: "-0.42%", timestamp: "Live" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", price: 4162.00, change: "+2.10%", timestamp: "Live" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Limited", price: 164.80, change: "+3.45%", timestamp: "Live" }
];

export default function Watchlist({ marketTicks }: WatchlistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const displayTicks = marketTicks.length > 0 ? marketTicks : DEFAULT_GRID_DATA;


  const executeTickerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);

    const IS_PROD = import.meta.env.PROD;
    
    // 🎯 Use our clean, explicit routing baseline
    const API_BASE_URL = IS_PROD ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') : 'http://localhost:8000';

    // ✅ Clean connection directly targeting your live analytics engine
    fetch(`${API_BASE_URL}/api/stocks/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: searchQuery })
    })
    .then(res => res.json())
    .then(data => {
      setAnalyzedData(data);
      setSearching(false);
    })
    .catch(() => setSearching(false));
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn">
      
      {/* 1. TOP PREMIUM BANNER INTELLIGENCE LINK */}
      <div className="bg-gradient-to-r from-purple-900/30 via-white to-emerald-50 border border-slate-200/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-widest px-2 py-0.5 rounded font-mono uppercase">AI Strategy Mode Active</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Market Intelligence Terminal</h1>
          <p className="text-slate-600 text-xs">Don't just watch price actions. Scan any active NSE asset below to extract concrete algorithmic setups immediately.</p>
        </div>

        {/* INTERACTIVE SEARCH ENGINE DOCK */}
        <form onSubmit={executeTickerSearch} className="flex gap-2 w-full md:w-96 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type ticker symbol (e.g. INFY.NS, AAPL)..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-300 font-mono transition-colors"
            />
          </div>
          <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-gray-900 text-xs font-black uppercase tracking-wider px-6 rounded-xl transition-all shadow-sm">
            Scan
          </button>
        </form>
      </div>

      {/* 2. DYNAMIC QUANT RADAR SETUP AND SUGGESTION EXPANSION */}
      {searching ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-xs text-slate-600 font-mono tracking-widest ">
          ⚡ EXECUTING TELEMETRY SWEEP & INTERFACING WITH GEMINI RISK MODELS...
        </div>
      ) : analyzedData && analyzedData.status === 'SUCCESS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* STATS BRIEF PANEL */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">Asset Metric Target</span>
              <div className="text-xl font-mono font-black text-slate-900 tracking-tight">{analyzedData.symbol}</div>
              <div className="text-xs text-slate-600 font-medium font-sans truncate">{analyzedData.name}</div>
            </div>
            
            <div className="my-4">
              <div className="text-3xl font-mono font-black text-slate-900">Encoding: ₹{analyzedData.price}</div>
              <div className={`text-xs font-mono font-bold mt-1 flex items-center gap-1 ${analyzedData.change.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}`}>
                {analyzedData.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {analyzedData.change} ({analyzedData.change_pct})
              </div>
            </div>

            <span className={`w-full text-center text-[9px] font-mono font-black uppercase tracking-wider py-2 rounded-lg ${analyzedData.theme === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              Vector State: {analyzedData.trend_vector}
            </span>
          </div>

          {/* UPGRADED COPILOT HIGH-FIDELITY SUGGESTION MATRIX CARD */}
          <div className="lg:col-span-2 bg-white border border-emerald-200 p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-50 rounded-full blur-xl pointer-events-none"></div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                <Sparkles className="w-4 h-4 animate-spin" /> Live Trade Signal Strategy Card
              </div>
              <div className="text-slate-700 text-[11px] font-mono leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium max-h-[160px] overflow-y-auto">
                {analyzedData.trade_suggestion}
              </div>
            </div>

            {/* ACTION FOOTER BADGE PREVIEW RULES */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200/60 mt-3 text-center text-[9px] font-mono font-black uppercase tracking-widest text-slate-600">
              <div className="bg-white border border-slate-200 p-2 rounded-xl"><Target className="w-3 h-3 mx-auto mb-1 text-emerald-700" /> Entry Focus</div>
              <div className="bg-white border border-slate-200 p-2 rounded-xl"><ShieldX className="w-3 h-3 mx-auto mb-1 text-rose-700" /> Hard Stop</div>
              <div className="bg-white border border-slate-200 p-2 rounded-xl"><Coins className="w-3 h-3 mx-auto mb-1 text-amber-700" /> Target Lock</div>
            </div>
          </div>

        </div>
      ) : analyzedData && (
        <div className="bg-rose-500/5 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 font-mono tracking-wide">{analyzedData.reason}</div>
      )}

      {/* 3. CORE TELEMETRY TRACKER GRID VIEW */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 font-mono">
          <TrendingUp className="w-4 h-4 text-emerald-700" /> Live Flow Surveillance Nodes
        </h3>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161c2a] border-b border-slate-200 text-[10px] text-slate-600 font-black uppercase tracking-widest font-mono">
                <th className="p-4">Asset Symbol</th>
                <th className="p-4">Identity Specification</th>
                <th className="p-4 text-right">Live Value</th>
                <th className="p-4 text-right">Session Change</th>
                <th className="p-4 text-right">Telemetry Frame</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/50 text-xs font-medium font-mono">
              {displayTicks.map((tick) => {
                const isPositive = tick.change.startsWith('+');
                return (
                  <tr key={tick.symbol} className="hover:bg-gray-800/10 transition-all group cursor-pointer" onClick={() => { setSearchQuery(tick.symbol); }}>
                    <td className="p-4 text-emerald-700 font-bold group-hover:underline">{tick.symbol}</td>
                    <td className="p-4 text-slate-600 font-sans font-semibold text-[11px]">{tick.name}</td>
                    <td className="p-4 text-right font-black text-slate-900">₹{typeof tick.price === 'number' ? tick.price.toFixed(2) : tick.price}</td>
                    <td className={`p-4 text-right font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tick.change}
                    </td>
                    <td className="p-4 text-right text-slate-500 text-[10px]">{tick.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}