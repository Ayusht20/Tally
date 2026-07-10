# ⌨️ SmartERP - Keyboard-Driven Accounting Terminal 💼

A production-ready full-stack accounting system inspired by the speed and workflow of Tally ERP. SmartERP is designed for high-speed keyboard-only data entry, eliminating unnecessary mouse interactions to maximize efficiency in retail, wholesale, and accounting environments.

---

# 🌐 Live Demo

### Frontend
https://tally-gold-ten.vercel.app

### Backend API (Swagger Docs)
https://smart-erp-backend.onrender.com/docs

---

# 📖 Introduction

Most modern billing applications depend heavily on mouse interactions, which slows down operators handling hundreds of invoices every day.

SmartERP solves this by providing a **keyboard-first accounting terminal** inspired by professional accounting software like **Tally ERP**.

The core workflow completely disables and hides the mouse cursor using custom CSS, allowing operators to perform every major task using only keyboard shortcuts.

The entire interface is built around high-speed hotkey navigation for lightning-fast accounting operations.

---

# ⌨️ Keyboard Navigation

## A. Main Dashboard Hotkeys

Activated directly from the primary dashboard.

| Key | Action |
|------|--------|
| **L** | Open Ledger Management |
| **I** | Open Inventory Stock Ledger |
| **V** | Open Voucher Posting Console |
| **R** | Open Daybook Reports & GST Audit Summary |
| **A** | Open Financial Statement Analysis |
| **O** | Open Outstanding Payables & Receivables |
| **ALT + U** | Open Unit of Measure Configuration (UOM) |

---

## B. Voucher Posting Shortcuts

Available inside the Voucher Posting Console.

| Shortcut | Voucher | Purpose |
|-----------|----------|---------|
| **F4** | CONTRA | Bank ↔ Cash transfers |
| **F5** | PAYMENT | Money paid to a ledger |
| **F6** | RECEIPT | Money received from a ledger |
| **F7** | JOURNAL | Non-cash adjustment entries |
| **F8** | SALES | Sales Invoice (Stock decreases + GST calculation) |
| **F9** | PURCHASE | Purchase Invoice (Stock increases + Ledger updates) |

---

## C. Global Navigation

Available throughout the application.

| Key | Function |
|------|----------|
| **↑ / ↓ Arrow Keys** | Move between form fields |
| **Enter** | Confirm input or submit voucher |

---

# 📸 Application Screenshots

## Gateway Dashboard

The primary navigation hub where every accounting module is accessible using keyboard shortcuts.

```text
screenshots/main_menu.png
```

---

## Voucher Posting Terminal

The main accounting workspace for processing vouchers without touching a mouse.

```text
screenshots/voucher_terminal.png
```

---

## Live Invoice Calculations

Automatically calculates:

- Base Amount
- Discounts
- Subtotal
- GST
- Final Total

```text
screenshots/invoice_math.png
```

---

## Stock Management

Manage inventory quantities, pricing, and stock availability.

```text
screenshots/stock_master.png
```

---

## Login Screen

Secure authentication before entering the system.

```text
screenshots/login_gate.png
```

---

## Ledger Directory

Displays all customer, supplier, cash, and bank ledgers with current balances.

```text
screenshots/ledger_directory.png
```

---

## Text Receipt Generation

Automatically generates downloadable plain-text receipts.

```text
screenshots/download_receipt.png
```

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- TypeScript

### Responsibilities

- Global keyboard interceptors (`keydown`)
- Keyboard focus management
- Mouse lock and pointer hiding
- Instant client-side invoice calculations

---

## Backend

- FastAPI
- Python 3.14

### Responsibilities

- Business logic
- Voucher processing
- Authentication
- High-performance asynchronous APIs

---

## Database

- PostgreSQL
- Neon Serverless Database

Stores:

- Users
- Companies
- Ledgers
- Stock Items
- Vouchers
- Transaction history

---

## ORM

- SQLAlchemy

Provides safe object-oriented database operations without writing raw SQL.

---
# 📁 Project Structure

```text
TALLY/
│
├── backend/
│   ├── app/
│   │   ├── models/               # SQLAlchemy database models
│   │   ├── routes/               # API route handlers
│   │   ├── schemas/              # Pydantic request & response schemas
│   │   ├── __init__.py
│   │   ├── auth.py               # Authentication utilities
│   │   ├── config.py             # Application configuration
│   │   ├── database.py           # PostgreSQL connection & session
│   │   └── main.py               # FastAPI application entry point
│   │
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables
│   ├── .gitignore
│   ├── run.py                    # Application runner
│   └── vtenv/                    # Python virtual environment
│
├── frontend/
│   ├── public/
│   │           # README screenshots
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── accounting-vouchers/
│   │   │   ├── analytics/
│   │   │   ├── ledgers/
│   │   │   ├── login/
│   │   │   ├── outstandings/
│   │   │   ├── reports/
│   │   │   ├── stock/
│   │   │   ├── units/
│   │   │   ├── vouchers/
│   │   │   ├── api.ts            # API communication layer
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── favicon.ico
│   │   │
│   │   └── middleware.ts         # Route protection & middleware
│   │
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
└── README.md
└──  screenshots/  
```

---

# 🗄 Database Design

The database follows strict relationships to ensure accounting accuracy.

## Users

- Can create and manage multiple companies.

---

## Ledgers

Represent accounting accounts such as:

- Cash
- Bank
- Customers
- Suppliers

Each ledger maintains its own running balance.

---

## Stock Items

Maintain:

- Current Quantity
- Pricing Information

---

## Vouchers

Each voucher contains one or more item lines.

When a **Sales Voucher** is created:

- Stock quantity decreases.
- Ledger balances are updated.
- GST values are calculated.

When a **Purchase Voucher** is created:

- Stock quantity increases.
- Ledger balances are updated.

All operations execute inside a single secure database transaction to maintain consistency.

---

# 🏭 Industrial Applications

SmartERP is designed for real business environments.

### Wholesale Distribution

Create large invoices with dozens of products quickly using only the keyboard.

---

### Retail & Supermarket POS

Works naturally with barcode scanners since scanners behave like keyboard input devices.

---

### Low-Bandwidth Businesses

The lightweight frontend and optimized backend APIs provide smooth performance even on low-end hardware and slower internet connections.

---

# 🚀 What I Learned

Building SmartERP helped me gain practical experience with real-world full-stack software development.

Key learnings include:

- Keyboard-driven application architecture
- Preventing default browser shortcuts (such as repurposing **F5**)
- Managing complex application state
- Real-time accounting calculations
- Financial decimal precision
- Transaction-safe database operations
- Designing production-ready REST APIs
- Building a scalable full-stack application using Next.js, FastAPI, and PostgreSQL

---

# 🎯 Conclusion

SmartERP is a production-ready keyboard-driven accounting system built to demonstrate real-world full-stack engineering skills.

The project showcases:

- High-speed keyboard navigation
- Real-time accounting workflows
- Secure authentication
- Inventory management
- Ledger management
- Voucher processing
- PostgreSQL-backed financial data
- FastAPI REST APIs
- Modern Next.js frontend

It reflects practical software engineering concepts used in corporate accounting systems while focusing on speed, usability, and data integrity.

---