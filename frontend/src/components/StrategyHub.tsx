// frontend/src/components/StrategyHub.tsx
import React, { useState, useEffect } from 'react';
import { Layers, Plus, Code, CheckCircle2, Bookmark, RefreshCw, AlertCircle } from 'lucide-react';

interface StrategyHubProps {
  token: string | null;
}

interface StrategyRecord {
  id: string;
  name: string;
  description: string;
  rules_config: any;
  created_at?: string;
}

export default function StrategyHub({ token }: StrategyHubProps) {
  const [strategies, setStrategies] = useState<StrategyRecord[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('15m');
  const [indicator, setIndicator] = useState('VWAP');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  const API_BASE_URL = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') 
    : 'http://localhost:8000';

  // 📡 Pull down existing custom strategies from database container
  const fetchUserStrategies = async () => {
    if (!token) return;
    setFetching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/strategies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'SUCCESS') {
        setStrategies(data.strategies);
      }
    } catch (err) {
      console.error("Failed to query user strategy records:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUserStrategies();
  }, [token]);

  // 🚀 Insert fresh strategy parameter payload straight into the DB
  const commitStrategyToDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ FIX: Clean standard JavaScript string validation guard clause
    if (!name || !name.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/strategies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          rules_configuration: {
            execution_timeframe: timeframe,
            core_indicator: indicator,
            risk_reward_baseline: "1:2"
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'SUCCESS') {
        setStatusMsg({ success: true, text: "Strategy parameters locked in successfully!" });
        setName('');
        setDescription('');
        fetchUserStrategies(); // Hot-reload list display
      } else {
        setStatusMsg({ success: false, text: data.detail || "Failed to commit strategy mapping." });
      }
    } catch (err) {
      console.error("Strategy configuration transport error:", err);
      setStatusMsg({ success: false, text: "Server network interface timeout." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Systematic Strategy Engine</h1>
        <p className="text-gray-400 text-xs mt-1">Configure custom logical filters and assign parameters to structure tracking models for your trade executions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL: CONFIGURATOR CREATION INTERFACE */}
        <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl space-y-4 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-gray-900 pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" /> Build New Rule Setup
          </h3>

          <form onSubmit={commitStrategyToDatabase} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Strategy Label Name</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Trend Breakout System"
                className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Operational Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe execution trigger criteria states..."
                className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-sans h-20 resize-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Timeframe</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono">
                  <option value="5m">5 Minute (Scalp)</option>
                  <option value="15m">15 Minute (Intraday)</option>
                  <option value="1H">1 Hour (Swing)</option>
                  <option value="1D">Daily (Position)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Primary Metric</label>
                <select value={indicator} onChange={(e) => setIndicator(e.target.value)} className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono">
                  <option value="VWAP">VWAP Anchor</option>
                  <option value="RSI">RSI Divergence</option>
                  <option value="EMA_CROSS">EMA Cross Ribbon</option>
                  <option value="MACD">MACD Momentum</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
              Save Strategy Rule Setup
            </button>
          </form>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-[10px] font-mono border flex items-center gap-2 ${statusMsg.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              {statusMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE USER STRATEGY REGISTRY FEED */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl shadow-xl space-y-4 h-[440px] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-900 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#00ffcc]" /> Activated System Allocations
              </h3>
              <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">Total: {strategies.length} active</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {fetching ? (
                <div className="text-center py-12 text-gray-600 font-mono text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin w-4 h-4" /> Pulling relational rule records...
                </div>
              ) : strategies.length === 0 ? (
                <div className="text-center py-12 text-gray-600 font-mono text-xs h-full flex items-center justify-center">
                  📂 Zero functional strategy layers compiled in database framework.
                </div>
              ) : (
                strategies.map((strat) => (
                  <div key={strat.id} className="bg-[#141a29] border border-gray-800 p-4 rounded-xl flex justify-between items-start font-mono text-xs hover:border-purple-500/40 transition-colors animate-fadeIn">
                    <div className="space-y-1 max-w-[70%]">
                      <h4 className="text-white font-black tracking-wide text-sm uppercase">{strat.name}</h4>
                      <p className="text-gray-400 font-sans text-xs font-normal leading-relaxed">{strat.description || "No supplemental documentation provided."}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block">
                        {strat.rules_config?.core_indicator || 'CUSTOM'}
                      </span>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 justify-end">
                        <Code className="w-3 h-3 text-[#00ffcc]" /> {strat.rules_config?.execution_timeframe || '15m'} Anchor
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}