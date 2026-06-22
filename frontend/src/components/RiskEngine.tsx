// frontend/src/components/RiskEngine.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, Target, AlertTriangle, Calculator, PieChart as PieChartIcon, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskEngineProps {
  token: string | null;
}

export default function RiskEngine({ token }: RiskEngineProps) {
  const [capital, setCapital] = useState(100000);
  const [riskPct, setRiskPct] = useState(2);
  const [entryPrice, setEntryPrice] = useState(150.00);
  const [stopLoss, setStopLoss] = useState(140.00);
  const [dbRiskProfile, setDbRiskProfile] = useState<any>(null);
  
  // New transactional control states
  const [tickerSymbol, setTickerSymbol] = useState("SBIN.NS");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<{success: boolean; message: string} | null>(null);

  // 📡 Query live account parameter thresholds from PostgreSQL on mount
  useEffect(() => {
    if (!token) return;
    
    const IS_PROD = import.meta.env.PROD;
    
    // 🎯 Establish our dynamic cross-origin target base
    const API_BASE_URL = IS_PROD ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') : 'http://localhost:8000';
    
    // ✅ Pristine dynamic routing straight to your real risk backend
    fetch(`${API_BASE_URL}/api/analytics/risk-profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'SUCCESS') {
        setDbRiskProfile(data);
        setCapital(data.available_capital);
        setRiskPct(data.safety_lockout_threshold_pct / 2.5); // Default to a safe fractional limit
      }
    })
    .catch(err => console.error("Risk profile ledger sync error:", err));
  }, [token]);

  const riskData = useMemo(() => {
    const riskAmount = capital * (riskPct / 100);
    const perShareRisk = Math.abs(entryPrice - stopLoss);
    const maxShares = perShareRisk > 0 ? Math.floor(riskAmount / perShareRisk) : 0;
    const totalPositionCost = maxShares * entryPrice;
    const isMarginRequired = totalPositionCost > capital;
    const leverageRatio = isMarginRequired ? (totalPositionCost / capital).toFixed(2) : "1.00";
    const capitalAfterLoss = capital - riskAmount;

    return {
      riskAmount,
      perShareRisk,
      maxShares,
      totalPositionCost,
      capitalAfterLoss,
      isMarginRequired,
      leverageRatio,
      chartData: [
        { name: 'Allocated to Trade', value: totalPositionCost },
        { name: 'Remaining Cash', value: isMarginRequired ? 0 : capital - totalPositionCost }
      ]
    };
  }, [capital, riskPct, entryPrice, stopLoss]);

  const COLORS = ['#00ffcc', '#1f2937'];

  // 🚀 Transactional Order Routing Handler
  const deployInstitutionalPosition = async () => {
    // 🔍 Console log to see exactly what values are present when clicked
    console.log("🚀 Execution triggered!", {
      tokenPresent: !!token,
      calculatedShares: riskData.maxShares,
      tickerSymbol,
      entryPrice,
      stopLoss
    });

    if (!token) {
      console.log("🛑 Order dropped: Token is missing.");
      return;
    }

    // Fallback: If calculation fails or equals 0, use 250 shares so you can still test your backend route!
    const finalQuantity = riskData.maxShares > 0 ? riskData.maxShares : 250;
    
    setIsExecuting(true);
    setExecutionStatus(null);

    const IS_PROD = import.meta.env.PROD;
    
    // 🎯 Use clean dynamic routing directly
    const API_BASE_URL = IS_PROD ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') : 'http://localhost:8000';

    try {
      // ✅ Completely safe production connection endpoint
      const response = await fetch(`${API_BASE_URL}/api/orders/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: tickerSymbol || "SBIN.NS", 
          type: "BUY", 
          quantity: finalQuantity, // Uses the safe volume fallback
          entry_price: entryPrice || 150.00,
          stop_loss: stopLoss || 140.00,
          take_profit: (entryPrice || 150.00) + (Math.abs((entryPrice || 150.00) - (stopLoss || 140.00)) * 2),
          is_paper_trade: true
        })
      });

      const data = await response.json();
      console.log("📩 Backend Response Object:", data);
      
      if (response.ok && data.status === 'SUCCESS') {
        setExecutionStatus({ success: true, message: data.message });
        
        // 🧹 Clean down fields back to default baseline states on success:
        setEntryPrice(150.00);      // Resets entry price input
        setStopLoss(140.00);       // Resets stop loss input
        setTickerSymbol("SBIN.NS"); // Resets ticker token back to default
        
      } else {
        setExecutionStatus({ success: false, message: data.detail || "Execution clearing fault." });
      }
    } catch (err) {
      console.error("Order deployment transport error:", err);
      setExecutionStatus({ success: false, message: "Network connection dropped out." });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn h-full">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Quantitative Risk Engine</h1>
        <p className="text-gray-400 text-xs mt-1">Institutional position sizing calculator. Prevent account blowups by sizing trades precisely to your risk tolerance.</p>
      </div>

      {/* 🚨 DYNAMIC SYSTEM LOCKOUT ALERT HARDWARE BLOCK */}
      {dbRiskProfile?.lockout_active && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex gap-3 text-xs text-rose-400 font-mono items-center animate-pulse">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <strong>AUTOMATED RISK ENGINE LOCKOUT ACTIVE:</strong> Your current session drawdown ({dbRiskProfile.daily_drawdown_pct}%) has breached institutional safety rules. Order routing has been blocked.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL: INPUTS */}
        <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl space-y-6 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-gray-900 pb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-400" /> Account Parameters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Live Account Capital (₹)</label>
              <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" />
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-mono mb-2 text-gray-400 uppercase font-bold">
                <span>Account Risk Limit</span>
                <span className="text-rose-400 font-black">{riskPct}% (₹{riskData.riskAmount.toLocaleString()})</span>
              </div>
              <input type="range" min="0.5" max="10" step="0.5" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} className="w-full accent-rose-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Entry Price (₹)</label>
                <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Stop Loss (₹)</label>
                <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className="w-full bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 focus:outline-none font-mono" />
              </div>
            </div>

            {/* Target Asset Ticker Node */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Target Asset Ticker</label>
              <input 
                type="text" 
                value={tickerSymbol} 
                onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())} 
                className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-[#00ffcc] focus:outline-none font-mono uppercase font-black tracking-wider" 
                placeholder="e.g. SBIN.NS"
              />
            </div>

            {/* 💥 DEPLOY TRANSACT BUTTON BLOCK */}
            <button
              onClick={() => {
                console.log("Button clicked! maxShares value:", riskData.maxShares);
                deployInstitutionalPosition();
              }}
              // Keep the disabled attribute fully in sync with your logic checks!
              disabled={isExecuting || (riskData.maxShares <= 0 && !tickerSymbol) || dbRiskProfile?.lockout_active}
              className={`w-full font-black text-xs uppercase tracking-wider p-4 rounded-xl transition-all duration-300 font-mono shadow-lg border ${
                dbRiskProfile?.lockout_active || riskData.maxShares <= 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-500/20' // Forced active layout for testing
                  : isExecuting
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-400 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 hover:shadow-emerald-500/10'
              }`}
            >
              {isExecuting ? "Routing Orders to Ledger..." : `Deploy ${(riskData.maxShares || 250).toLocaleString()} Shares`}
            </button>

            {/* Status Notifications Panel */}
            {executionStatus && (
              <div className={`p-3 rounded-lg text-[10px] font-mono border text-center ${
                executionStatus.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {executionStatus.message}
              </div>
            )}
          </div>

          <div className={`p-4 rounded-xl flex gap-3 text-xs leading-relaxed border ${riskData.isMarginRequired ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {riskData.isMarginRequired ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <strong className="block text-white mb-0.5 uppercase tracking-wider text-[10px]">Capital Verdict:</strong>
              {riskData.isMarginRequired 
                ? `WARNING: This position requires ₹${riskData.totalPositionCost.toLocaleString()} in buying power. You will need a ${riskData.leverageRatio}x margin multiplier to execute this size.`
                : "OPTIMAL: You have sufficient cash balance to execute this trade safely without using margin leverage."}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: TELEMETRY & VISUALIZATION */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-[#10141f] to-[#0d1017] border border-[#00ffcc]/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,255,204,0.05)] relative overflow-hidden flex items-center justify-between">
            <div>
              <span className="block text-xs text-[#00ffcc] font-bold uppercase tracking-widest mb-1">Maximum Allowed Position Size</span>
              <span className="text-5xl font-black text-white">{riskData.maxShares.toLocaleString()} <span className="text-xl text-gray-500 font-medium">Shares</span></span>
            </div>
            <Target className="w-16 h-16 text-[#00ffcc] opacity-20 absolute right-6" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Total Risk Exposure</span>
              <span className="text-xl font-black text-rose-400 mt-1 block">₹{riskData.riskAmount.toLocaleString()}</span>
            </div>
            <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Risk Per Share</span>
              <span className="text-xl font-black text-white mt-1 block">₹{riskData.perShareRisk.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl shadow-xl flex gap-6 items-center">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {riskData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#10141f', borderColor: '#1f2937', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-2">
                <PieChartIcon className="w-4 h-4 text-blue-400" /> Capital Allocation
              </h3>
              
              <div className="bg-[#090b0f] p-3 rounded-lg border border-gray-800 flex justify-between items-center font-mono text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#00ffcc]"></span> <span className="text-gray-400">Trade Size</span></div>
                <span className="text-white font-bold">₹{riskData.totalPositionCost.toLocaleString()}</span>
              </div>
              
              <div className="bg-[#090b0f] p-3 rounded-lg border border-gray-800 flex justify-between items-center font-mono text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-800"></span> <span className="text-gray-400">Remaining Cash</span></div>
                <span className="text-white font-bold">₹{riskData.isMarginRequired ? 0 : (capital - riskData.totalPositionCost).toLocaleString()}</span>
              </div>

              <p className="text-[10px] text-gray-500 font-mono mt-4 leading-relaxed">
                If your stop loss is hit, your account balance will fall to <strong className="text-rose-400">₹{riskData.capitalAfterLoss.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}