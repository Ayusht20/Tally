'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '../api';

const FIELD_ORDER = ['voucherNumber', 'drLedger', 'crLedger', 'amount', 'narration'];
const COMPANY_ID = 1;

export default function AdvancedAccountingVouchers() {
  const [vType, setVType] = useState('PAYMENT'); // CONTRA, PAYMENT, RECEIPT, JOURNAL
  const [vNum, setVNum] = useState('VCH-9001');
  const [ledgers, setLedgers] = useState([]);
  const [drId, setDrId] = useState('');
  const [crId, setCrId] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [message, setMessage] = useState('');

  const router = useRouter();
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null }>({});

  useEffect(() => {
    const fetchLedgerDropdowns = async () => {
      const res = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/ledgers/`);
      if (res.ok) setLedgers(await res.json());
    };
    fetchLedgerDropdowns();
  }, []);

  useEffect(() => {
    setTimeout(() => { inputsRef.current['voucherNumber']?.focus(); }, 100);

    const handleVoucherHotkeys = (e: KeyboardEvent) => {
      if (e.key === 'F4') { e.preventDefault(); setVType('CONTRA'); }
      if (e.key === 'F5') { e.preventDefault(); setVType('PAYMENT'); }
      if (e.key === 'F6') { e.preventDefault(); setVType('RECEIPT'); }
      if (e.key === 'F7') { e.preventDefault(); setVType('JOURNAL'); }
      if (e.key === 'Escape') { e.preventDefault(); router.push('/'); return; }

      const activeEl = document.activeElement;
      const activeKey = FIELD_ORDER.find(key => inputsRef.current[key] === activeEl);
      if (!activeKey) return;

      const activeIdx = FIELD_ORDER.indexOf(activeKey);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (activeIdx + 1) % FIELD_ORDER.length;
        inputsRef.current[FIELD_ORDER[nextIdx]]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (activeIdx - 1 + FIELD_ORDER.length) % FIELD_ORDER.length;
        inputsRef.current[FIELD_ORDER[prevIdx]]?.focus();
      }
    };

    window.addEventListener('keydown', handleVoucherHotkeys);
    return () => window.removeEventListener('keydown', handleVoucherHotkeys);
  }, [router]);

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/accounting/vouchers`, {
        method: 'POST',
        body: JSON.stringify({
          voucher_type: vType,
          voucher_number: vNum,
          dr_ledger_id: parseInt(drId),
          cr_ledger_id: parseInt(crId),
          amount: parseFloat(amount),
          narration: narration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Double-entry accounting error.");
      
      setMessage(`Posted successfully! Voucher tracked under: ${vNum}`);
      setVNum('VCH-' + Math.floor(1000 + Math.random() * 9000));
      setDrId(''); setCrId(''); setAmount(''); setNarration('');
      inputsRef.current['voucherNumber']?.focus();
    } catch (err: any) {
      setMessage(`ERROR: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none cursor-none antialiased justify-center items-center">
      <div className="w-full max-w-xl border border-slate-800 p-6 bg-slate-900/40 backdrop-blur-md rounded-xl font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Financial Vouchers Hub</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 font-bold uppercase tracking-widest">{vType} MODE</span>
        </div>

        {/* Hotkey HUD */}
        <div className="grid grid-cols-4 gap-1 mb-4 text-center text-[9px] text-slate-500 font-bold">
          <div className={vType === 'CONTRA' ? 'text-cyan-400 bg-slate-950 p-1 rounded' : ''}>[F4] CONTRA</div>
          <div className={vType === 'PAYMENT' ? 'text-cyan-400 bg-slate-950 p-1 rounded' : ''}>[F5] PAYMENT</div>
          <div className={vType === 'RECEIPT' ? 'text-cyan-400 bg-slate-950 p-1 rounded' : ''}>[F6] RECEIPT</div>
          <div className={vType === 'JOURNAL' ? 'text-cyan-400 bg-slate-950 p-1 rounded' : ''}>[F7] JOURNAL</div>
        </div>

        <form onSubmit={handleSubmitVoucher} className="space-y-4">
          <div>
            <label className="block text-slate-500 mb-1 text-[10px]">VOUCHER REFERENCE NUMBER [↑/↓]</label>
            <input ref={(el) => { inputsRef.current['voucherNumber'] = el; }} type="text" value={vNum} onChange={(e) => setVNum(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:border-cyan-500 text-white font-bold" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 text-[10px]">DEBIT ACCOUNT (DR) [↑/↓]</label>
              <select ref={(el) => { inputsRef.current['drLedger'] = el; }} value={drId} onChange={(e) => setDrId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-cyan-400 font-bold focus:outline-none" required>
                <option value="">-- CHOOSE --</option>
                {ledgers.map((l: any) => <option key={l.id} value={l.id}>{l.name} ({l.group_type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 text-[10px]">CREDIT ACCOUNT (CR) [↑/↓]</label>
              <select ref={(el) => { inputsRef.current['crLedger'] = el; }} value={crId} onChange={(e) => setCrId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-rose-400 font-bold focus:outline-none" required>
                <option value="">-- CHOOSE --</option>
                {ledgers.map((l: any) => <option key={l.id} value={l.id}>{l.name} ({l.group_type})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 text-[10px]">TRANSACTION VOLUME AMOUNT (INR) [↑/↓]</label>
            <input ref={(el) => { inputsRef.current['amount'] = el; }} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-sm text-white font-bold tracking-wide focus:outline-none" min="1" placeholder="₹0.00" required />
          </div>

          <div>
            <label className="block text-slate-500 mb-1 text-[10px]">NARRATION DETAIL SUMMARY [↑/↓]</label>
            <textarea ref={(el) => { inputsRef.current['narration'] = el; }} value={narration} onChange={(e) => setNarration(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none h-16 resize-none" placeholder="Enter voucher narration notes..."/>
          </div>

          <button type="submit" className="w-full py-3 bg-slate-850 border border-slate-700 font-bold text-center rounded-lg hover:bg-cyan-950 transition tracking-widest uppercase">
            POST DOUBLE ENTRY [ENTER]
          </button>
        </form>
        {message && <div className="mt-4 p-2 bg-slate-950 text-center text-yellow-400 font-bold rounded-md border border-slate-850">{message}</div>}
      </div>
    </div>
  );
}