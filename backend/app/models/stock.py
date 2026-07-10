from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    sku = Column(String, nullable=True)
    purchase_price = Column(Numeric(14, 2), nullable=False)
    selling_price = Column(Numeric(14, 2), nullable=False)
    opening_qty = Column(Integer, default=0)
    current_qty = Column(Integer, default=0)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    hsn_code = Column(String, nullable=True)

    unit = relationship("Unit")
    company = relationship("Company", back_populates="stock_items")
    voucher_items = relationship("VoucherItemLine", back_populates="stock_item")