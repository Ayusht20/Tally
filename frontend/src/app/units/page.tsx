'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { secureFetch } from '../api';

const FIELD_ORDER = ['symbol', 'formalName'];
const COMPANY_ID = 1;

export default function UnitMasterConfiguration() {
  const [units, setUnits] = useState([]);
  const [sym, setSym] = useState('');
  const [formal, setFormal] = useState('');
  const [message, setMessage] = useState('');

  const router = useRouter();
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const reloadUnitsList = async () => {
    const res = await secureFetch(`https://tally-lhy7.onrender.com/companies/${COMPANY_ID}/accounting/units`);
    if (res.ok) setUnits(await res.json());
  };

  useEffect(() => { reloadUnitsList(); }, []);

  useEffect(() => {
    inputsRef.current['symbol']?.focus();
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); router.push('/'); return; }
      const activeEl = document.activeElement;
      const activeKey = FIELD_ORDER.find(k => inputsRef.current[k] === activeEl);
      if (!activeKey) return;
      
      const idx = FIELD_ORDER.indexOf(activeKey);
      if (e.key === 'ArrowDown') { e.preventDefault(); inputsRef.current[FIELD_ORDER[(idx + 1) % FIELD_ORDER.length]]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); inputsRef.current[FIELD_ORDER[(idx - 1 + FIELD_ORDER.length) % FIELD_ORDER.length]]?.focus(); }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [router]);

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await secureFetch(`https://tally-lhy7.onrender.com/companies/${COMPANY_ID}/accounting/units`, {
        method: 'POST',
        body: JSON.stringify({ symbol: sym, formal_name: formal })
      });
      if (res.ok) {
        setMessage('Measurement node logged successfully.');
        setSym(''); setFormal(''); reloadUnitsList();
        inputsRef.current['symbol']?.focus();
      }
    } catch (err: any) { setMessage(err.message); }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none cursor-none antialiased">
      <div className="w-1/2 border border-slate-800 bg-slate-900/40 p-6 rounded-xl flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase font-mono border-b border-slate-800 pb-2">Create Unit of Measure (UoM)</h2>
          <form onSubmit={handleUnitSubmit} className="space-y-4 mt-6 max-w-xs font-mono text-xs">
            <div>
              <label className="block text-slate-500 mb-1 text-[10px]">UNIT SYMBOL (e.g., PCS, KG) [↑/↓]</label>
              <input ref={el => { inputsRef.current['symbol'] = el; }} type="text" value={sym} onChange={e => setSym(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded uppercase font-bold text-cyan-400 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 text-[10px]">FORMAL NAME (e.g., PIECES) [↑/↓]</label>
              <input ref={el => { inputsRef.current['formalName'] = el; }} type="text" value={formal} onChange={e => setFormal(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded uppercase text-white focus:outline-none" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-cyan-950 border border-slate-700 rounded font-bold uppercase tracking-wider">SAVE UNIT [ENTER]</button>
          </form>
        </div>
        {message && <p className="mt-4 font-mono text-[11px] text-yellow-400">{message}</p>}
      </div>

      <div className="w-1/2 border border-slate-800 bg-slate-900/20 p-6 rounded-xl ml-4 flex flex-col font-mono text-xs">
        <h3 className="text-slate-400 font-bold border-b border-slate-800 pb-2 mb-4 tracking-widest text-[10px]">REGISTERED UNITS OF MEASUREMENT</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {units.map((u: any) => (
            <div key={u.id} className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex justify-between">
              <span className="font-bold text-cyan-400 uppercase tracking-widest">{u.symbol}</span>
              <span className="text-slate-400 text-[11px] font-sans uppercase">{u.formal_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}