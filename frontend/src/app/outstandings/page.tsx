'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '../api';

interface OutstandingRow {
  ledger_id: number;
  party_name: string;
  amount_due: number;
  status: string;
}

export default function OutstandingStatements() {
  const [viewMode, setViewMode] = useState('PAYABLES'); // PAYABLES or RECEIVABLES
  const [payables, setPayables] = useState<OutstandingRow[]>([]);
  const [receivables, setReceivables] = useState<OutstandingRow[]>([]);
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const companyId = 1;

  useEffect(() => {
    const handleKeyboardInputs = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); router.push('/'); }
      if (e.key === '1') { e.preventDefault(); setViewMode('PAYABLES'); }
      if (e.key === '2') { e.preventDefault(); setViewMode('RECEIVABLES'); }
    };
    window.addEventListener('keydown', handleKeyboardInputs);
    return () => window.removeEventListener('keydown', handleKeyboardInputs);
  }, [router]);

  useEffect(() => {
    const fetchOutstandingMatrix = async () => {
      try {
        const res = await secureFetch(`http://127.0.0.1:8000/companies/${companyId}/finance-reports/outstandings`);
        if (res.ok) {
          const data = await res.json();
          setPayables(data.outstanding_payables);
          setReceivables(data.outstanding_receivables);
        }
      } catch (err: any) {
        setMessage(`Data sync failure: ${err.message}`);
      }
    };
    fetchOutstandingMatrix();
  }, [viewMode]);

  const activeList = viewMode === 'PAYABLES' ? payables : receivables;
  const aggregatedTotal = activeList.reduce((acc, curr) => acc + curr.amount_due, 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none cursor-none antialiased justify-center">
      <div className="w-full max-w-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 rounded-xl shadow-2xl flex flex-col justify-between">
        <div>
          <header className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <Link href="/" className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-500 px-2 py-1 rounded">
                ← [ESC] GATEWAY OF SMART_ERP
              </Link>
              <h2 className="text-xl font-bold text-white mt-2">
                {viewMode === 'PAYABLES' ? 'Outstanding Payables Ledger (Creditors)' : 'Outstanding Receivables Ledger (Debtors)'}
              </h2>
            </div>
            
            <div className="flex space-x-2 font-mono text-[10px]">
              <button onClick={() => setViewMode('PAYABLES')} className={`px-3 py-1.5 rounded border ${viewMode === 'PAYABLES' ? 'bg-rose-950/40 border-rose-800 text-rose-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[1] OUTSTANDING PAYABLES</button>
              <button onClick={() => setViewMode('RECEIVABLES')} className={`px-3 py-1.5 rounded border ${viewMode === 'RECEIVABLES' ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[2] OUTSTANDING RECEIVABLES</button>
            </div>
          </header>

          {/* Table Data Matrix */}
          <div className="overflow-hidden border border-slate-850 rounded-lg bg-slate-950/40 font-mono text-xs">
            <div className="bg-slate-950 text-slate-400 px-4 py-2.5 border-b border-slate-850 flex justify-between text-[10px] tracking-wider font-bold">
              <span>PARTY NAME DESCRIPTION</span>
              <span className="text-right">PENDING AMOUNT (INR)</span>
            </div>
            
            <div className="divide-y divide-slate-900/60 max-h-[380px] overflow-y-auto">
              {activeList.length === 0 ? (
                <p className="p-8 text-center text-slate-600 italic">Clear slate! No pending matching entries recorded.</p>
              ) : (
                activeList.map((row) => (
                  <div key={row.ledger_id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-900/40 transition">
                    <span className="uppercase text-slate-200 font-sans tracking-wide font-medium">{row.party_name}</span>
                    <span className={`font-bold ${viewMode === 'PAYABLES' ? 'text-rose-400' : 'text-cyan-400'}`}>
                      ₹{row.amount_due.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            {/* Column Summary Aggregation Bar */}
            <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-850 flex justify-between font-bold text-white">
              <span className="uppercase tracking-widest text-[10px] text-slate-400">Total Pending Volume:</span>
              <span className={viewMode === 'PAYABLES' ? 'text-rose-400' : 'text-cyan-400'}>₹{aggregatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {message && <p className="mt-4 p-2 bg-slate-950 text-center text-red-400 font-mono text-[10px] rounded">{message}</p>}
      </div>
    </div>
  );
}