// frontend/src/components/OptionSafe.tsx
import React, { useState } from 'react';
import { Zap, ShieldAlert, Activity, Layers, Hourglass, TrendingDown, HelpCircle } from 'lucide-react';

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
      body: JSON.stringify({ symbol, strike_price: strike, expiry_date: chosenExpiry || null })
    })
    .then(res => res.json())
    .then(data => {
      setMatrix(data);
      if ((data.status === 'SUCCESS' || data.status === 'SIMULATED') && !chosenExpiry) {
        setChosenExpiry(data.expiry_used || '');
      }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  // Determine correct currency symbol dynamically based on where data source mapped from
  const currencySymbol = matrix?.data_mode === 'LIVE_EXCHANGE_DATA' ? '$' : '₹';
  
  // Safely grab advanced risk parameters from updated API structures
  const isDataLoaded = matrix && (matrix.status === 'SUCCESS' || matrix.status === 'SIMULATED');
  const riskClassification = matrix?.risk_profile_classification || 'SAFE';
  const daysRemaining = matrix?.days_remaining ?? 'N/A';
  const calculatedTheta = matrix?.theta_daily_decay_value ?? matrix?.greeks?.theta ?? 0.0;
  const overnightHoldingRisk = matrix?.overnight_holding_risk_loss ?? 0.0;

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Real-Time Derivatives Option Matrix</h1>
        <p className="text-slate-600 text-xs mt-1">Extracts active live market option chains and maps structural Black-Scholes sensitivity layers on-demand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* INPUT FORM SIDEBAR */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">Chain Targets</h3>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Underlying Ticker</label>
            <input 
              type="text" 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)} 
              placeholder="e.g. RELIANCE.NS, AAPL"
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Target Strike Price</label>
            <input type="number" value={strike} onChange={(e) => setStrike(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none font-mono" />
          </div>

          {isDataLoaded && matrix.all_expiries && (
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Active Expirations</label>
              <select value={chosenExpiry} onChange={(e) => setChosenExpiry(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none font-mono">
                {matrix.all_expiries.map((exp: string) => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={triggerGreeksAnalysis} className="w-full bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-emerald-900 transition-all">
            {loading ? "Extracting Chain..." : "Scan Options Matrix"}
          </button>
        </div>

        {/* TELEMETRY RESULTS OUTPUT */}
        <div className="md:col-span-2 space-y-4">
          {isDataLoaded ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* 🚨 PREMIUM RISK HIGHLIGHT DECAY FLAG */}
              {riskClassification !== 'SAFE' && (
                <div className={`p-4 rounded-xl flex gap-3 text-xs font-mono items-center  border ${
                  riskClassification === 'CRITICAL_DECAY' 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <div>
                    <strong>RISK ENGINE WARNING ({riskClassification}):</strong> This contract expires in {daysRemaining} days. Time decay is accelerating exponentially. Overnight holding metrics denote structural volatility exposure.
                  </div>
                </div>
              )}

              {/* PRIMARY CONTRACT TELEMETRY DISPLAY */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl grid grid-cols-2 gap-4 text-xs font-mono relative">
                <span className={`absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 rounded ${matrix.data_mode === 'LIVE_EXCHANGE_DATA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-violet-50 text-emerald-700 border border-violet-200'}`}>
                  📡 {matrix.data_mode === 'LIVE_EXCHANGE_DATA' ? 'LIVE FEED' : 'QUANT SIMULATION ENGINE'}
                </span>

                <div><span className="text-slate-500 block text-[9px] font-black uppercase">Live Spot Price</span><span className="text-slate-900 font-black text-base">{currencySymbol}{matrix.spot_price || matrix.underlying_price || 820}</span></div>
                <div><span className="text-slate-500 block text-[9px] font-black uppercase">Matched Strike Node</span><span className="text-emerald-700 font-black text-base">{currencySymbol}{matrix.strike_matched || strike}</span></div>
                <div className="border-t border-slate-200/60 pt-2"><span className="text-slate-500 block text-[9px] font-black uppercase">Chain Expiration</span><span className="text-emerald-700 font-bold">{matrix.expiry_used || 'Dynamic'}</span></div>
                <div className="border-t border-slate-200/60 pt-2"><span className="text-slate-500 block text-[9px] font-black uppercase">Implied Volatility</span><span className="text-amber-700 font-bold">{matrix.implied_volatility || 22}%</span></div>
              </div>

              {/* GREEKS QUAD BLOCK */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Delta (Δ)</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{matrix.greeks?.delta ?? 0.5}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Gamma (γ)</span>
                  <span className="text-xl font-extrabold text-indigo-700 mt-1 block">{matrix.greeks?.gamma ?? 0.002}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Theta (θ)</span>
                  <span className="text-xl font-extrabold text-rose-700 mt-1 block">-{Math.abs(calculatedTheta).toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl font-mono text-center shadow-lg">
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Vega (v)</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{matrix.greeks?.vega ?? 0.15}</span>
                </div>
              </div>

              {/* ADVANCED QUANT TIME RISK EXTENSION PACK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 font-mono text-xs text-slate-600">
                  <Hourglass className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase">Days To Expiry</span>
                    <span className="text-slate-900 font-bold text-sm">{daysRemaining} Days Left</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 font-mono text-xs text-slate-600">
                  <TrendingDown className="w-5 h-5 text-rose-700 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase">Est. Overnight Premium Loss</span>
                    <span className="text-rose-700 font-bold text-sm">-{currencySymbol}{overnightHoldingRisk}</span>
                  </div>
                </div>
              </div>

              {matrix.volume !== undefined && matrix.open_interest !== undefined && (
                <div className="bg-white border border-slate-200 p-4 rounded-xl grid grid-cols-2 gap-4 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-700" /> Traded Volume: <span className="text-slate-900 font-bold">{matrix.volume.toLocaleString()}</span></div>
                  <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-blue-400" /> Open Interest: <span className="text-slate-900 font-bold">{matrix.open_interest.toLocaleString()}</span></div>
                </div>
              )}

              {matrix.risk_translation && (
                <div className="bg-[#161c2a] border border-violet-200 rounded-2xl p-5 space-y-2 shadow-xl animate-fadeIn">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 "></span>
                    🧠 AI Risk Translator Panel
                  </div>
                  <p className="text-slate-700 text-xs font-sans leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {matrix.risk_translation}
                  </p>
                </div>
              )}

            </div>
          ) : matrix && matrix.status === 'ERROR' ? (
            <div className="bg-rose-500/5 border border-rose-200 p-5 rounded-2xl flex gap-3 text-xs text-rose-700 font-mono items-center">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div><strong>Derivatives Alert:</strong> {matrix.reason}</div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center text-xs text-slate-500 font-mono tracking-wider h-full flex flex-col justify-center items-center">
              <HelpCircle className="w-8 h-8 text-gray-700 mb-2" />
              ⛓️ Enter an active F&O ticker code to load real-world exchange option chains and mathematical risk states.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}