from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.ledger import Ledger
from app.models.stock import StockItem
from app.models.voucher import Voucher
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/companies/{company_id}/finance-reports", tags=["Financial Reports Engine"])

@router.get("/trial-balance")
def get_trial_balance(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ledgers = db.query(Ledger).filter(Ledger.company_id == company_id).all()
    
    debits = []
    credits = []
    
    for l in ledgers:
        bal = float(l.current_balance)
        if bal == 0:
            continue
            
        # Standard Accounting Tally rules sorting groups into precise Debit/Credit matching matrices
        if l.group_type.upper() in ["CUSTOMER", "BANK", "CASH", "EXPENSE"]:
            debits.append({"ledger_name": l.name, "group": l.group_type, "amount": abs(bal)})
        else:
            credits.append({"ledger_name": l.name, "group": l.group_type, "amount": abs(bal)})
            
    return {"debit_columns": debits, "credit_columns": credits}


@router.get("/profit-loss")
def get_profit_and_loss(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Total Turnover Aggregations
    sales_total = db.query(func.sum(Voucher.total_amount)).filter(Voucher.company_id == company_id, Voucher.voucher_type == "SALES").scalar() or 0.0
    purchase_total = db.query(func.sum(Voucher.total_amount)).filter(Voucher.company_id == company_id, Voucher.voucher_type == "PURCHASE").scalar() or 0.0
    
    # 2. Detailed Split: Cash vs Outstanding Credit Receivables (Sales)
    cash_sales = db.query(func.sum(Voucher.total_amount)).filter(Voucher.company_id == company_id, Voucher.voucher_type == "SALES", Voucher.payment_mode == "CASH").scalar() or 0.0
    credit_sales = db.query(func.sum(Voucher.total_amount)).filter(Voucher.company_id == company_id, Voucher.voucher_type == "SALES", Voucher.payment_mode == "CREDIT").scalar() or 0.0

    # 3. Detailed Split: Cash vs Outstanding Credit Payables (Purchases)
    cash_purchases = db.query(func.sum(Voucher.total_amount)).filter(Voucher.company_id == company_id, Voucher.voucher_type == "PURCHASE", Voucher.payment_mode == "CASH").scalar() or 0.0
    credit_purchases = db.query(func.sum(Voucher.total_amount)).filter(Voucher.company_id == company_id, Voucher.voucher_type == "PURCHASE", Voucher.payment_mode == "CREDIT").scalar() or 0.0

    gross_profit = float(sales_total) - float(purchase_total)
    
    return {
        "sales_turnover": float(sales_total),
        "cost_of_goods": float(purchase_total),
        "cash_sales": float(cash_sales),
        "credit_receivables": float(credit_sales),
        "cash_purchases": float(cash_purchases),
        "credit_payables": float(credit_purchases),
        "net_profit": gross_profit
    }


@router.get("/outstandings")
def get_outstanding_statements(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Scans ledger networks to extract absolute payables and receivables sheets"""
    ledgers = db.query(Ledger).filter(Ledger.company_id == company_id).all()
    
    payables = []    
    receivables = [] 
    
    for l in ledgers:
        bal = float(l.current_balance)
        if bal == 0:
            continue
            
        if l.group_type.upper() == "SUPPLIER":
            payables.append({
                "ledger_id": l.id,
                "party_name": l.name,
                "amount_due": bal,
                "status": "PAYABLE TO VENDOR"
            })
        elif l.group_type.upper() == "CUSTOMER":
            receivables.append({
                "ledger_id": l.id,
                "party_name": l.name,
                "amount_due": bal,
                "status": "RECEIVABLE FROM CLIENT"
            })
            
    return {"outstanding_payables": payables, "outstanding_receivables": receivables}