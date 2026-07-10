'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '../api';

const FIELD_ORDER = ['name', 'sku', 'hsnCode', 'purchasePrice', 'sellingPrice', 'openingQty', 'unitId'];
const COMPANY_ID = 1; 

interface UnitOption {
  id: number;
  formal_name: string;
  symbol: string;
}

interface StockItemDisplay {
  id: number;
  name: string;
  sku: string;
  hsn_code: string;
  purchase_price: number;
  selling_price: number;
  current_qty: number;
  unit?: { symbol: string };
}

export default function StockMasterConsole() {
  const [items, setItems] = useState<StockItemDisplay[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  
  // Form Field States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [openingQty, setOpeningQty] = useState('');
  const [unitId, setUnitId] = useState('');

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const router = useRouter();
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  const fetchInventoryState = async () => {
    try {
      const sRes = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/stock`);
      if (sRes.ok) setItems(await sRes.json());
      
      const uRes = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/units`);
      if (uRes.ok) setUnits(await uRes.json());
    } catch (err: any) {
      setMessage(`Warehouse Link Failure: ${err.message}`);
    }
  };

  useEffect(() => {
    document.body.style.setProperty('cursor', 'none', 'important');
    fetchInventoryState();
    setTimeout(() => { inputsRef.current['name']?.focus(); }, 150);
    return () => { document.body.style.cursor = 'default'; };
  }, []);

  useEffect(() => {
    const handleStockShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/');
        return;
      }

      const activeEl = document.activeElement;
      const activeKey = FIELD_ORDER.find(key => inputsRef.current[key] === activeEl);
      if (!activeKey) return;

      const idx = FIELD_ORDER.indexOf(activeKey);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        inputsRef.current[FIELD_ORDER[(idx + 1) % FIELD_ORDER.length]]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        inputsRef.current[FIELD_ORDER[(idx - 1 + FIELD_ORDER.length) % FIELD_ORDER.length]]?.focus();
      }
    };

    window.addEventListener('keydown', handleStockShortcuts);
    return () => window.removeEventListener('keydown', handleStockShortcuts);
  }, [router]);

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const res = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/stock`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.toUpperCase(),
          sku: sku.toUpperCase(),
          hsn_code: hsnCode,
          purchase_price: parseFloat(purchasePrice),
          selling_price: parseFloat(sellingPrice),
          opening_qty: parseInt(openingQty) || 0,
          unit_id: unitId ? intParse(unitId) : null
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        throw new Error(data.detail || "Profile integrity violation error.");
      }

      setIsError(false);
      setMessage(`Success! Created Master Ledger Item asset: ${name.toUpperCase()}`);
      setName(''); setSku(''); setHsnCode(''); setPurchasePrice(''); setSellingPrice(''); setOpeningQty(''); setUnitId('');
      fetchInventoryState();
      inputsRef.current['name']?.focus();
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  const intParse = (val: string) => parseInt(val);
  const blockMouseClick = (e: React.MouseEvent) => { e.preventDefault(); };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none antialiased justify-center items-center !cursor-none">
      <style dangerouslySetInnerHTML={{__html: `* { cursor: none !important; }`}} />
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 pointer-events-none">
        
        {/* LEFT COLUMN: MANAGEMENT ENGINE PROFILE CREATION ENTRY */}
        <div className="border border-slate-800/80 p-6 bg-slate-900/40 backdrop-blur-md rounded-xl font-mono text-xs shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded font-medium">← GATEWAY [ESC]</span>
            <span className="px-3 py-1 rounded text-[10px] font-extrabold tracking-widest border border-cyan-800 bg-cyan-950/40 text-cyan-400">STOCK PROFILE REGISTRY</span>
          </div>

          <form onSubmit={handleCreateStock} className="space-y-3.5">
            <div>
              <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">ITEM / MATERIAL NAME [UP/DOWN]</label>
              <input ref={el => { inputsRef.current['name'] = el; }} onMouseDown={blockMouseClick} type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-white font-bold focus:outline-none focus:border-cyan-500 transition-all" required suppressHydrationWarning />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">SKU SERIAL BARCODE [UP/DOWN]</label>
              <input ref={el => { inputsRef.current['sku'] = el; }} onMouseDown={blockMouseClick} type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none focus:border-cyan-500 transition-all" required suppressHydrationWarning />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">HSN CODE [UP/DOWN]</label>
              <input ref={el => { inputsRef.current['hsnCode'] = el; }} onMouseDown={blockMouseClick} type="text" value={hsnCode} onChange={e => setHsnCode(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none focus:border-cyan-500 transition-all" suppressHydrationWarning />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">PURCHASE RATE [UP/DOWN]</label>
                <input ref={el => { inputsRef.current['purchasePrice'] = el; }} onMouseDown={blockMouseClick} type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-emerald-400 font-bold focus:outline-none focus:border-cyan-500 transition-all" placeholder="₹0.00" min="0.00" step="0.01" required suppressHydrationWarning />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">SELLING RATE [UP/DOWN]</label>
                <input ref={el => { inputsRef.current['sellingPrice'] = el; }} onMouseDown={blockMouseClick} type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 transition-all" placeholder="₹0.00" min="0.00" step="0.01" required suppressHydrationWarning />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">OPENING QUANTITY [UP/DOWN]</label>
                <input ref={el => { inputsRef.current['openingQty'] = el; }} onMouseDown={blockMouseClick} type="number" value={openingQty} onChange={e => setOpeningQty(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-white text-center focus:outline-none focus:border-cyan-500 transition-all" placeholder="0" min="0" required suppressHydrationWarning />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-[10px] tracking-wider uppercase">UNIT OF MEASURE (UOM) [UP/DOWN]</label>
                <select ref={el => { inputsRef.current['unitId'] = el; }} onMouseDown={blockMouseClick} value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-yellow-500 font-bold focus:outline-none focus:border-cyan-500 transition-all" suppressHydrationWarning>
                  <option value="">-- SELECT UNIT --</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.formal_name} ({u.symbol})</option>)}
                </select>
              </div>
            </div>

            <button type="submit" onMouseDown={blockMouseClick} className="w-full py-3 mt-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-lg tracking-widest uppercase text-center hover:bg-slate-850 transition-all" suppressHydrationWarning>
              SAVE STOCK PROFILE [ENTER]
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 text-center font-bold border rounded-lg transition-all duration-300 ${
              isError ? 'bg-rose-950/40 border-rose-900/60 text-rose-400' : 'bg-emerald-950/30 border-emerald-900/60 text-yellow-400'
            }`}>{message}</div>
          )}
        </div>

        {/* RIGHT COLUMN: RUNNING WAREHOUSE LEDGER BALANCE CARDS */}
        <div className="border border-slate-800/80 p-6 bg-slate-900/40 backdrop-blur-md rounded-xl font-mono text-xs shadow-2xl flex flex-col h-[520px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800 pb-3 mb-4">CURRENT INVENTORY RECORD BALANCES</span>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {items.map((item) => (
              <div key={item.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex justify-between items-center transition-all">
                <div>
                  <span className="block text-white font-extrabold tracking-wide text-[13px]">{item.name}</span>
                  <div className="flex space-x-2 text-[10px] text-slate-500 mt-1">
                    <span>SKU: <b className="text-slate-400">{item.sku}</b></span>
                    <span>|</span>
                    <span>MRP: <b className="text-emerald-400">₹{item.selling_price}</b></span>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border ${
                  item.current_qty < 0 
                    ? 'bg-rose-950/30 border-rose-900/50 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]' 
                    : 'bg-cyan-950/30 border-cyan-900/50 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                }`}>
                  {item.current_qty} {item.unit?.symbol || 'NOS'}
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center text-slate-600 py-12 text-[10px] uppercase tracking-widest">No material ledger assets found.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}