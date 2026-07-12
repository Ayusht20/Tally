from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models.company import Company 
from app.routes import auth, ledgers, stock, vouchers ,units

# 1. Automatic Cloud Schema Migration
Base.metadata.create_all(bind=engine)

# 2. Initialize FastAPI Core Engine
app = FastAPI(title="SmartERP Cloud Engine")

origins = [
    "https://tally-gold-ten.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# --- CORS MIDDLEWARE ALLOWANCES ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db = SessionLocal()
try:
    # Check if ANY company exists. If not, make a master container row.
    if not db.query(Company).first():
        fallback_company = Company(
            id=1,
            user_id=2, # Temporary structural placeholder link
            name="DEFAULT MASTER ENTERPRISE",
            state="Gujarat",
            financial_year="2026-2027"
        )
        db.add(fallback_company)
        db.commit()
finally:
    db.close()

# 4. Mount Business Component Sub-Routers
app.include_router(auth.router)
app.include_router(ledgers.router)
app.include_router(stock.router)
app.include_router(vouchers.router)
from app.routes import reports
app.include_router(reports.router)
from app.routes import accounting
app.include_router(accounting.router)
app.include_router(units.router)

@app.get("/")
def health_check():
    return {"status": "online", "database": "connected to neon cloud"}