from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional

class StockItemBase(BaseModel):
    name: str
    sku: Optional[str] = None
    purchase_price: Decimal
    selling_price: Decimal
    opening_qty: int

class StockItemCreate(StockItemBase):
    pass

class StockItemOut(StockItemBase):
    id: int
    company_id: int
    current_qty: int
    model_config = ConfigDict(from_attributes=True)