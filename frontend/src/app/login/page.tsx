'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const initialInputRef = useRef<HTMLInputElement>(null);

  // Autofocus the first field on load
  useEffect(() => {
    if (initialInputRef.current) initialInputRef.current.focus();
  }, [isRegister]);

  // Clears out form inputs completely when switching modes to fix sticky values
  const handleToggle = () => {
    setIsRegister(!isRegister);
    setEmail('');
    setPassword('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    
    try {
      const response = await fetch(`https://tally-lhy7.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isRegister) {
        setMessage('Registration successful! Fields cleared. Please sign in now.');
        setEmail('');
        setPassword('');
        setIsRegister(false);
      } else {
        // 1. Save token into a browser cookie for server-side Next.js Middleware Route Guard
        document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Strict;`;
        
        // 2. Save token to localStorage for client-side secureFetch API requests
        localStorage.setItem('access_token', data.access_token);
        
        // 3. Clear sensitive values and route user past the gate
        setEmail('');
        setPassword('');
        router.push('/'); 
      }
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 font-sans p-4 antialiased">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
        <h2 className="text-xl font-extrabold mb-6 text-center text-white font-mono tracking-tight">
          SmartERP - {isRegister ? 'Create Operator Account' : 'Operator System Sign-In'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email ID:</label>
            <input 
              ref={initialInputRef}
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 text-sm font-mono text-white"
              placeholder="operator@smarterp.com"
              required 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password:</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 text-sm font-mono text-white"
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-mono text-xs font-bold uppercase rounded-lg text-white transition tracking-widest shadow-lg shadow-cyan-950/40">
            {isRegister ? 'REGISTER ACCOUNT [ENTER]' : 'LOGIN SYSTEM [ENTER]'}
          </button>
        </form>

        {message && <p className="mt-4 text-xs font-mono text-center text-yellow-400 border border-dashed border-slate-800 p-2.5 bg-slate-950 rounded-lg">{message}</p>}

        <div className="mt-6 text-center text-xs font-mono">
          <button type="button" onClick={handleToggle} className="underline text-cyan-400 hover:text-cyan-300">
            {isRegister ? 'Already have an account? Sign In Instead' : 'Need an operator profile? Create One Here'}
          </button>
        </div>
      </div>
    </div>
  );
}