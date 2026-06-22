import React, { useState } from 'react';
import { Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
      // If logging in, your backend now expects an OAuth2 Form Data structure (python-multipart)
      let bodyData: any;
      let headers: any = {};

      if (!isRegistering) {
        // Form Data format for OAuth2PasswordRequestForm
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 expects 'username' field mapping to email
        formData.append('password', password);
        bodyData = formData.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        // Standard JSON format for registration schema
        bodyData = JSON.stringify({ email, password });
        headers['Content-Type'] = 'application/json';
      }
      const IS_PROD = import.meta.env.PROD;
      const API_BASE_URL = IS_PROD ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') : 'http://localhost:8000';
      
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: bodyData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication execution protocol failure.');
      }

      if (isRegistering) {
        setMessage('Identity provisioned successfully! Switching to session gate...');
        setTimeout(() => {
          setIsRegistering(false);
          setPassword('');
        }, 1500);
      } else {
        // Store your token signature securely
        localStorage.setItem('token', data.access_token);
        onLoginSuccess(data.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Network channel linkage timed out.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#0f121a] border border-gray-900 rounded-2xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent"></div>

        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00ffcc]/10 border border-[#00ffcc]/20 mb-2">
            <Layers className="w-6 h-6 text-[#00ffcc]" />
          </div>
          <h2 className="text-xl font-black tracking-wider text-white">TRADEPULSE AI</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-mono">
            {isRegistering ? 'Provision Storage Partition' : 'Establish Quantitative Session'}
          </p>
        </div>

        {/* Error / Success Status Ribbons */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-900/50 p-3.5 rounded-xl text-xs text-rose-400 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="bg-emerald-950/40 border border-emerald-900/50 p-3.5 rounded-xl text-xs text-emerald-400 flex items-start gap-2 animate-fadeIn">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Form Elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Terminal Identity (Email)</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@trade-pulse.ai"
              className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-[#00ffcc]/40 font-mono"
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Access Verification Code (Password)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#090b0f] border border-gray-900 rounded-xl p-3 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-[#00ffcc]/40 font-mono"
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#00ffcc] text-gray-900 text-xs font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#00e6b8] transition-all shadow-lg shadow-[#00ffcc]/10 mt-2"
          >
            {isRegistering ? 'Execute Registration Protocol' : 'Initialize Command Workspace'}
          </button>
        </form>

        {/* Dynamic Mode Switcher */}
        <div className="text-center pt-2 border-t border-gray-900">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setMessage('');
            }}
            className="text-[10px] font-bold text-gray-500 hover:text-[#00ffcc] uppercase tracking-wider transition-all"
          >
            {isRegistering ? 'Already cleared? Mount Existing Profile' : 'Request New Security Authorization Keys'}
          </button>
        </div>

      </div>
    </div>
  );
}