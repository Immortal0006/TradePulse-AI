import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, BadgeInfo, NotebookTabs, SlidersHorizontal, Layers, Calculator, LogOut, Cpu } from 'lucide-react';

// Import our modular dashboard feature panels
import Watchlist from './components/Watchlist';
import CostGuard from './components/CostGuard';
import OptionSafe from './components/OptionSafe';
import TradeJournal from './components/TradeJournal';
import RiskEngine from './components/RiskEngine';
import { Login } from './components/Login';
import StrategyHub from './components/StrategyHub'; 

export default function App() {
  // Session Authentication Persistence Layer
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Navigation Routing States (🎯 Expanded with 'strategy')
  const [activeTab, setActiveTab] = useState<'watchlist' | 'cost' | 'option' | 'journal' | 'risk' | 'strategy'>('watchlist');
  
  // Memory Caches tracking background WebSocket payload items
  const [marketTicks, setMarketTicks] = useState<any[]>([]);
  const [isSystemLocked, setIsSystemLocked] = useState<boolean>(false);
  const [simulatedLoss, setSimulatedLoss] = useState<number>(0);

  // Detect if the app is live or running locally
  const IS_PROD = import.meta.env.PROD;

  // 🎯 Dynamic Base HTTP URL setup
  const API_BASE_URL = IS_PROD 
    ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') 
    : 'http://localhost:8000';

  // 🎯 Dynamic Base WebSocket URL setup (Strips http/https and swaps to ws/wss cleanly)
  const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

  // 1. OPEN PERSISTENT EVENT-DRIVEN WEBSOCKET PIPE (WITH AUTO-RECONNECT)
  useEffect(() => {
    if (!token) return;
    
    let ws_bridge: WebSocket;
    let reconnectTimeout: any; 

    const connectStream = () => {
      ws_bridge = new WebSocket(`${WS_BASE_URL}/api/market-stream`);

      ws_bridge.onopen = () => {
        console.log("✅ TradePulse Backend Channel connected and streaming active.");
      };

      ws_bridge.onmessage = (event) => {
        const server_payload = JSON.parse(event.data);
        if (server_payload.type === 'SYSTEM_LOCK') {
          setIsSystemLocked(true);
        } else if (server_payload.type === 'MARKET_DATA') {
          setMarketTicks(server_payload.payload);
        } else if (Array.isArray(server_payload)) {
          setMarketTicks(server_payload);
        }
      };

      ws_bridge.onerror = () => {
        console.log("⚠️ TradePulse Backend Channel connection offline.");
      };

      ws_bridge.onclose = () => {
        console.log("🔌 Stream channel severed. Re-establishing handshake in 3 seconds...");
        reconnectTimeout = setTimeout(() => {
          connectStream();
        }, 3000);
      };
    };

    connectStream();

    return () => {
      if (ws_bridge) ws_bridge.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [token, WS_BASE_URL]);

  // 2. SAFETY LOCK CONTROL: BROADCAST SIMULATED PNL METRICS
  useEffect(() => {
    if (!token) return;
    
    fetch(`${API_BASE_URL}/api/risk/update-drawdown`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ simulated_loss: simulatedLoss })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'LOCKED') {
        setIsSystemLocked(true);
      }
    })
    .catch(err => console.error("Risk Engine unreachable:", err));
  }, [simulatedLoss, token, API_BASE_URL]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsSystemLocked(false);
  };

  // Guard Clause: If unauthenticated, drop layout framing and route to Login view wrapper
  if (!token) {
    return <Login onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  // --- HARD RISK OVER-RIDE INTERACTION CANVAS ---
  if (isSystemLocked) {
    return (
      <div className="min-h-screen bg-[#f4f6f3] text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-slate-200 border-t-4 border-t-rose-600 p-8 rounded-xl max-w-md w-full text-center shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold tracking-tight mb-2 text-slate-900">SAFETY LOCKOUT ENGAGED</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Your terminal execution interface has been completely isolated. Maximum daily drawdown limit parameters exceeded (-₹10,000 threshold breached).
          </p>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 mb-4 h-24"
            placeholder="Type your cognitive behavioral log statement down here before cooling-off timer expiration..."
          />
          <button className="w-full bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold py-3 px-4 rounded-lg transition-colors">
            Log Discipline Justification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-slate-900 flex font-sans">
      
      {/* SIDEBAR NAVIGATION GRID DRAWER */}
      <aside className="w-64 bg-[#17211f] text-slate-100 border-r border-[#26332f] flex flex-col p-4 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3 py-4 border-b border-[#30403a]">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-base tracking-wide text-white">TradePulse</span>
            <span className="text-[9px] bg-emerald-400/10 text-emerald-300 font-medium px-1.5 py-0.5 rounded">AI</span>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('watchlist')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'watchlist' ? 'bg-[#293b34] text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Activity className="w-4 h-4" /> Watchlist
            </button>
            <button onClick={() => setActiveTab('cost')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'cost' ? 'bg-[#293b34] text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <SlidersHorizontal className="w-4 h-4" /> Cost Guard
            </button>
            <button onClick={() => setActiveTab('option')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'option' ? 'bg-[#293b34] text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <BadgeInfo className="w-4 h-4" /> Option Safe
            </button>
            <button onClick={() => setActiveTab('risk')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'risk' ? 'bg-[#293b34] text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Calculator className="w-4 h-4" /> Risk Engine
            </button>
            <button onClick={() => setActiveTab('journal')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'journal' ? 'bg-[#293b34] text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <NotebookTabs className="w-4 h-4" /> Trade Journal
            </button>
            
            {/* 🎯 SIDEBAR LINK CONNECTING STRATEGY ENGINE */}
            <button 
              onClick={() => setActiveTab('strategy')} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'strategy' 
                  ? 'bg-[#293b34] text-emerald-300' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-300" /> Strategy Hub
            </button>
          </nav>
        </div>
 
        <div className="space-y-3">
          {/* ACCOUNT DRAWDOWN SAFETY TESTING MODULE PANEL */}
          <div className="bg-[#202d28] border border-[#30403a] rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              <span>Risk Control Room</span>
            </div>
            <input 
              type="range" min="-12000" max="0" step="500" value={simulatedLoss} onChange={(e) => setSimulatedLoss(Number(e.target.value))}
              className="w-full accent-emerald-400 bg-[#30403a] h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-slate-400 text-[10px]">Today’s P&L:</span>
              <span className={`font-bold ${simulatedLoss <= -10000 ? 'text-rose-400' : 'text-amber-300'}`}>
                ₹{simulatedLoss}
              </span>
            </div>
          </div>

          {/* SESSION TERMINATION BUTTON */}
          <button 
            onClick={handleLogout}
            className="w-full bg-[#202d28] border border-[#30403a] text-slate-300 hover:text-rose-300 hover:border-rose-900 p-2.5 text-[10px] uppercase font-semibold tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3 h-3" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* DYNAMIC COMPONENT PANEL CANVAS ACTION CONTENT SPACE */}
      <main className="min-w-0 flex-1 p-6 md:p-8 overflow-y-auto bg-[#f4f6f3]">
        {activeTab === 'watchlist' && <Watchlist marketTicks={marketTicks} />}
        {activeTab === 'cost' && <CostGuard token={token} />}     
        {activeTab === 'option' && <OptionSafe token={token} />}   
        {activeTab === 'risk' && <RiskEngine token={token} />}
        {activeTab === 'journal' && <TradeJournal token={token} />}
        
        {/* 🎯 MOUNT STRATEGY ENGINE HERE */}
        {activeTab === 'strategy' && <StrategyHub token={token} />}
      </main>
    </div>
  );
}