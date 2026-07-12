from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from decimal import Decimal
from app.database import get_db
from app.models.ledger import Ledger
from app.models.stock import StockItem
from app.models.voucher import Voucher
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/companies/{company_id}/vouchers", tags=["Voucher Transactions Engine"])

class VoucherItemSchema(BaseModel):
    stock_item_id: int
    quantity: int
    discount_percentage: float = 0.0

class VoucherCreateSchema(BaseModel):
    voucher_type: str        
    voucher_number: str
    party_ledger_id: int     
    payment_mode: str        
    items: List[VoucherItemSchema]


@router.post("")
@router.post("/")
def post_accounting_voucher(company_id: int, voucher: VoucherCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ledger = db.query(Ledger).filter(Ledger.id == voucher.party_ledger_id, Ledger.company_id == company_id).first()
    if not ledger:
        raise HTTPException(status_code=404, detail="Target ledger profile not found.")

    vch_type = voucher.voucher_type.upper()
    grp_type = ledger.group_type.upper()

    # Enforce accounting constraints
    if ledger.name.upper() != "CASH ON HAND" and grp_type != "CASH":
        if vch_type == "SALES" and grp_type != "CUSTOMER":
            raise HTTPException(status_code=400, detail="Invoicing Fault: Customer ledger required for Sales.")
        if vch_type == "PURCHASE" and grp_type != "SUPPLIER":
            raise HTTPException(status_code=400, detail="Invoicing Fault: Supplier ledger required for Purchases.")

    # 🔄 FIX 1: Aggregate multiple identical items first to prevent snapshot exploit
    aggregated_quantities = {}
    for item in voucher.items:
        qty = int(item.quantity) # Explicitly cast to integer to prevent type tricks
        aggregated_quantities[item.stock_item_id] = aggregated_quantities.get(item.stock_item_id, 0) + qty

    base_taxable_value = Decimal("0.00")

    for item in voucher.items:
        stock_item = db.query(StockItem).filter(StockItem.id == item.stock_item_id, StockItem.company_id == company_id).first()
        if not stock_item:
            raise HTTPException(status_code=404, detail=f"Stock item reference missing for ID {item.stock_item_id}")
        
        # 🚨 FIX 2: Validate using total aggregate demand instead of single lines
        if vch_type == "SALES":
            total_requested = aggregated_quantities[item.stock_item_id]
            if stock_item.current_qty < total_requested:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock Out: Total transaction demands {total_requested} units of '{stock_item.name}', but only {stock_item.current_qty} units are available."
                )

        base_rate = Decimal(str(stock_item.selling_price if vch_type == "SALES" else stock_item.purchase_price))
        discount_amount = base_rate * (Decimal(str(item.discount_percentage)) / Decimal("100.00"))
        final_rate = base_rate - discount_amount
        
        base_taxable_value += Decimal(str(item.quantity)) * final_rate

        if vch_type == "SALES":
            stock_item.current_qty -= item.quantity
        elif vch_type == "PURCHASE":
            stock_item.current_qty += item.quantity

    cgst = base_taxable_value * Decimal("0.09")
    sgst = base_taxable_value * Decimal("0.09")
    final_invoice_total = base_taxable_value + cgst + sgst

    if voucher.payment_mode.upper() == "CREDIT" and ledger.name.upper() != "CASH ON HAND" and grp_type != "CASH":
        ledger.current_balance += final_invoice_total

    db_voucher = Voucher(
        company_id=company_id,
        voucher_type=vch_type,
        voucher_number=voucher.voucher_number.upper(),
        party_ledger_id=voucher.party_ledger_id,
        payment_mode=voucher.payment_mode.upper(),
        total_amount=final_invoice_total,
        cgst_amount=cgst,
        sgst_amount=sgst
    )
    db.add(db_voucher)
    db.commit()
    
    return {"status": "SUCCESS", "invoice_total": float(final_invoice_total)}


@router.get("")
@router.get("/")
def get_all_vouchers(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetches list of vouchers along with mathematically accurate KPIs split by cash/credit"""
    vouchers = db.query(Voucher).filter(Voucher.company_id == company_id).order_by(Voucher.id.desc()).all()
    
    # Mathematical Calculations Block
    cash_turnover = 0.0
    outstanding_receivables = 0.0
    outstanding_payables = 0.0
    total_gst = 0.0
    
    response_list = []
    for v in vouchers:
        ledger_record = db.query(Ledger).filter(Ledger.id == v.party_ledger_id).first()
        resolved_name = ledger_record.name if ledger_record else "DIRECT CASH ACCOUNT"
        
        amount_float = float(v.total_amount)
        cgst_float = float(v.cgst_amount)
        sgst_float = float(v.sgst_amount)
        
        total_gst += (cgst_float + sgst_float)

        # FIX: Segregate values accurately based on real accounting workflows
        if v.payment_mode == "CASH":
            cash_turnover += amount_float
        else:
            if v.voucher_type == "SALES":
                outstanding_receivables += amount_float
            elif v.voucher_type == "PURCHASE":
                outstanding_payables += amount_float

        response_list.append({
            "id": v.id,
            "voucher_type": v.voucher_type,
            "voucher_number": v.voucher_number,
            "party_name": resolved_name,
            "payment_mode": v.payment_mode,
            "cgst": cgst_float,
            "sgst": sgst_float,
            "total_amount": amount_float,
            "date": v.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    return {
        "vouchers": response_list,
        "summary": {
            "cash_turnover": cash_turnover,
            "outstanding_receivables": outstanding_receivables,
            "outstanding_payables": outstanding_payables,
            "total_gst": total_gst
        }
    }