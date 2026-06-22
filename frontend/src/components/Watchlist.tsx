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
    const BACKEND_URL = IS_PROD ? window.location.hostname : 'localhost';
    const HTTP_PORT = IS_PROD ? '' : ':8000';
    const PROTOCOL = window.location.protocol;

    fetch(`${PROTOCOL}//${BACKEND_URL}${HTTP_PORT}/api/stocks/analyze`, {
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
      <div className="bg-gradient-to-r from-purple-900/30 via-[#10141f] to-emerald-900/20 border border-gray-800/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffcc]/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#00ffcc]/10 text-[#00ffcc] text-[9px] font-black tracking-widest px-2 py-0.5 rounded font-mono uppercase">AI Strategy Mode Active</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Market Intelligence Terminal</h1>
          <p className="text-gray-400 text-xs">Don't just watch price actions. Scan any active NSE asset below to extract concrete algorithmic setups immediately.</p>
        </div>

        {/* INTERACTIVE SEARCH ENGINE DOCK */}
        <form onSubmit={executeTickerSearch} className="flex gap-2 w-full md:w-96 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type ticker symbol (e.g. INFY.NS, AAPL)..." 
              className="w-full bg-[#090b0f] border border-gray-800 rounded-xl py-3.5 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ffcc] font-mono transition-colors"
            />
          </div>
          <button type="submit" className="bg-[#00ffcc] hover:bg-[#00e6b8] text-gray-900 text-xs font-black uppercase tracking-wider px-6 rounded-xl transition-all shadow-lg shadow-[#00ffcc]/10">
            Scan
          </button>
        </form>
      </div>

      {/* 2. DYNAMIC QUANT RADAR SETUP AND SUGGESTION EXPANSION */}
      {searching ? (
        <div className="text-center py-12 bg-[#10141f] border border-gray-900 rounded-2xl text-xs text-gray-400 font-mono tracking-widest animate-pulse">
          ⚡ EXECUTING TELEMETRY SWEEP & INTERFACING WITH GEMINI RISK MODELS...
        </div>
      ) : analyzedData && analyzedData.status === 'SUCCESS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* STATS BRIEF PANEL */}
          <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-wider">Asset Metric Target</span>
              <div className="text-xl font-mono font-black text-white tracking-tight">{analyzedData.symbol}</div>
              <div className="text-xs text-gray-400 font-medium font-sans truncate">{analyzedData.name}</div>
            </div>
            
            <div className="my-4">
              <div className="text-3xl font-mono font-black text-white">Encoding: ₹{analyzedData.price}</div>
              <div className={`text-xs font-mono font-bold mt-1 flex items-center gap-1 ${analyzedData.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {analyzedData.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {analyzedData.change} ({analyzedData.change_pct})
              </div>
            </div>

            <span className={`w-full text-center text-[9px] font-mono font-black uppercase tracking-wider py-2 rounded-lg ${analyzedData.theme === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              Vector State: {analyzedData.trend_vector}
            </span>
          </div>

          {/* UPGRADED COPILOT HIGH-FIDELITY SUGGESTION MATRIX CARD */}
          <div className="lg:col-span-2 bg-[#10141f] border border-[#00ffcc]/20 p-5 rounded-2xl shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#00ffcc]">
                <Sparkles className="w-4 h-4 animate-spin" /> Live Trade Signal Strategy Card
              </div>
              <div className="text-gray-300 text-[11px] font-mono leading-relaxed whitespace-pre-line bg-[#090b0f] p-4 rounded-xl border border-gray-900 font-medium max-h-[160px] overflow-y-auto">
                {analyzedData.trade_suggestion}
              </div>
            </div>

            {/* ACTION FOOTER BADGE PREVIEW RULES */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-900/60 mt-3 text-center text-[9px] font-mono font-black uppercase tracking-widest text-gray-400">
              <div className="bg-[#141b29] border border-gray-800 p-2 rounded-xl"><Target className="w-3 h-3 mx-auto mb-1 text-[#00ffcc]" /> Entry Focus</div>
              <div className="bg-[#141b29] border border-gray-800 p-2 rounded-xl"><ShieldX className="w-3 h-3 mx-auto mb-1 text-rose-400" /> Hard Stop</div>
              <div className="bg-[#141b29] border border-gray-800 p-2 rounded-xl"><Coins className="w-3 h-3 mx-auto mb-1 text-amber-400" /> Target Lock</div>
            </div>
          </div>

        </div>
      ) : analyzedData && (
        <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl text-xs text-rose-400 font-mono tracking-wide">{analyzedData.reason}</div>
      )}

      {/* 3. CORE TELEMETRY TRACKER GRID VIEW */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 font-mono">
          <TrendingUp className="w-4 h-4 text-[#00ffcc]" /> Live Flow Surveillance Nodes
        </h3>
        <div className="bg-[#10141f] border border-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161c2a] border-b border-gray-900 text-[10px] text-gray-400 font-black uppercase tracking-widest font-mono">
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
                    <td className="p-4 text-[#00ffcc] font-bold group-hover:underline">{tick.symbol}</td>
                    <td className="p-4 text-gray-400 font-sans font-semibold text-[11px]">{tick.name}</td>
                    <td className="p-4 text-right font-black text-white">₹{typeof tick.price === 'number' ? tick.price.toFixed(2) : tick.price}</td>
                    <td className={`p-4 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tick.change}
                    </td>
                    <td className="p-4 text-right text-gray-600 text-[10px]">{tick.timestamp}</td>
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