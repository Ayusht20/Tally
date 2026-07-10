import datetime
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String, nullable=False)       
    formal_name = Column(String, nullable=True)   
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AccountingVoucher(Base):
    __tablename__ = "accounting_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    voucher_type = Column(String, nullable=False) # 'CONTRA', 'PAYMENT', 'RECEIPT', 'JOURNAL'
    voucher_number = Column(String, unique=True, nullable=False, index=True)
    dr_ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)
    cr_ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    narration = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship joins for quick queries
    dr_ledger = relationship("Ledger", foreign_keys=[dr_ledger_id])
    cr_ledger = relationship("Ledger", foreign_keys=[cr_ledger_id])