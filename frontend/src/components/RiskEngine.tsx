// frontend/src/components/RiskEngine.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, Target, AlertTriangle, Calculator, PieChart as PieChartIcon, ShieldAlert, Cpu } from 'lucide-react';
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

  // v1.5 Strategy Attribution Matrix Local States
  const [userStrategies, setUserStrategies] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");

  const IS_PROD = import.meta.env.PROD;
  const API_BASE_URL = IS_PROD 
    ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') 
    : 'http://localhost:8000';

  // 📡 Query live account parameters and strategy lists from PostgreSQL on mount
  useEffect(() => {
    if (!token) return;
    
    // 1. Fetch risk metrics
    fetch(`${API_BASE_URL}/api/analytics/risk-profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'SUCCESS') {
        setDbRiskProfile(data);
        setCapital(data.available_capital);
        setRiskPct(data.safety_lockout_threshold_pct / 2.5);
      }
    })
    .catch(err => console.error("Risk profile ledger sync error:", err));

    // 2. Fetch custom strategy tracking IDs for dropdown injection
    fetch(`${API_BASE_URL}/api/strategies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'SUCCESS') {
        setUserStrategies(data.strategies || []);
      }
    })
    .catch(err => console.error("Strategies attribution ledger sync error:", err));
  }, [token, API_BASE_URL]);

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

  const COLORS = ['#167653', '#DCE5E0'];

  // 🚀 Transactional Order Routing Handler
  const deployInstitutionalPosition = async () => {
    console.log("🚀 Execution triggered!", {
      tokenPresent: !!token,
      calculatedShares: riskData.maxShares,
      tickerSymbol,
      entryPrice,
      stopLoss,
      attributedStrategyId: selectedStrategyId || "NONE"
    });

    if (!token) {
      console.log("🛑 Order dropped: Token is missing.");
      return;
    }

    const finalQuantity = riskData.maxShares > 0 ? riskData.maxShares : 250;
    
    setIsExecuting(true);
    setExecutionStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: tickerSymbol || "SBIN.NS", 
          type: "BUY", 
          quantity: finalQuantity, 
          entry_price: entryPrice || 150.00,
          stop_loss: stopLoss || 140.00,
          take_profit: (entryPrice || 150.00) + (Math.abs((entryPrice || 150.00) - (stopLoss || 140.00)) * 2),
          is_paper_trade: true,
          strategy_id: selectedStrategyId || null // 🎯 Attributes order to rule layer
        })
      });

      const data = await response.json();
      console.log("📩 Backend Response Object:", data);
      
      if (response.ok && data.status === 'SUCCESS') {
        setExecutionStatus({ success: true, message: data.message });
        
        // 🧹 Clean down fields back to default baseline states on success:
        setEntryPrice(150.00);      
        setStopLoss(140.00);       
        setTickerSymbol("SBIN.NS"); 
        setSelectedStrategyId(""); // Reset selector dropdown
        
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
    <div className="space-y-6 w-full max-w-none animate-fadeIn h-full">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quantitative Risk Engine</h1>
        <p className="text-slate-600 text-xs mt-1">Institutional position sizing calculator. Prevent account blowups by sizing trades precisely to your risk tolerance.</p>
      </div>

      {/* 🚨 DYNAMIC SYSTEM LOCKOUT ALERT HARDWARE BLOCK */}
      {dbRiskProfile?.lockout_active && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 text-xs text-rose-700 font-mono items-center ">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <strong>AUTOMATED RISK ENGINE LOCKOUT ACTIVE:</strong> Your current session drawdown ({dbRiskProfile.daily_drawdown_pct}%) has breached institutional safety rules. Order routing has been blocked.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL: INPUTS */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-6 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-700" /> Account Parameters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Live Account Capital (₹)</label>
              <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none font-mono" />
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-mono mb-2 text-slate-600 uppercase font-bold">
                <span>Account Risk Limit</span>
                <span className="text-rose-700 font-black">{riskPct}% (₹{riskData.riskAmount.toLocaleString()})</span>
              </div>
              <input type="range" min="0.5" max="10" step="0.5" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} className="w-full accent-rose-500 bg-slate-200 h-1.5 rounded-lg cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Entry Price (₹)</label>
                <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Stop Loss (₹)</label>
                <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 focus:outline-none font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Target Asset Ticker Node */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Target Asset Ticker</label>
                <input 
                  type="text" 
                  value={tickerSymbol} 
                  onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())} 
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-emerald-700 focus:outline-none font-mono uppercase font-black tracking-wider" 
                  placeholder="e.g. SBIN.NS"
                />
              </div>

              {/* 🎯 v1.5 STRATEGY ATTRIBUTION MATRIX DROPDOWN SELECTION COMPONENT */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1 uppercase">
                  <Cpu className="w-3 h-3 text-emerald-700" /> Linked Strategy
                </label>
                <select
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-emerald-700 font-bold focus:outline-none font-mono cursor-pointer"
                >
                  <option value="" className="text-slate-500 font-normal">-- UNTAGGED --</option>
                  {userStrategies.map((strat) => (
                    <option key={strat.id} value={strat.id} className="text-slate-900 bg-white">
                      {strat.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 💥 DEPLOY TRANSACT BUTTON BLOCK */}
            <button
              onClick={() => {
                console.log("Button clicked! maxShares value:", riskData.maxShares);
                deployInstitutionalPosition();
              }}
              disabled={isExecuting || dbRiskProfile?.lockout_active}
              className={`w-full font-black text-xs uppercase tracking-wider p-4 rounded-xl transition-all duration-300 font-mono shadow-lg border ${
                dbRiskProfile?.lockout_active
                  ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed opacity-50'
                  : isExecuting
                  ? 'bg-purple-600/20 border-purple-500/40 text-emerald-700 '
                  : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-700 hover:from-emerald-500/30 hover:to-teal-500/30 hover:shadow-emerald-500/10'
              }`}
            >
              {isExecuting ? "Routing Orders to Ledger..." : `Deploy ${(riskData.maxShares || 250).toLocaleString()} Shares`}
            </button>

            {/* Status Notifications Panel */}
            {executionStatus && (
              <div className={`p-3 rounded-lg text-[10px] font-mono border text-center ${
                executionStatus.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {executionStatus.message}
              </div>
            )}
          </div>

          <div className={`p-4 rounded-xl flex gap-3 text-xs leading-relaxed border ${riskData.isMarginRequired ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {riskData.isMarginRequired ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <strong className="block text-slate-900 mb-0.5 uppercase tracking-wider text-[10px]">Capital Verdict:</strong>
              {riskData.isMarginRequired 
                ? `WARNING: This position requires ₹${riskData.totalPositionCost.toLocaleString()} in buying power. You will need a ${riskData.leverageRatio}x margin multiplier to execute this size.`
                : "OPTIMAL: You have sufficient cash balance to execute this trade safely without using margin leverage."}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: TELEMETRY & VISUALIZATION */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-[#E8F4ED] to-[#F5FAF6] border border-emerald-200 p-6 rounded-2xl shadow-sm relative overflow-hidden flex items-center justify-between">
            <div>
              <span className="block text-xs text-emerald-700 font-bold uppercase tracking-widest mb-1">Maximum Allowed Position Size</span>
              <span className="text-5xl font-black text-slate-900">{(riskData.maxShares || 250).toLocaleString()} <span className="text-xl text-slate-500 font-medium">Shares</span></span>
            </div>
            <Target className="w-16 h-16 text-emerald-700 opacity-20 absolute right-6" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl font-mono text-center">
              <span className="block text-[9px] text-slate-500 font-bold uppercase">Total Risk Exposure</span>
              <span className="text-xl font-black text-rose-700 mt-1 block">₹{riskData.riskAmount.toLocaleString()}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl font-mono text-center">
              <span className="block text-[9px] text-slate-500 font-bold uppercase">Risk Per Share</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">₹{riskData.perShareRisk.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex gap-6 items-center">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {riskData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#dbe5df', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace', color: '#17212b', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)' }} itemStyle={{ color: '#17212b' }} formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-2 mb-2">
                <PieChartIcon className="w-4 h-4 text-blue-400" /> Capital Allocation
              </h3>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center font-mono text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-800"></span> <span className="text-slate-600">Trade Size</span></div>
                <span className="text-slate-900 font-bold">₹{(riskData.totalPositionCost || (250 * entryPrice)).toLocaleString()}</span>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center font-mono text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-300"></span> <span className="text-slate-600">Remaining Cash</span></div>
                <span className="text-slate-900 font-bold">₹{riskData.isMarginRequired ? 0 : (capital - (riskData.totalPositionCost || (250 * entryPrice))).toLocaleString()}</span>
              </div>

              <p className="text-[10px] text-slate-500 font-mono mt-4 leading-relaxed">
                If your stop loss is hit, your account balance will fall to <strong className="text-rose-700">₹{riskData.capitalAfterLoss.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}