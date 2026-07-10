'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '../api';

const FIELD_ORDER_ACC = ['drLedger', 'crLedger', 'amount', 'narration'];
// 🌟 UPDATED SEQUENCE: Injected 'payModeSelect' right before narration block
const FIELD_ORDER_INV = ['partyLedger', 'itemSelect', 'quantity', 'rate', 'discount', 'payModeSelect', 'narration'];
const COMPANY_ID = 1;

interface LedgerOption { id: number; name: string; group_type: string; }
interface StockOption { id: number; name: string; current_qty: number; purchase_price: number; selling_price: number; }
interface FrontendItemLine { stock_item_id: number; name: string; quantity: number; rate: number; discount_percentage: number; }

export default function UnifiedVoucherConsole() {
  const [vType, setVType] = useState('PAYMENT'); // CONTRA, PAYMENT, RECEIPT, JOURNAL, SALES, PURCHASE
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const [ledgers, setLedgers] = useState<LedgerOption[]>([]);
  const [stockItems, setStockItems] = useState<StockOption[]>([]);
  
  // Accounting Form States
  const [drId, setDrId] = useState('');
  const [crId, setCrId] = useState('');
  const [amount, setAmount] = useState('');
  
  // Inventory Form States
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [itemDiscount, setItemDiscount] = useState(''); 
  const [paymentMode, setPaymentMode] = useState('CREDIT'); // 🌟 NEW State Hook
  const [invoiceItems, setInvoiceItems] = useState<FrontendItemLine[]>([]);

  const [narration, setNarration] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const router = useRouter();
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null }>({});

  const isInventoryMode = vType === 'SALES' || vType === 'PURCHASE';
  const currentFields = isInventoryMode ? FIELD_ORDER_INV : FIELD_ORDER_ACC;

  useEffect(() => {
    document.body.style.setProperty('cursor', 'none', 'important');
    const fetchCoreData = async () => {
      try {
        const lRes = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/ledgers`);
        if (lRes.ok) setLedgers(await lRes.json());
        
        const sRes = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/stock`);
        if (sRes.ok) setStockItems(await sRes.json());
      } catch (err: any) {
        setMessage(`Data Link Failure: ${err.message}`);
      }
    };
    fetchCoreData();
    setTimeout(() => { inputsRef.current[currentFields[0]]?.focus(); }, 150);
    return () => { document.body.style.cursor = 'default'; };
  }, [vType]);

  useEffect(() => {
    const handleAccountingShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F4') { e.preventDefault(); setVType('CONTRA'); resetForm(); }
      if (e.key === 'F5') { e.preventDefault(); setVType('PAYMENT'); resetForm(); }
      if (e.key === 'F6') { e.preventDefault(); setVType('RECEIPT'); resetForm(); }
      if (e.key === 'F7') { e.preventDefault(); setVType('JOURNAL'); resetForm(); }
      if (e.key === 'F8') { e.preventDefault(); setVType('SALES'); resetForm(); }
      if (e.key === 'F9') { e.preventDefault(); setVType('PURCHASE'); resetForm(); }
      if (e.key === 'Escape') { e.preventDefault(); router.push('/'); return; }

      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (lastSavedId) {
          window.open(`http://127.0.0.1:8000/companies/${COMPANY_ID}/accounting/vouchers/${lastSavedId}/download`, '_blank');
        } else {
          setIsError(true);
          setMessage("No active voucher record generated to print.");
        }
        return;
      }

      const activeEl = document.activeElement;
      const activeKey = currentFields.find(key => inputsRef.current[key] === activeEl);
      if (!activeKey) return;

      const idx = currentFields.indexOf(activeKey);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        inputsRef.current[currentFields[(idx + 1) % currentFields.length]]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        inputsRef.current[currentFields[(idx - 1 + currentFields.length) % currentFields.length]]?.focus();
      }
    };

    window.addEventListener('keydown', handleAccountingShortcuts);
    return () => window.removeEventListener('keydown', handleAccountingShortcuts);
  }, [router, lastSavedId, vType, currentFields]);

  const resetForm = () => {
    setDrId(''); setCrId(''); setAmount(''); setInvoiceItems([]);
    setSelectedItemId(''); setItemQty(''); setItemRate(''); setItemDiscount(''); setPaymentMode('CREDIT'); setNarration(''); setMessage('');
  };

  const handleAddItemLine = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedItemId && itemQty && itemRate) {
      e.preventDefault();
      const targetStock = stockItems.find(i => i.id === parseInt(selectedItemId));
      if (!targetStock) return;

      setInvoiceItems([...invoiceItems, {
        stock_item_id: targetStock.id,
        name: targetStock.name,
        quantity: parseInt(itemQty),
        rate: parseFloat(itemRate),
        discount_percentage: parseFloat(itemDiscount) || 0.0
      }]);
      setSelectedItemId(''); setItemQty(''); setItemRate(''); setItemDiscount('');
      inputsRef.current['itemSelect']?.focus();
    }
  };

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setIsError(false);

    let finalItems = [...invoiceItems];
    if (selectedItemId && itemQty && itemRate) {
      const targetStock = stockItems.find(i => i.id === parseInt(selectedItemId));
      if (targetStock) {
        finalItems.push({
          stock_item_id: targetStock.id,
          name: targetStock.name,
          quantity: parseInt(itemQty),
          rate: parseFloat(itemRate),
          discount_percentage: parseFloat(itemDiscount) || 0.0
        });
      }
    }

    if (isInventoryMode && finalItems.length === 0) {
      setIsError(true);
      setMessage("Inventory Fault: Sales or Purchase entries require tracking line items.");
      return;
    }

    const bodyPayload: any = { voucher_type: vType, narration };

    if (isInventoryMode) {
      bodyPayload.items = finalItems;
      bodyPayload.payment_mode = paymentMode;
      if (vType === 'SALES') bodyPayload.dr_ledger_id = parseInt(drId);
      if (vType === 'PURCHASE') bodyPayload.cr_ledger_id = parseInt(crId);
    } else {
      bodyPayload.amount = parseFloat(amount);
      bodyPayload.dr_ledger_id = parseInt(drId);
      bodyPayload.cr_ledger_id = parseInt(crId);
    }

    try {
      const res = await secureFetch(`http://127.0.0.1:8000/companies/${COMPANY_ID}/accounting/vouchers`, {
        method: 'POST',
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (!res.ok) { setIsError(true); throw new Error(data.detail || "Transaction submission failure."); }
      
      setIsError(false);
      setLastSavedId(data.voucher_id);
      setMessage(`Success! Posted ${vType} Invoice under ${data.voucher_number}. [ALT+D] TO PRINT RECEIPT.`);
      resetForm();
    } catch (err: any) {
      setIsError(true); setMessage(err.message);
    }
  };

  const blockMouseClick = (e: React.MouseEvent) => { e.preventDefault(); };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans p-8 select-none antialiased justify-center items-center !cursor-none">
      <style dangerouslySetInnerHTML={{__html: `* { cursor: none !important; }`}} />
      
      <div className="w-full max-w-xl border border-slate-800/80 p-6 bg-slate-900/40 backdrop-blur-md rounded-xl font-mono text-xs shadow-2xl transition-all duration-300 pointer-events-none">
        
        {/* HUD Navigation Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded font-medium">← GATEWAY [ESC]</span>
          <span className={`px-3 py-1 rounded text-[10px] font-extrabold tracking-widest border transition-all duration-300 ${
            isInventoryMode ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>{vType} INVOICE MODE</span>
        </div>

        {/* Dynamic Shortcut Key ribbon */}
        <div className="grid grid-cols-6 gap-0.5 mb-5 text-center text-[8px] font-bold">
          <div className={`p-1.5 rounded border ${vType === 'CONTRA' ? 'bg-blue-950/50 text-blue-400 border-blue-900' : 'bg-slate-950 text-slate-600 border-transparent'}`}>F4 CON</div>
          <div className={`p-1.5 rounded border ${vType === 'PAYMENT' ? 'bg-rose-950/50 text-rose-400 border-rose-900' : 'bg-slate-950 text-slate-600 border-transparent'}`}>F5 PAY</div>
          <div className={`p-1.5 rounded border ${vType === 'RECEIPT' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900' : 'bg-slate-950 text-slate-600 border-transparent'}`}>F6 REC</div>
          <div className={`p-1.5 rounded border ${vType === 'JOURNAL' ? 'bg-amber-950/50 text-amber-400 border-amber-800 shadow-inner font-extrabold' : 'bg-slate-950 text-slate-600 border-transparent'}`}>F7 JOU</div>
          <div className={`p-1.5 rounded border ${vType === 'SALES' ? 'bg-cyan-950/50 text-cyan-400 border-cyan-900' : 'bg-slate-950 text-slate-600 border-transparent'}`}>F8 SAL</div>
          <div className={`p-1.5 rounded border ${vType === 'PURCHASE' ? 'bg-indigo-950/50 text-indigo-400 border-indigo-900' : 'bg-slate-950 text-slate-600 border-transparent'}`}>F9 PUR</div>
        </div>

        <form onSubmit={handleSubmitVoucher} className="space-y-4">
          <div>
            <label className="block text-slate-500 mb-1.5 text-[10px] tracking-wider uppercase">VOUCHER AUTO SEQUENCE ID</label>
            <div className="w-full p-2.5 bg-slate-950 border border-slate-900 rounded text-slate-500 font-bold tracking-widest bg-opacity-40">
              ({vType.substring(0, 3).toUpperCase()}-AUTO-INCREMENT)
            </div>
          </div>

          {!isInventoryMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1.5 text-[10px] tracking-wider uppercase">DEBIT ACCOUNT (DR) [UP/DOWN]</label>
                <select ref={el => { inputsRef.current['drLedger'] = el; }} onMouseDown={blockMouseClick} value={drId} onChange={e => setDrId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded text-cyan-400 font-bold focus:outline-none focus:border-cyan-500" required suppressHydrationWarning>
                  <option value="">-- SELECT DR --</option>
                  {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_type})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1.5 text-[10px] tracking-wider uppercase">CREDIT ACCOUNT (CR) [UP/DOWN]</label>
                <select ref={el => { inputsRef.current['crLedger'] = el; }} onMouseDown={blockMouseClick} value={crId} onChange={e => setCrId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded text-rose-400 font-bold focus:outline-none focus:border-cyan-500" required suppressHydrationWarning>
                  <option value="">-- SELECT CR --</option>
                  {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_type})</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-500 mb-1.5 text-[10px] tracking-wider uppercase">{vType === 'SALES' ? 'DEBIT CUSTOMER PARTY' : 'CREDIT SUPPLIER PARTY'} [UP/DOWN]</label>
              <select ref={el => { inputsRef.current['partyLedger'] = el; }} onMouseDown={blockMouseClick} value={vType === 'SALES' ? drId : crId} onChange={e => vType === 'SALES' ? setDrId(e.target.value) : setCrId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded text-yellow-400 font-bold focus:outline-none focus:border-cyan-500" required suppressHydrationWarning>
                <option value="">-- SELECT PARTY ACCOUNT --</option>
                {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.group_type})</option>)}
              </select>
            </div>
          )}

          {!isInventoryMode ? (
            <div>
              <label className="block text-slate-500 mb-1.5 text-[10px] tracking-wider uppercase">TRANSACTION AMOUNT VOLUME (INR) [UP/DOWN]</label>
              <input ref={el => { inputsRef.current['amount'] = el; }} onMouseDown={blockMouseClick} type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded text-emerald-400 font-extrabold text-sm focus:outline-none focus:border-cyan-500" placeholder="₹0.00" min="0.01" step="0.01" required suppressHydrationWarning />
            </div>
          ) : (
            <div className="space-y-3 border-t border-b border-slate-900 py-3 my-2">
              <span className="block text-slate-400 text-[9px] font-extrabold tracking-widest uppercase">Inventory Line Items [ENTER to Append Line]</span>
              
              <div className="grid grid-cols-4 gap-1.5">
                <select 
                  ref={el => { inputsRef.current['itemSelect'] = el; }} 
                  onMouseDown={blockMouseClick} 
                  value={selectedItemId} 
                  onChange={e => {
                    const targetId = e.target.value;
                    setSelectedItemId(targetId);
                    const matchedStock = stockItems.find(i => i.id === parseInt(targetId));
                    if (matchedStock) {
                      const automaticPrice = vType === 'SALES' ? matchedStock.selling_price : matchedStock.purchase_price;
                      setItemRate(automaticPrice.toString());
                    } else {
                      setItemRate('');
                    }
                  }} 
                  className="p-2 bg-slate-950 border border-slate-850 rounded text-slate-300 max-w-full text-[11px]" 
                  suppressHydrationWarning
                >
                  <option value="">-- ITEM --</option>
                  {stockItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input ref={el => { inputsRef.current['quantity'] = el; }} onMouseDown={blockMouseClick} type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} className="p-2 bg-slate-950 border border-slate-850 rounded text-white text-center text-[11px]" placeholder="QTY" suppressHydrationWarning />
                <input ref={el => { inputsRef.current['rate'] = el; }} onMouseDown={blockMouseClick} type="number" value={itemRate} onChange={e => setItemRate(e.target.value)} className="p-2 bg-slate-950 border border-slate-850 rounded text-emerald-400 text-right text-[11px]" placeholder="RATE" suppressHydrationWarning />
                <input ref={el => { inputsRef.current['discount'] = el; }} onMouseDown={blockMouseClick} onKeyDown={handleAddItemLine} type="number" value={itemDiscount} onChange={e => setItemDiscount(e.target.value)} className="p-2 bg-slate-950 border border-slate-850 rounded text-amber-400 text-center text-[11px]" placeholder="DISC %" min="0" max="99" suppressHydrationWarning />
              </div>

              {invoiceItems.length > 0 && (
                <div className="bg-slate-950 p-2 border border-slate-900 rounded max-h-24 overflow-y-auto space-y-1">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-[10px] border-b border-slate-900 pb-0.5 text-slate-400 font-mono">
                      <span>{item.name} ({item.quantity} units)</span>
                      <span>
                        Rate: ₹{item.rate} 
                        {item.discount_percentage > 0 && <span className="text-amber-500 ml-1">(-{item.discount_percentage}%)</span>}
                        {" = "}<b className="text-emerald-400">₹{((item.quantity * item.rate) * (1 - item.discount_percentage / 100)).toFixed(2)}</b>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 🌟 NEW ELEMENT: PAYMENT MODE SELECTION STRIP (CASH VS CREDIT) */}
              <div className="pt-2">
                <label className="block text-slate-500 mb-1 text-[9px] tracking-wider uppercase">INVOICE SETTLMENT TRANSACTION MODE [UP/DOWN]</label>
                <select 
                  ref={el => { inputsRef.current['payModeSelect'] = el; }} 
                  onMouseDown={blockMouseClick} 
                  value={paymentMode} 
                  onChange={e => setPaymentMode(e.target.value)} 
                  className={`w-full p-2 bg-slate-950 border rounded font-bold transition-all text-center tracking-widest ${
                    paymentMode === 'CASH' ? 'border-emerald-800 text-emerald-400 bg-emerald-950/10' : 'border-amber-800 text-amber-400 bg-amber-950/10'
                  }`}
                  suppressHydrationWarning
                >
                  <option value="CREDIT" className="bg-slate-950 text-amber-400 font-bold">-- BOOK ENTRIES AS CREDIT JOURNAL --</option>
                  <option value="CASH" className="bg-slate-950 text-emerald-400 font-bold">-- IMMEDIATE CASH SETTLEMENT --</option>
                </select>
              </div>

              {/* Dynamic Live Estimated GST Preview */}
              {(() => {
                const savedSubtotal = invoiceItems.reduce((acc, item) => 
                  acc + ((item.quantity * item.rate) * (1 - item.discount_percentage / 100)), 0
                );
                
                const liveQty = parseInt(itemQty) || 0;
                const liveRate = parseFloat(itemRate) || 0;
                const liveDisc = parseFloat(itemDiscount) || 0;
                const liveSubtotal = (liveQty * liveRate) * (1 - liveDisc / 100);

                const totalSubtotal = savedSubtotal + liveSubtotal;
                if (totalSubtotal <= 0) return null;

                const computedCGST = totalSubtotal * 0.09;
                const computedSGST = totalSubtotal * 0.09;
                const computedGrandTotal = totalSubtotal + computedCGST + computedSGST;

                return (
                  <div className="mt-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg space-y-1.5 font-mono text-[10px]">
                    <span className="block text-slate-500 font-bold tracking-widest uppercase border-b border-slate-900 pb-1 mb-1">
                      LIVE TRANSACTION TAX SUMMARY (REAL-TIME)
                    </span>
                    <div className="flex justify-between text-slate-400">
                      <span>DISCOUNTED ITEM SUB-TOTAL:</span>
                      <span className="text-slate-200 font-bold">₹{totalSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-cyan-500">
                      <span>AUTOMATED CGST COMPONENT (9.0%):</span>
                      <span>₹{computedCGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>AUTOMATED SGST COMPONENT (9.0%):</span>
                      <span>₹{computedSGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-dashed border-slate-800 pt-1.5 text-[11px]">
                      <span>GRAND TOTAL PAYABLE COMPLIANCE INDEX:</span>
                      <span className="bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">
                        ₹{computedGrandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div>
            <label className="block text-slate-500 mb-1.5 text-[10px] tracking-wider uppercase">NARRATION NOTE [UP/DOWN]</label>
            <textarea ref={el => { inputsRef.current['narration'] = el; }} onMouseDown={blockMouseClick} value={narration} onChange={e => setNarration(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:outline-none focus:border-cyan-500 h-14 resize-none font-sans" placeholder="Enter transaction reference notation summary..."/>
          </div>

          <button type="submit" onMouseDown={blockMouseClick} className="w-full py-3 mt-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-lg tracking-widest uppercase text-center hover:bg-slate-850 transition-all" suppressHydrationWarning>
            RECORD ENTRY TO LOGS [ENTER]
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 text-center font-bold border rounded-lg transition-all duration-300 ${
            isError ? 'bg-rose-950/40 border-rose-900/60 text-rose-400' : 'bg-emerald-950/30 border-emerald-900/60 text-yellow-400'
          }`}>{message}</div>
        )}
      </div>
    </div>
  );
}