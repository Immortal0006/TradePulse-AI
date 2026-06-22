import React, { useState, useEffect, useCallback } from 'react';
import { NotebookPen, BrainCircuit, Share2, XCircle } from 'lucide-react';

interface Trade {
  id?: string;
  symbol: string;
  type: string;
  quantity: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  exit_price?: number;
  realized_pnl: number;
  status: string;
  is_paper_trade: boolean;
  journal_notes: string;
  behavioral_tag: string;
  created_at?: string;
}

interface TradeJournalProps {
  token: string | null;
}

export default function TradeJournal({ token }: TradeJournalProps) {
  const [stock, setStock] = useState('TCS.NS');
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState('');
  const [action, setAction] = useState('BUY');
  const [emotions, setEmotions] = useState('');
  
  const [journalHistory, setJournalHistory] = useState<Trade[]>([]);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronize component state ledger indices with PostgreSQL database records
  const fetchTrades = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/trades', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJournalHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch database transaction ledger:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Handle transaction persistence packet execution
  const commitToJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !emotions || !token) return;

    const newTrade = {
      symbol: stock,
      type: action,
      quantity: Number(quantity),
      entry_price: Number(price),
      is_paper_trade: true,
      journal_notes: emotions,
      behavioral_tag: "DISCIPLINED"
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTrade)
      });

      if (res.ok) {
        setPrice('');
        setEmotions('');
        fetchTrades(); // Force structural sync reload
      }
    } catch (err) {
      console.error("Failed to write to persistent trade log:", err);
    }
  };

  // Close an active open trade log frame
  const handleClosePosition = async (tradeId: string) => {
    const exitPriceInput = prompt("Enter asset exit settlement price (₹):");
    if (!exitPriceInput || isNaN(Number(exitPriceInput)) || !token) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exit_price: Number(exitPriceInput)
        })
      });

      if (res.ok) {
        fetchTrades();
      }
    } catch (err) {
      console.error("Failed to execute position settlement transaction:", err);
    }
  };

  // Trigger Gemini Cognitive Audit Pipeline
  const triggerPsychologyAudit = async () => {
    if (journalHistory.length === 0 || !token) return;
    setLoading(true);
    setAuditResult(null);

    // Transform database ledger logs into matching parameters for the audit payload
    const historyPayload = journalHistory.map(t => ({
      symbol: t.symbol,
      action: t.type,
      notes: t.journal_notes
    }));

    try {
      const res = await fetch('http://127.0.0.1:8000/api/journal/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ history: historyPayload })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data.audit);
      }
    } catch (err) {
      console.error("AI Analysis connection link timed out:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Trade Journal & Mindset Auditor</h1>
        <p className="text-gray-400 text-xs mt-1">Logs behavioral metrics and prints exportable social performance cards audited by AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JOURNAL INPUT SHEET CONTAINER */}
        <div className="bg-[#10141f] border border-gray-900 p-5 rounded-2xl space-y-4 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-gray-900 pb-2 flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-[#00ffcc]" /> Log Practice Position
          </h3>
          <form onSubmit={commitToJournal} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Asset Code</label>
                <select value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white focus:outline-none">
                  <option value="SBIN.NS">SBIN.NS</option>
                  <option value="RELIANCE.NS">RELIANCE.NS</option>
                  <option value="TCS.NS">TCS.NS</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Quantity</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Price Node</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 4160" className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white focus:outline-none font-mono" required />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Action Mode</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white focus:outline-none">
                <option value="BUY">BUY / LONG</option>
                <option value="SELL">SELL / SHORT</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Mindset Context (What emotions are you feeling?)</label>
              <textarea value={emotions} onChange={(e) => setEmotions(e.target.value)} placeholder="e.g. I missed the morning breakout move, felt frustrated by FOMO, and jumped in aggressively late..." className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white focus:outline-none h-24 font-sans resize-none" required />
            </div>

            <button type="submit" className="w-full bg-[#00ffcc] text-gray-900 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#00e6b8] transition-all">
              Commit Position Entry to Journal
            </button>
          </form>
        </div>

        {/* LOGGED SESSIONS AND SHAREABLE FLEX PANEL BOX */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Logged Session Feed</h3>
            {journalHistory.length > 0 && (
              <button onClick={triggerPsychologyAudit} className="bg-[#161c2a] border border-[#00ffcc]/20 text-[#00ffcc] text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg hover:bg-[#20273a] transition-all flex items-center gap-1.5">
                <BrainCircuit className="w-3 h-3" /> {loading ? "Analyzing..." : "Run AI Psychology Audit"}
              </button>
            )}
          </div>

          {/* DYNAMIC AUDIT BANNER CONTAINER CARD */}
          {auditResult && (
            <div className="bg-[#10141f] border border-[#a855f7]/30 p-4 rounded-xl text-xs space-y-2 animate-fadeIn relative">
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-black px-2 py-0.5 rounded font-mono uppercase">AI Psychological Audit Correction Card</span>
              <p className="text-gray-300 font-sans leading-relaxed mt-1">{auditResult}</p>
            </div>
          )}

          {/* ITEMS FEED WITH CUSTOM EMBEDDED EXPORT BUTTON */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {journalHistory.length > 0 ? (
              journalHistory.map((node) => (
                <div key={node.id} className="bg-[#10141f] border border-gray-900 rounded-xl p-4 text-xs font-mono flex flex-col gap-1 relative overflow-hidden shadow-lg group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-[#00ffcc]/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>{node.created_at ? new Date(node.created_at).toLocaleTimeString() : 'LIVE'}</span>
                    <span className={node.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{node.type === 'BUY' ? 'BUY / LONG' : 'SELL / SHORT'}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-base tracking-tight mt-0.5">
                    <span>{node.symbol}</span>
                    <div className="space-x-4">
                      <span className="text-gray-400 text-xs">Qty: {node.quantity}</span>
                      <span>₹{node.entry_price}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 font-sans mt-2 text-[11px] leading-relaxed italic border-l-2 border-gray-800 pl-2">"{node.journal_notes}"</p>
                  
                  {/* POSITION MANAGEMENT CONTROL TRIGGER LAYOUT */}
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      {node.status === 'OPEN' ? (
                        <button 
                          onClick={() => handleClosePosition(node.id!)}
                          className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase px-2 py-1 rounded hover:bg-amber-500 hover:text-slate-950 transition-all"
                        >
                          Close Position
                        </button>
                      ) : (
                        <div className="space-x-2">
                          <span className="text-[9px] text-gray-500 uppercase">Closed @ ₹{node.exit_price}</span>
                          <span className={`text-[10px] font-bold ${node.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {node.realized_pnl >= 0 ? `+₹${node.realized_pnl.toFixed(2)}` : `-₹${Math.abs(node.realized_pnl).toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => alert(`📸 Exporting execution profile card framework layout image parameters!`)}
                      className="opacity-0 group-hover:opacity-100 transition-all text-[8px] bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Share2 className="w-2.5 h-2.5" /> Save Flex Card
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#10141f]/40 border border-gray-900 border-dashed p-8 rounded-2xl text-center text-xs text-gray-600 font-mono tracking-wider">
                📓 No entries committed yet. Log a trade position to open your session audit pipe.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}