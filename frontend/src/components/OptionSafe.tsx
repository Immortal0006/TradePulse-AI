// frontend/src/components/OptionSafe.tsx
import React, { useState } from 'react';
import { Zap, ShieldAlert, Activity, Layers } from 'lucide-react';

interface OptionSafeProps {
  token: string | null;
}

export default function OptionSafe({ token }: OptionSafeProps) {
  const [symbol, setSymbol] = useState('SBIN.NS');
  const [strike, setStrike] = useState(840);
  const [chosenExpiry, setChosenExpiry] = useState('');
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const triggerGreeksAnalysis = () => {
    if (!token) return;
    setLoading(true);
    
    const IS_PROD = import.meta.env.PROD;
    
    // 🎯 Establish our dynamic cross-origin target base
    const API_BASE_URL = IS_PROD 
      ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') 
      : 'http://localhost:8000';

    // ✅ Pristine production-ready endpoint payload distribution
    fetch(`${API_BASE_URL}/api/analytics/option-safe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔒 Secure authentication session block
      },
      body: JSON.stringify({ symbol, strike_price: strike, expiry_date: chosenExpiry })
    })
    .then(res => res.json())
    .then(data => {
      setMatrix(data);
      if (data.status === 'SUCCESS' && !chosenExpiry) {
        setChosenExpiry(data.expiry_used);
      }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  // Determine correct currency symbol dynamically based on where data source mapped from
  const currencySymbol = matrix?.data_mode === 'LIVE_EXCHANGE_DATA' ? '$' : '₹';

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Real-Time Derivatives Option Matrix</h1>
        <p className="text-gray-400 text-xs mt-1">Extracts active live market option chains and maps structural Black-Scholes sensitivity layers on-demand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* INPUT FORM SIDEBAR */}
        <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl space-y-4 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-gray-900 pb-2">Chain Targets</h3>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Underlying Ticker</label>
            <input 
              type="text" 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)} 
              placeholder="e.g. RELIANCE.NS, AAPL"
              className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Target Strike Price</label>
            <input type="number" value={strike} onChange={(e) => setStrike(Number(e.target.value))} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" />
          </div>

          {matrix && matrix.status === 'SUCCESS' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Active Expirations</label>
              <select value={chosenExpiry} onChange={(e) => setChosenExpiry(e.target.value)} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono">
                {matrix.all_expiries.map((exp: string) => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={triggerGreeksAnalysis} className="w-full bg-[#00ffcc] text-gray-900 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#00e6b8] transition-all">
            {loading ? "Extracting Chain..." : "Scan Options Matrix"}
          </button>
        </div>

        {/* TELEMETRY RESULTS OUTPUT */}
        <div className="md:col-span-2 space-y-4">
          {matrix && matrix.status === 'SUCCESS' ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* PRIMARY CONTRACT TELEMETRY DISPLAY */}
              <div className="bg-[#141a29] border border-gray-800 p-5 rounded-2xl grid grid-cols-2 gap-4 text-xs font-mono relative">
                <span className={`absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 rounded ${matrix.data_mode === 'LIVE_EXCHANGE_DATA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                  📡 {matrix.data_mode === 'LIVE_EXCHANGE_DATA' ? 'LIVE CBOE FEED' : 'QUANT SIMULATION ENGINE'}
                </span>

                <div><span className="text-gray-500 block text-[9px] font-black uppercase">Live Spot Price</span><span className="text-white font-black text-base">{currencySymbol}{matrix.spot_price}</span></div>
                <div><span className="text-gray-500 block text-[9px] font-black uppercase">Matched Strike Node</span><span className="text-[#00ffcc] font-black text-base">{currencySymbol}{matrix.strike_matched}</span></div>
                <div className="border-t border-gray-800/60 pt-2"><span className="text-gray-500 block text-[9px] font-black uppercase">Chain Expiration</span><span className="text-purple-400 font-bold">{matrix.expiry_used}</span></div>
                <div className="border-t border-gray-800/60 pt-2"><span className="text-gray-500 block text-[9px] font-black uppercase">Implied Volatility</span><span className="text-amber-400 font-bold">{matrix.implied_volatility}%</span></div>
              </div>

              {/* GREEKS QUAD BLOCK */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-gray-500 font-bold uppercase">Delta (Δ)</span>
                  <span className="text-xl font-extrabold text-[#00ffcc] mt-1 block">{matrix.greeks.delta}</span>
                </div>
                <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-gray-500 font-bold uppercase">Gamma (γ)</span>
                  <span className="text-xl font-extrabold text-indigo-400 mt-1 block">{matrix.greeks.gamma}</span>
                </div>
                <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-gray-500 font-bold uppercase">Theta (θ)</span>
                  <span className="text-xl font-extrabold text-rose-400 mt-1 block">{matrix.greeks.theta}</span>
                </div>
                <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-gray-500 font-bold uppercase">Vega (v)</span>
                  <span className="text-xl font-extrabold text-purple-400 mt-1 block">{matrix.greeks.vega}</span>
                </div>
              </div>

              <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl grid grid-cols-2 gap-4 text-[11px] font-mono text-gray-400">
                <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Traded Volume: <span className="text-white font-bold">{matrix.volume.toLocaleString()}</span></div>
                <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-blue-400" /> Open Interest: <span className="text-white font-bold">{matrix.open_interest.toLocaleString()}</span></div>
              </div>

              <div className="bg-[#161c2a] border border-purple-500/20 rounded-2xl p-5 space-y-2 shadow-xl animate-fadeIn">
                <div className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                  🧠 AI Risk Translator Panel
                </div>
                <p className="text-gray-300 text-xs font-sans leading-relaxed font-medium bg-[#090b0f] p-4 rounded-xl border border-gray-900">
                  {matrix.risk_translation}
                </p>
              </div>

            </div>
          ) : matrix && matrix.status === 'ERROR' ? (
            <div className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl flex gap-3 text-xs text-rose-400 font-mono items-center">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div><strong>Derivatives Alert:</strong> {matrix.reason}</div>
            </div>
          ) : (
            <div className="bg-[#10141f] border border-gray-900 p-12 rounded-2xl text-center text-xs text-gray-600 font-mono tracking-wider h-full flex flex-col justify-center items-center">
              ⛓️ Enter an active F&O ticker code to load real-world exchange option chains and mathematical risk states.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}