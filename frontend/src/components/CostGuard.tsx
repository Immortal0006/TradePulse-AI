// frontend/src/components/CostGuard.tsx
import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Scale, BarChart2, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CostGuardProps {
  token: string | null;
}

export default function CostGuard({ token }: CostGuardProps) {
  const [qty, setQty] = useState(2500);
  const [askPrice, setAskPrice] = useState(150.00);
  const [liquidityProfile, setLiquidityProfile] = useState<'Deep' | 'Average' | 'Thin'>('Average');
  const [backendMetrics, setBackendMetrics] = useState<any>(null);

  // Hook up your local variables directly to the backend engine pipeline
  useEffect(() => {
    if (!token) return;
    
    const IS_PROD = import.meta.env.PROD;
    
    // 🎯 Establish our dynamic cross-origin target base
    const API_BASE_URL = IS_PROD ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') : 'http://localhost:8000';
    
    // ✅ Clean structure targeting your real live quantitative slippage calculation engine
    fetch(`${API_BASE_URL}/api/analytics/slippage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quantity: qty,
        base_price: askPrice,
        profile: liquidityProfile
      })
    })
    .then(res => res.json())
    .then(data => setBackendMetrics(data))
    .catch(err => console.error("Slippage pipeline execution fault:", err));
  }, [qty, askPrice, liquidityProfile, token]);

  // Generate visual local grid profiles matching your server execution layers
  const orderBookVisualGrid = React.useMemo(() => {
    const data = [];
    const step = askPrice * (liquidityProfile === 'Deep' ? 0.0005 : liquidityProfile === 'Average' ? 0.0012 : 0.0025);
    
    for (let i = 0; i < 15; i++) {
      const levelPrice = askPrice + (i * step);
      const isConsumed = qty > (i * 400);
      data.push({
        price: Number(levelPrice.toFixed(2)),
        consumed: isConsumed ? Math.min(qty - (i * 400), 400) : 0,
        available: isConsumed ? 0 : 400
      });
    }
    return data;
  }, [qty, askPrice, liquidityProfile]);

  const displayFill = backendMetrics?.average_fill_price || askPrice;
  const displaySlippage = backendMetrics?.hidden_slippage_cost || 0.00;
  const displayDivergence = backendMetrics?.vwap_divergence_pct || 0.00;
  const displayAnchor = backendMetrics?.session_vwap_anchor || askPrice;

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Institutional Liquidity Simulator</h1>
        <p className="text-gray-400 text-xs mt-1">Visualize how large order block sizes consume order book depth, causing physical price slippage and VWAP divergence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL: INTERACTIVE CONTROLS */}
        <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl space-y-6 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-gray-900 pb-2 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#00ffcc]" /> Block Execution Setup
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Target Asset Base Price (₹)</label>
              <input type="number" value={askPrice} onChange={(e) => setAskPrice(Number(e.target.value))} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Market Depth (Liquidity)</label>
              <select value={liquidityProfile} onChange={(e) => setLiquidityProfile(e.target.value as any)} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono">
                <option value="Deep">Deep (Blue Chip / High Volume)</option>
                <option value="Average">Average (Mid-Cap)</option>
                <option value="Thin">Thin (Small-Cap / Penny)</option>
              </select>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-mono mb-2 text-gray-400 uppercase font-bold">
                <span>Order Block Size</span>
                <span className="text-[#00ffcc] font-black">{qty.toLocaleString()} Shares</span>
              </div>
              <input type="range" min="100" max="25000" step="100" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full accent-[#00ffcc] bg-gray-800 h-1.5 rounded-lg cursor-pointer" />
            </div>
          </div>

          <div className={`p-4 rounded-xl flex gap-3 text-xs leading-relaxed border ${displayDivergence > 0.35 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            <Scale className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-0.5 uppercase tracking-wider text-[10px]">Execution Verdict:</strong>
              {displayDivergence > 0.35 
                ? "WARNING: Severe VWAP Divergence detected by Core Engine. Slice order parameters using institutional block routing frameworks."
                : "OPTIMAL: Market depth is sufficient to absorb this block size with minimal execution penalty."}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: VISUALIZER AND TELEMETRY */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Average Fill Price</span>
              <span className="text-lg font-black text-white mt-1 block">₹{displayFill}</span>
            </div>
            <div className="bg-[#10141f] border border-rose-500/20 p-4 rounded-xl font-mono text-center shadow-lg relative">
              <span className="block text-[9px] text-gray-400 font-bold uppercase">Slippage Leakage</span>
              <span className="text-lg font-black text-rose-400 mt-1 block">₹{displaySlippage}</span>
            </div>
            <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">Session VWAP Anchor</span>
              <span className="text-lg font-black text-amber-400 mt-1 block">₹{displayAnchor}</span>
            </div>
            <div className="bg-[#10141f] border border-gray-900 p-4 rounded-xl font-mono text-center shadow-lg">
              <span className="block text-[9px] text-gray-500 font-bold uppercase">VWAP Divergence</span>
              <span className="text-lg font-black text-purple-400 mt-1 block">+{displayDivergence}%</span>
            </div>
          </div>

          <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl shadow-xl space-y-4 h-[420px] flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#00ffcc]" /> Order Book Depth & Consumption Profile
            </h3>
            
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderBookVisualGrid} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="price" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} tickFormatter={(val) => `₹${val}`} minTickGap={20} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#10141f', borderColor: '#1f2937', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="consumed" name="Consumed Volume" stroke="#ef4444" fillOpacity={1} fill="url(#colorConsumed)" stackId="1" />
                  <Area type="monotone" dataKey="available" name="Unused Liquidity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAvailable)" stackId="1" />
                  <ReferenceLine x={askPrice} stroke="#00ffcc" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Base Entry Price', fill: '#00ffcc', fontSize: 10, offset: 15 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-start gap-2 text-gray-400 text-[10px] leading-relaxed font-mono bg-[#090b0f] p-3 rounded-xl border border-gray-900">
              <Activity className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Visualizing Market Impact:</strong> The red spiked area represents the liquidity levels your order physically consumed. As you increase the block size, you are forced to buy shares at higher and higher prices, draining capital through hidden slippage.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}