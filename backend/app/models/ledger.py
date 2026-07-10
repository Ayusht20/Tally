from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Ledger(Base):
    __tablename__ = "ledgers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    group_type = Column(String, nullable=False)  # 'CUSTOMER' or 'SUPPLIER'
    opening_balance = Column(Numeric(14, 2), default=0.00)
    current_balance = Column(Numeric(14, 2), default=0.00)

    company = relationship("Company", back_populates="ledgers")
    entries = relationship("VoucherLedgerEntry", back_populates="ledger")