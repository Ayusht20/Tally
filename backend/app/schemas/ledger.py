from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional

class LedgerBase(BaseModel):
    name: str
    group_type: str
    opening_balance: Optional[Decimal] = Decimal("0.00")

class LedgerCreate(LedgerBase):
    pass

class LedgerOut(LedgerBase):
    id: int
    company_id: int
    current_balance: Decimal
    
    model_config = ConfigDict(from_attributes=True)