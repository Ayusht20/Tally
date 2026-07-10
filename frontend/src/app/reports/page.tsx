'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '../api';

interface VoucherRecord {
  id: number;
  voucher_type: string;
  voucher_number: string;
  party_name: string;
  payment_mode: string;
  cgst: number;
  sgst: number;
  total_amount: number;
  date: string;
}

interface SummaryData {
  cash_turnover: number;
  outstanding_receivables: number;
  outstanding_payables: number;
  total_gst: number;
}

export default function DaybookReports() {
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ 
    cash_turnover: 0, 
    outstanding_receivables: 0, 
    outstanding_payables: 0, 
    total_gst: 0 
  });
  const [filterMode, setFilterMode] = useState('ALL'); 
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const companyId = 1;

  useEffect(() => {
    const handleReportHotkeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); router.push('/'); }
      if (e.key === '1') { e.preventDefault(); setFilterMode('ALL'); }
      if (e.key === '2') { e.preventDefault(); setFilterMode('CASH'); }
      if (e.key === '3') { e.preventDefault(); setFilterMode('CREDIT'); }
      if (e.key === '4') { e.preventDefault(); setFilterMode('GST'); }
    };
    window.addEventListener('keydown', handleReportHotkeys);
    return () => window.removeEventListener('keydown', handleReportHotkeys);
  }, [router]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await secureFetch(`http://127.0.0.1:8000/companies/${companyId}/vouchers/`);
        if (res.ok) {
          const data = await res.json();
          setVouchers(data.vouchers || []);
          setSummary(data.summary);
        }
      } catch (err: any) {
        setMessage(`Reporting link dropped: ${err.message}`);
      }
    };
    fetchReports();
  }, []);

  // SECURE BLOB DOWNLOAD GENERATOR: Requests PDF file bytes with custom injected auth headers
  const handleSecurePdfExport = async () => {
    if (exporting) return;
    setExporting(true);
    setMessage('Assembling vector printable PDF layout records...');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const response = await fetch(`http://127.0.0.1:8000/companies/${companyId}/accounting/export/pdf`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Session timed out. Please log in again.");
        throw new Error("Server failed to generate document stream.");
      }

      // Convert raw response into an executable binary stream blob
      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      
      const tempLink = document.createElement('a');
      tempLink.href = fileUrl;
      tempLink.setAttribute('download', `SmartERP_Statement_Company_${companyId}.pdf`);
      document.body.appendChild(tempLink);
      
      tempLink.click(); // Auto execute save dialog inside browser frame 
      
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(fileUrl);
      setMessage('PDF Statement saved safely to downloads!');
    } catch (err: any) {
      setMessage(`Export Refusal: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const filteredData = vouchers.filter(v => {
    if (filterMode === 'CASH') return v.payment_mode === 'CASH';
    if (filterMode === 'CREDIT') return v.payment_mode === 'CREDIT';
    return true; 
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none cursor-none antialiased">
      <div className="w-full border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 rounded-xl shadow-2xl flex flex-col justify-between">
        <div>
          <header className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center">
            <div>
              <Link href="/" className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-500 px-2 py-1 rounded">
                ← [ESC] GATEWAY OF SMART_ERP
              </Link>
              <h2 className="text-xl font-bold text-white mt-2">Daybook Statements & Tax Auditing Registry</h2>
            </div>
            
            {/* Control Panel Filter & PDF Action Matrix */}
            <div className="flex space-x-1 font-mono text-[10px] items-center">
              <button onClick={() => setFilterMode('ALL')} className={`px-2 py-1 rounded border ${filterMode === 'ALL' ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[1] ALL RECORDS</button>
              <button onClick={() => setFilterMode('CASH')} className={`px-2 py-1 rounded border ${filterMode === 'CASH' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[2] CASH ONLY</button>
              <button onClick={() => setFilterMode('CREDIT')} className={`px-2 py-1 rounded border ${filterMode === 'CREDIT' ? 'bg-blue-950 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[3] CREDIT ACCOUNTS</button>
              <button onClick={() => setFilterMode('GST')} className={`px-2 py-1 rounded border ${filterMode === 'GST' ? 'bg-amber-950 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>[4] TAX REGISTRIES</button>
              
              <div className="w-px h-4 bg-slate-800 mx-1" />
              
              {/* Secure Direct PDF Download Execution Link */}
              <button 
                onClick={handleSecurePdfExport}
                disabled={exporting}
                className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-cyan-400 border border-cyan-800/40 font-bold rounded flex items-center transition disabled:opacity-50 font-mono text-[10px]"
              >
                {exporting ? 'GENERATING...' : 'DOWNLOAD STATEMENT PDF [📥]'}
              </button>
            </div>
          </header>

          {/* Core Balance Summary Sheets Grid */}
          <div className="grid grid-cols-4 gap-4 font-mono mb-6">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 uppercase">Cash Flow Volume</span>
              <p className="text-base font-bold text-emerald-400 mt-1">₹{summary.cash_turnover.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 uppercase">Receivables (Debtors)</span>
              <p className="text-base font-bold text-cyan-400 mt-1">₹{summary.outstanding_receivables.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 uppercase">Payables (Creditors)</span>
              <p className="text-base font-bold text-rose-400 mt-1">₹{summary.outstanding_payables.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 uppercase">GST Tax Liability</span>
              <p className="text-base font-bold text-amber-400 mt-1">₹{summary.total_gst.toFixed(2)}</p>
            </div>
          </div>

          {/* Audit Logging Registry Table */}
          <div className="overflow-x-auto border border-slate-850 rounded-lg bg-slate-950/40">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[10px] tracking-wider">
                  <th className="p-3">DATE</th>
                  <th className="p-3">REF NUMBER</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3">PARTY LEDGER ACCOUNT</th>
                  <th className="p-3">MODE</th>
                  {filterMode === 'GST' && (
                    <>
                      <th className="p-3 text-right">CGST (9%)</th>
                      <th className="p-3 text-right">SGST (9%)</th>
                    </>
                  )}
                  <th className="p-3 text-right">FINAL INVOICE AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={filterMode === 'GST' ? 8 : 6} className="p-4 text-center text-slate-600 italic">No matching transaction logs found.</td></tr>
                ) : (
                  filteredData.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/60 transition text-slate-300">
                      <td className="p-3 text-slate-500">{v.date}</td>
                      <td className="p-3 font-bold text-white">{v.voucher_number}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${v.voucher_type === 'SALES' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>{v.voucher_type}</span>
                      </td>
                      <td className="p-3 uppercase font-sans text-slate-200">{v.party_name}</td>
                      <td className="p-3">
                        <span className={`font-bold ${v.payment_mode === 'CASH' ? 'text-emerald-400' : 'text-blue-400'}`}>{v.payment_mode}</span>
                      </td>
                      {filterMode === 'GST' && (
                        <>
                          <td className="p-3 text-right text-amber-500/80">₹{v.cgst.toFixed(2)}</td>
                          <td className="p-3 text-right text-amber-500/80">₹{v.sgst.toFixed(2)}</td>
                        </>
                      )}
                      <td className="p-3 text-right font-bold text-white">₹{v.total_amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {message && <p className="mt-4 p-2 bg-slate-950 text-center text-yellow-400 font-mono text-[10px] rounded border border-slate-850 shadow-md">{message}</p>}
      </div>
    </div>
  );
}
