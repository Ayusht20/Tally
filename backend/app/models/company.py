from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, unique=True)
    state = Column(String, nullable=False)
    financial_year = Column(String, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="companies")
    ledgers = relationship("Ledger", back_populates="company", cascade="all, delete-orphan")
    stock_items = relationship("StockItem", back_populates="company", cascade="all, delete-orphan")
    vouchers = relationship("Voucher", back_populates="company", cascade="all, delete-orphan")