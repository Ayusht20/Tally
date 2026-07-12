from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User

from app.models.accounting import Unit 

router = APIRouter(prefix="/companies/{company_id}/accounting/units", tags=["Unit of Measure Master"])

class UnitSchema(BaseModel):
    name: str          # e.g., "Pieces"
    symbol: str        # e.g., "PCS"

@router.get("", response_model=List[UnitSchema])
def get_company_units(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    units = db.query(Unit).filter(Unit.company_id == company_id).all()
    return units

@router.post("", response_model=UnitSchema)
def create_company_unit(company_id: int, payload: UnitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check for duplicate symbols inside the same company setup
    existing = db.query(Unit).filter(Unit.symbol == payload.symbol.upper(), Unit.company_id == company_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit symbol configuration already registry matrix.")
        
    db_unit = Unit(
        company_id=company_id,
        name=payload.name,
        symbol=payload.symbol.upper()
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit