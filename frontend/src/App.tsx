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
      <div className="min-h-screen bg-[#090b0f] text-white flex flex-col items-center justify-center p-6">
        <div className="bg-[#131722] border-t-4 border-rose-500 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">SAFETY LOCKOUT ENGAGED</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Your terminal execution interface has been completely isolated. Maximum daily drawdown limit parameters exceeded (-₹10,000 threshold breached).
          </p>
          <textarea 
            className="w-full bg-[#090b0f] border border-gray-800 rounded-xl p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-rose-500/50 mb-4 h-24"
            placeholder="Type your cognitive behavioral log statement down here before cooling-off timer expiration..."
          />
          <button className="w-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-rose-600/20">
            Log Discipline Justification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 flex font-sans">
      
      {/* SIDEBAR NAVIGATION GRID DRAWER */}
      <aside className="w-64 bg-[#0f121a] border-r border-gray-900 flex flex-col p-4 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3 py-4 border-b border-gray-900">
            <Layers className="w-6 h-6 text-[#00ffcc]" />
            <span className="font-extrabold text-base tracking-wider text-white">TRADEPULSE AI</span>
            <span className="text-[9px] bg-[#00ffcc]/10 text-[#00ffcc] font-mono px-1.5 py-0.5 rounded">SaaS</span>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('watchlist')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'watchlist' ? 'bg-[#171c28] text-[#00ffcc] shadow-md' : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'}`}>
              <Activity className="w-4 h-4" /> Watchlist
            </button>
            <button onClick={() => setActiveTab('cost')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'cost' ? 'bg-[#171c28] text-[#00ffcc] shadow-md' : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'}`}>
              <SlidersHorizontal className="w-4 h-4" /> Cost Guard
            </button>
            <button onClick={() => setActiveTab('option')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'option' ? 'bg-[#171c28] text-[#00ffcc] shadow-md' : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'}`}>
              <BadgeInfo className="w-4 h-4" /> Option Safe
            </button>
            <button onClick={() => setActiveTab('risk')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'risk' ? 'bg-[#171c28] text-[#00ffcc] shadow-md' : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'}`}>
              <Calculator className="w-4 h-4" /> Risk Engine
            </button>
            <button onClick={() => setActiveTab('journal')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === 'journal' ? 'bg-[#171c28] text-[#00ffcc] shadow-md' : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'}`}>
              <NotebookTabs className="w-4 h-4" /> Trade Journal
            </button>
            
            {/* 🎯 SIDEBAR LINK CONNECTING STRATEGY ENGINE */}
            <button 
              onClick={() => setActiveTab('strategy')} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'strategy' 
                  ? 'bg-purple-950/40 text-purple-400 border border-purple-500/20 shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800/20 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" /> Strategy Hub
            </button>
          </nav>
        </div>
 
        <div className="space-y-3">
          {/* ACCOUNT DRAWDOWN SAFETY TESTING MODULE PANEL */}
          <div className="bg-[#131722] border border-gray-900 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              <span>Risk Control Room</span>
            </div>
            <input 
              type="range" min="-12000" max="0" step="500" value={simulatedLoss} onChange={(e) => setSimulatedLoss(Number(e.target.value))}
              className="w-full accent-[#00ffcc] bg-gray-900 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-gray-500 text-[10px]">Today's PnL:</span>
              <span className={`font-bold ${simulatedLoss <= -10000 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`}>
                ₹{simulatedLoss}
              </span>
            </div>
          </div>

          {/* SESSION TERMINATION BUTTON */}
          <button 
            onClick={handleLogout}
            className="w-full bg-[#131722] border border-gray-900 text-gray-400 hover:text-rose-400 hover:border-rose-950 p-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3 h-3" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* DYNAMIC COMPONENT PANEL CANVAS ACTION CONTENT SPACE */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#090b0f]">
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