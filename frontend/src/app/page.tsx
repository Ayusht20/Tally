'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const navigationTree = [
  { label: 'Ledger Management Accounts', path: '/ledgers', hotkey: 'L' },
  { label: 'Inventory Stock Ledger', path: '/stock', hotkey: 'I' },
  { label: 'Voucher Posting Console', path: '/vouchers', hotkey: 'V' },
  { label: 'Daybook Reports & GST Audit Summary', path: '/reports', hotkey: 'R' },
  { label: 'Financial Statements Analysis Logs', path: '/analytics', hotkey: 'A' },
  { label: 'Outstanding Payables & Receivables Matrix', path: '/outstandings', hotkey: 'O' },
  { label: 'Unit of Measure Configuration [UoM]', path: '/units', hotkey: 'ALT U' } // <-- REGISTER HUD DISPLAY
];

export default function GatewayOfSmartERP() {
  const router = useRouter();
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // 1. FIXED: Intercept ALT + U combination cleanly for quick Unit Creation mapping
      if (e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        router.push('/units');
        return;
      }

      // 2. Standard Gateway Single Alpha Hotkeys
      const pressedKey = e.key.toUpperCase();
      if (!e.altKey && !e.ctrlKey) {
        if (pressedKey === 'L') { e.preventDefault(); router.push('/ledgers'); }
        if (pressedKey === 'I') { e.preventDefault(); router.push('/stock'); }
        if (pressedKey === 'V') { e.preventDefault(); router.push('/vouchers'); }
        if (pressedKey === 'R') { e.preventDefault(); router.push('/reports'); }
        if (pressedKey === 'A') { e.preventDefault(); router.push('/analytics'); }
        if (pressedKey === 'O') { e.preventDefault(); router.push('/outstandings'); }
      }

      // 3. Menu Navigation List Arrow Keys Mapping Controls
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % navigationTree.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + navigationTree.length) % navigationTree.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        router.push(navigationTree[focusIndex].path);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [focusIndex, router]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-12 select-none cursor-none terminal-mode antialiased justify-center items-center">
      <div className="w-full max-w-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 rounded-xl shadow-2xl terminal-mode">
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-3 mb-6 flex justify-between items-center font-mono">
          <div>
            <h1 className="text-base font-bold text-white tracking-wider">GATEWAY OF SMARTERP</h1>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase">Tally Invoicing Console Node v2.0</p>
          </div>
          <span className="text-[10px] bg-cyan-950 border border-cyan-800/40 text-cyan-400 px-2 py-0.5 rounded font-bold">LIVE RECONNECTED</span>
        </header>

        {/* Dynamic Selection Interface List */}
        <div className="space-y-1 font-mono text-xs">
          {navigationTree.map((menuItem, idx) => {
            const isFocused = idx === focusIndex;
            return (
              <div
                key={menuItem.path}
                onClick={() => router.push(menuItem.path)}
                className={`px-4 py-3 rounded-lg border transition flex justify-between items-center cursor-pointer ${
                  isFocused 
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold' 
                    : 'bg-slate-950/30 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] w-4 text-center ${isFocused ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {isFocused ? '➔' : '•'}
                  </span>
                  <span className="tracking-wide uppercase font-sans text-xs">{menuItem.label}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                  isFocused ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {menuItem.hotkey}
                </span>
              </div>
            );
          })}
        </div>

        {/* Navigation Info Footer */}
        <footer className="mt-6 pt-4 border-t border-slate-900 flex justify-between items-center text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest">
          <span>[↑/↓ ARROWS] Navigate</span>
          <span>[ENTER] Execute Option</span>
        </footer>

      </div>
    </div>
  );
}