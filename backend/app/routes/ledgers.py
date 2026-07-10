from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.ledger import Ledger
from app.schemas.ledger import LedgerCreate, LedgerOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/companies/{company_id}/ledgers", tags=["Ledger Masters"])

@router.post("/", response_model=LedgerOut)
def create_ledger(company_id: int, ledger_in: LedgerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if this customer or supplier title is already tracked for this company context node
    existing = db.query(Ledger).filter(Ledger.name == ledger_in.name.upper(), Ledger.company_id == company_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account ledger identifier already maps to an active record.")

    db_ledger = Ledger(
        company_id=company_id,
        name=ledger_in.name.upper(),
        group_type=ledger_in.group_type.upper(),
        opening_balance=ledger_in.opening_balance,
        current_balance=ledger_in.opening_balance
    )
    db.add(db_ledger)
    db.commit()
    db.refresh(db_ledger)
    return db_ledger

@router.get("/", response_model=List[LedgerOut])
def list_ledgers(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Ledger).filter(Ledger.company_id == company_id).all()