from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from datetime import datetime
from typing import List

class ItemLineBase(BaseModel):
    stock_item_id: int
    quantity: int
    rate: Decimal

class VoucherCreate(BaseModel):
    voucher_type: str
    voucher_number: str
    party_ledger_id: int
    items: List[ItemLineBase]

class ItemLineOut(BaseModel):
    id: int
    stock_item_id: int
    quantity: int
    rate: Decimal
    amount: Decimal
    model_config = ConfigDict(from_attributes=True)

class LedgerEntryOut(BaseModel):
    id: int
    ledger_id: int
    entry_type: str
    amount: Decimal
    model_config = ConfigDict(from_attributes=True)

class VoucherOut(BaseModel):
    id: int
    company_id: int
    voucher_type: str
    voucher_number: str
    date: datetime
    total_amount: Decimal
    item_lines: List[ItemLineOut]
    ledger_entries: List[LedgerEntryOut]
    model_config = ConfigDict(from_attributes=True)