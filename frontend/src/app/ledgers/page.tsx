'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { secureFetch } from '../api';

interface LedgerItem {
  id: number;
  name: string;
  group_type: string;
  current_balance: number;
}

export default function LedgerManagement() {
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState('CUSTOMER');
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const companyId = 1;

  useEffect(() => {
    if (nameInputRef.current) nameInputRef.current.focus();

    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [router]);

  const loadLedgers = async () => {
    try {
      const res = await secureFetch(`https://tally-lhy7.onrender.com/companies/${companyId}/ledgers/`);
      if (res.ok) setLedgers(await res.json());
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  useEffect(() => { loadLedgers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await secureFetch(`https://tally-lhy7.onrender.com/companies/${companyId}/ledgers/`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.toUpperCase(),
          group_type: groupType,
          opening_balance: parseFloat(openingBalance) || 0,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Creation block fault.");

      setName('');
      setOpeningBalance('0.00');
      setMessage(`Success: Account master record generated for ${data.name}`);
      loadLedgers();
      if (nameInputRef.current) nameInputRef.current.focus();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none cursor-none antialiased">
      <div className="w-1/2 border border-slate-800 bg-slate-900/40 p-6 rounded-xl flex flex-col justify-between">
        <div>
          <div className="mb-4">
            <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 border border-slate-800 text-slate-500 rounded">← [ESC] BACK TO MAIN CONTROL</span>
          </div>
          <h2 className="text-xl font-bold border-b border-slate-800 pb-2 text-white">Ledger Master Adjustment</h2>
          
          <form onSubmit={handleCreate} className="space-y-4 mt-6 max-w-sm">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">ACCOUNT RECORD NAME</label>
              <input ref={nameInputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:border-cyan-500 text-sm font-mono uppercase text-white" placeholder="ENTERPRISES INC" required />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">ACCOUNT TYPE GROUP</label>
              <select value={groupType} onChange={(e) => setGroupType(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:border-cyan-500 text-xs font-mono text-cyan-400 font-bold">
                <option value="CUSTOMER">SUNDRY DEBTORS (CUSTOMER)</option>
                <option value="SUPPLIER">SUNDRY CREDITORS (SUPPLIER)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">OPENING VALUE BALANCE (₹)</label>
              <input type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:border-cyan-500 text-sm font-mono text-white" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 font-mono text-xs font-bold uppercase rounded text-white transition tracking-widest">
              COMMIT ACCOUNT MASTER [ENTER]
            </button>
          </form>
        </div>
        {message && <div className="mt-4 p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-yellow-400">{message}</div>}
      </div>

      <div className="w-1/2 border border-slate-800 bg-slate-900/20 p-6 rounded-xl ml-4 flex flex-col">
        <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-2 mb-4">ACTIVE AUDIT INDEX SHEETS</h3>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
          {ledgers.map((l) => (
            <div key={l.id} className="p-3 bg-slate-900 border border-slate-850/60 rounded-lg flex justify-between font-mono text-xs">
              <div>
                <p className="font-bold text-white uppercase">{l.name}</p>
                <span className="text-[9px] text-slate-500">Group Node Type: {l.group_type}</span>
              </div>
              <p className="font-bold text-cyan-400">₹{parseFloat(l.current_balance.toString()).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}