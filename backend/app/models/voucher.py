from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    voucher_type = Column(String, nullable=False)   # "SALES" or "PURCHASE"
    voucher_number = Column(String, unique=True, nullable=False, index=True)
    party_ledger_id = Column(Integer, ForeignKey("ledgers.id"))
    payment_mode = Column(String, default="CREDIT") # "CASH" or "CREDIT"
    total_amount = Column(Numeric(12, 2), default=0.00)
    cgst_amount = Column(Numeric(12, 2), default=0.00)
    sgst_amount = Column(Numeric(12, 2), default=0.00)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Downstream Cascade Mappings (Child components look up to this parent)
    ledger_entries = relationship("VoucherLedgerEntry", back_populates="voucher", cascade="all, delete-orphan")
    item_lines = relationship("VoucherItemLine", back_populates="voucher", cascade="all, delete-orphan")

    # One-Way Base Model Linkages to avoid mapping cross-dependencies
    company = relationship("Company")
    ledger = relationship("Ledger")


class VoucherLedgerEntry(Base):
    __tablename__ = "voucher_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False)
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False)
    entry_type = Column(String, nullable=False)  # 'DEBIT' or 'CREDIT'
    amount = Column(Numeric(14, 2), nullable=False)

    # Parent linkage works perfectly
    voucher = relationship("Voucher", back_populates="ledger_entries")
    
    # FIXED: Reconfigured to a clean one-way lookup to protect model registries
    ledger = relationship("Ledger")


class VoucherItemLine(Base):
    __tablename__ = "voucher_item_lines"

    id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False)
    stock_item_id = Column(Integer, ForeignKey("stock_items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    rate = Column(Numeric(14, 2), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)

    # Parent linkage works perfectly
    voucher = relationship("Voucher", back_populates="item_lines")
    
    # FIXED: Reconfigured to a clean one-way lookup to protect stock registries
    stock_item = relationship("StockItem")