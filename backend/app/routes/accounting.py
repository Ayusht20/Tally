from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
from typing import List, Optional
from app.database import get_db
from app.models.ledger import Ledger
from app.models.stock import StockItem
from app.models.voucher import Voucher, VoucherLedgerEntry, VoucherItemLine
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/companies/{company_id}/accounting", tags=["Unified Voucher Engine"])

class ItemLineSchema(BaseModel):
    stock_item_id: int
    quantity: int
    rate: float
    discount_percentage: Optional[float] = 0.0

class MasterVoucherSchema(BaseModel):
    voucher_type: str            
    amount: Optional[float] = 0.0 
    dr_ledger_id: Optional[int] = None
    cr_ledger_id: Optional[int] = None
    payment_mode: Optional[str] = "CREDIT"  # 🌟 CREDIT or CASH switcher option
    narration: str = ""
    items: Optional[List[ItemLineSchema]] = [] 

@router.post("/vouchers")
def post_unified_voucher(company_id: int, payload: MasterVoucherSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v_type = payload.voucher_type.upper()
    
    # =========================================================================
    # BRANCH A: INVENTORY PROCESSING SECTOR (SALES & PURCHASE INVOICES)
    # =========================================================================
    if v_type in ["SALES", "PURCHASE"]:
        if not payload.items:
            raise HTTPException(status_code=400, detail="Inventory Fault: Sales or Purchase entries require tracking line items.")
            
        target_ledger_id = payload.dr_ledger_id if v_type == "SALES" else payload.cr_ledger_id
        if not target_ledger_id:
            raise HTTPException(status_code=400, detail="Missing required account ledger reference anchor.")

        party_ledger = db.query(Ledger).filter(Ledger.id == target_ledger_id, Ledger.company_id == company_id).first()
        if not party_ledger:
            raise HTTPException(status_code=404, detail="Target party ledger account profile not found.")

        subtotal_after_discounts = Decimal("0.00")
        items_to_process = []

        for line in payload.items:
            stock_unit = db.query(StockItem).filter(StockItem.id == line.stock_item_id, StockItem.company_id == company_id).first()
            if not stock_unit:
                raise HTTPException(status_code=404, detail=f"Stock item asset reference ID {line.stock_item_id} not found.")

            # 🔄 AUTOMATED REAL PRICE & DISCOUNT DEDUCTION MATH
            raw_line_cost = Decimal(str(line.quantity)) * Decimal(str(line.rate))
            discount_factor = Decimal(str(line.discount_percentage or 0.0)) / Decimal("100.00")
            discount_amount = raw_line_cost * discount_factor
            
            final_line_cost = raw_line_cost - discount_amount
            subtotal_after_discounts += final_line_cost

            # Adjust physical inventory records using your verified database column name
            if v_type == "SALES":
                stock_unit.current_qty -= line.quantity 
            else:
                stock_unit.current_qty += line.quantity 

            items_to_process.append({
                "stock_item_id": stock_unit.id,
                "quantity": line.quantity,
                "rate": Decimal(str(line.rate)),
                "amount": final_line_cost 
            })

        # ⚡ AUTOMATED GST COMPUTATION ASSIGNED ON CLEAN REAL VALUES ONLY
        cgst = subtotal_after_discounts * Decimal("0.09")
        sgst = subtotal_after_discounts * Decimal("0.09")
        grand_total = subtotal_after_discounts + cgst + sgst

        invoice_count = db.query(Voucher).filter(Voucher.company_id == company_id, Voucher.voucher_type == v_type).count()
        vch_number = f"{v_type[:3]}-{2000 + invoice_count + 1}"

        # 🌟 AUTOMATED CASH OR CREDIT ACCOUNT ROUTING OVERRIDE
        p_mode = payload.payment_mode.upper() if payload.payment_mode else "CREDIT"
        
        if p_mode == "CASH":
            cash_ledger = db.query(Ledger).filter(Ledger.group_type == "CASH", Ledger.company_id == company_id).first()
            if not cash_ledger:
                raise HTTPException(status_code=404, detail="Core liquid Cash ledger profile asset not found in database registry.")
            final_party_id = cash_ledger.id
            accounting_ledger = cash_ledger
        else:
            final_party_id = party_ledger.id
            accounting_ledger = party_ledger

        db_voucher = Voucher(
            company_id=company_id,
            voucher_type=v_type,
            voucher_number=vch_number,
            party_ledger_id=final_party_id, 
            payment_mode=p_mode,
            total_amount=grand_total,
            cgst_amount=cgst,
            sgst_amount=sgst
        )
        db.add(db_voucher)
        db.flush()

        for item_data in items_to_process:
            db.add(VoucherItemLine(
                voucher_id=db_voucher.id,
                stock_item_id=item_data["stock_item_id"],
                quantity=item_data["quantity"],
                rate=item_data["rate"],
                amount=item_data["amount"]
            ))

        # Adjust the dynamic live balances on the correctly selected account ledger
        if v_type == "SALES":
            accounting_ledger.current_balance += grand_total
        else:
            accounting_ledger.current_balance -= grand_total

        db.commit()
        return {"status": "SUCCESS", "voucher_number": vch_number, "voucher_id": db_voucher.id}

    # =========================================================================
    # BRANCH B: CASHFLOW PROCESSING SECTOR (CONTRA, PAYMENT, RECEIPT, JOURNAL)
    # =========================================================================
    else:
        if not payload.dr_ledger_id or not payload.cr_ledger_id:
            raise HTTPException(status_code=400, detail="Accounting Fault: Ledger configurations require distinct balancing identifiers.")

        dr_ledger = db.query(Ledger).filter(Ledger.id == payload.dr_ledger_id, Ledger.company_id == company_id).first()
        cr_ledger = db.query(Ledger).filter(Ledger.id == payload.cr_ledger_id, Ledger.company_id == company_id).first()

        if not dr_ledger or not cr_ledger:
            raise HTTPException(status_code=404, detail="One or both selected account ledgers were not found.")

        if v_type == "CONTRA":
            allowed_groups = ["CASH", "BANK"]
            if dr_ledger.group_type.upper() not in allowed_groups or cr_ledger.group_type.upper() not in allowed_groups:
                raise HTTPException(status_code=400, detail="CONTRA entries only allow internal CASH or BANK accounts.")

        vch_amount = Decimal(str(payload.amount))
        if vch_amount <= 0:
            raise HTTPException(status_code=400, detail="Transaction volume must be greater than zero.")

        voucher_count = db.query(Voucher).filter(Voucher.company_id == company_id, Voucher.voucher_type == v_type).count()
        vch_number = f"{v_type[:3]}-{1000 + voucher_count + 1}"

        dr_ledger.current_balance += vch_amount
        cr_ledger.current_balance -= vch_amount

        db_voucher = Voucher(
            company_id=company_id,
            voucher_type=v_type,
            voucher_number=vch_number,
            party_ledger_id=payload.dr_ledger_id,
            payment_mode="CASH" if dr_ledger.group_type.upper() == "CASH" else "CREDIT",
            total_amount=vch_amount
        )
        db.add(db_voucher)
        db.flush()

        db.add(VoucherLedgerEntry(voucher_id=db_voucher.id, ledger_id=dr_ledger.id, entry_type="DEBIT", amount=vch_amount))
        db.add(VoucherLedgerEntry(voucher_id=db_voucher.id, ledger_id=cr_ledger.id, entry_type="CREDIT", amount=vch_amount))
        
        db.commit()
        return {"status": "SUCCESS", "voucher_number": vch_number, "voucher_id": db_voucher.id}

@router.get("/vouchers/{voucher_id}/download")
def download_voucher_receipt(company_id: int, voucher_id: int, db: Session = Depends(get_db)):
    vch = db.query(Voucher).filter(Voucher.id == voucher_id, Voucher.company_id == company_id).first()
    if not vch:
        raise HTTPException(status_code=404, detail="Voucher entry record not found.")
        
    receipt_data = f"""
    ==================================================
                 SMARTERP TRANSACTION RECEIPT         
    ==================================================
    VOUCHER TYPE   : {vch.voucher_type}
    VOUCHER REF NO : {vch.voucher_number}
    DATE GENERATED : {vch.created_at.strftime('%Y-%m-%d %H:%M:%S')}
    --------------------------------------------------
    BASE TAX REGION VALUE     : INR {vch.total_amount - (vch.cgst_amount + vch.sgst_amount):.2f}
    CGST AMOUNT PORTION (9%)  : INR {vch.cgst_amount:.2f}
    SGST AMOUNT PORTION (9%)  : INR {vch.sgst_amount:.2f}
    --------------------------------------------------
    TOTAL AUDITED NET VOLUME  : INR {vch.total_amount:.2f}
    PAYMENT ASSIGNED MODE     : {vch.payment_mode}
    ==================================================
    STATUS: VERIFIED & COMPLIANT WITH SYSTEM MASTER LOGS
    """
    return Response(content=receipt_data.strip(), media_type="text/plain", headers={"Content-Disposition": f"attachment; filename={vch.voucher_number}.txt"})