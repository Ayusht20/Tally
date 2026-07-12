'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '../api';

export default function AnalyticsDashboard() {
  const [viewType, setViewType] = useState('TRIAL'); // TRIAL or PL
  const [trialData, setTrialData] = useState({ debit_columns: [], credit_columns: [] });
  const [plData, setPlData] = useState({ 
    sales_turnover: 0, cost_of_goods: 0, 
    cash_sales: 0, credit_receivables: 0,
    cash_purchases: 0, credit_payables: 0,
    net_profit: 0 
  });
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const companyId = 1;

  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); router.push('/'); }
      if (e.key === '1') { e.preventDefault(); setViewType('TRIAL'); }
      if (e.key === '2') { e.preventDefault(); setViewType('PL'); }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [router]);

  useEffect(() => {
    const loadFinancialReports = async () => {
      try {
        const tbRes = await secureFetch(`https://tally-lhy7.onrender.com/companies/${companyId}/finance-reports/trial-balance`);
        const plRes = await secureFetch(`https://tally-lhy7.onrender.com/companies/${companyId}/finance-reports/profit-loss`);
        if (tbRes.ok) setTrialData(await tbRes.json());
        if (plRes.ok) setPlData(await plRes.json());
      } catch (err: any) {
        setMessage(`Data mapping error: ${err.message}`);
      }
    };
    loadFinancialReports();
  }, [viewType]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none cursor-none antialiased justify-center">
      <div className="w-full max-w-4xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 rounded-xl shadow-2xl flex flex-col justify-between">
        <div>
          <header className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <Link href="/" className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-500 px-2 py-1 rounded">
                ← [ESC] GATEWAY
              </Link>
              <h2 className="text-xl font-bold text-white mt-2">
                {viewType === 'TRIAL' ? 'Trial Balance Sheet Ledger' : 'Profit & Loss Statement (With Outstanding Diagnostics)'}
              </h2>
            </div>
            <div className="flex space-x-2 font-mono text-[10px]">
              <button onClick={() => setViewType('TRIAL')} className={`px-3 py-1.5 rounded border ${viewType === 'TRIAL' ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[1] TRIAL BALANCE</button>
              <button onClick={() => setViewType('PL')} className={`px-3 py-1.5 rounded border ${viewType === 'PL' ? 'bg-amber-950 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[2] PROFIT & LOSS</button>
            </div>
          </header>

          {viewType === 'TRIAL' ? (
            <div className="grid grid-cols-2 gap-6 font-mono text-xs">
              {/* Debit Column */}
              <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/40">
                <h3 className="text-cyan-400 font-bold border-b border-slate-800 pb-2 mb-3 tracking-widest text-[10px] uppercase">DEBIT ASSET BALANCES (Dr)</h3>
                <div className="space-y-2">
                  {trialData.debit_columns?.map((row: any, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-900/60 pb-1">
                      <span className="text-slate-300 uppercase">{row.ledger_name} <i className="text-[9px] text-slate-600">({row.group})</i></span>
                      <span className="text-white font-bold">₹{row.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credit Column */}
              <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/40">
                <h3 className="text-amber-400 font-bold border-b border-slate-800 pb-2 mb-3 tracking-widest text-[10px] uppercase">CREDIT LIABILITY BALANCES (Cr)</h3>
                <div className="space-y-2">
                  {trialData.credit_columns?.map((row: any, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-900/60 pb-1">
                      <span className="text-slate-300 uppercase">{row.ledger_name} <i className="text-[9px] text-slate-600">({row.group})</i></span>
                      <span className="text-white font-bold">₹{row.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto bg-slate-950 border border-slate-850 rounded-xl p-6 font-mono text-xs space-y-6">
              
              {/* SALES TRADING ACCOUNTS ROW ANALYSIS */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex justify-between text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <span>Gross Sales Turnover (+)</span>
                  <span className="text-emerald-400 text-sm">₹{plData.sales_turnover.toFixed(2)}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[11px]">
                  <div className="flex justify-between"><span>↳ Spot Cash Inflow Settlements:</span><span className="text-slate-300">₹{plData.cash_sales.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-cyan-500/90"><span>↳ Outstanding Book Receivables (Debtors):</span><span>To Collect ₹{plData.credit_receivables.toFixed(2)}</span></div>
                </div>
              </div>

              {/* PURCHASE TRADING ACCOUNTS ROW ANALYSIS */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex justify-between text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <span>Cost of Sourced Goods / Purchases (-)</span>
                  <span className="text-rose-400 text-sm">₹{plData.cost_of_goods.toFixed(2)}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[11px]">
                  <div className="flex justify-between"><span>↳ Direct Spot Cash Disbursed:</span><span className="text-slate-300">₹{plData.cash_purchases.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-rose-500/90"><span>↳ Outstanding Credit Payables (Creditors):</span><span>To Pay ₹{plData.credit_payables.toFixed(2)}</span></div>
                </div>
              </div>

              {/* ACCUMULATED BALANCING PROFILE */}
              <div className="flex justify-between pt-2 text-sm">
                <span className="text-white font-bold uppercase">Net Trading Profit:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded ${plData.net_profit >= 0 ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'}`}>
                  ₹{plData.net_profit.toFixed(2)}
                </span>
              </div>

            </div>
          )}
        </div>
        {message && <p className="mt-4 p-2 bg-slate-950 text-center text-red-400 font-mono text-[10px] rounded">{message}</p>}
      </div>
    </div>
  );
}