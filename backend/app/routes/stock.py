from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.stock import StockItem
from app.models.accounting import Unit
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/companies/{company_id}/stock", tags=["Inventory Management"])

class StockItemCreateSchema(BaseModel):
    name: str
    sku: str
    hsn_code: Optional[str] = None
    purchase_price: float
    selling_price: float
    current_qty: int
    unit_id: Optional[int] = None

@router.post("")
@router.post("/")
def create_stock_item(company_id: int, payload: StockItemCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Structural Check: Ensure the chosen unit exists for this company
    if payload.unit_id:
        unit_check = db.query(Unit).filter(Unit.id == payload.unit_id, Unit.company_id == company_id).first()
        if not unit_check:
            raise HTTPException(status_code=404, detail="Selected Unit of Measure not found.")
    existing_item = db.query(StockItem).filter(
        StockItem.sku == payload.sku.upper(), 
        StockItem.company_id == company_id
    ).first()
    
    if existing_item:
        raise HTTPException(status_code=400, detail="An asset profile with this SKU barcode already exists.")
    
    db_item = StockItem(
        company_id=company_id,
        name=payload.name.upper(),
        sku=payload.sku.upper(),
        hsn_code=payload.hsn_code,
        purchase_price=payload.purchase_price,
        selling_price=payload.selling_price,
        current_qty=payload.current_qty,
        unit_id=payload.unit_id
    )
    db.add(db_item)
    db.commit()
    return {"status": "SUCCESS", "item_id": db_item.id}

@router.get("")
@router.get("/")
def list_stock_items(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lists stock balances with their resolved descriptive unit labels"""
    items = db.query(StockItem).filter(StockItem.company_id == company_id).all()
    return [{
        "id": i.id,
        "name": i.name,
        "sku": i.sku,
        "hsn_code": i.hsn_code,
        "purchase_price": float(i.purchase_price),
        "selling_price": float(i.selling_price),
        "current_qty": i.current_qty,
        # Fall back to 'NOS' (Numbers) if no specific unit is assigned
        "unit_symbol": db.query(Unit).filter(Unit.id == i.unit_id).first().symbol if i.unit_id else "NOS"
    } for i in items]