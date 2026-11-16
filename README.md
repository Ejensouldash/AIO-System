# AIO System - Enterprise Operations & Supply Chain Platform

A standalone, high-performance operations platform extracted and isolated into an independent system. Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma 7, and NextAuth v5.

---

## 🚀 Key Modules Included

### 1. Sales Ordering Department (`/forms/sales-ordering`)
* **Dashboard:** Operational intake summary, approved vs. rejected PO KPIs, and daily transaction activity.
* **Customer Master:** Complete customer directory, billing/delivery addresses, and customer registration review.
* **Document Control:** Document intake queue, multimodal AI data extraction, and invoice categorization.
* **PO Upload & Intake:** Automated PO processing with Gemini OCR parser and schema validation.
* **PO-SOA Credit Evaluation:** Mathematical credit risk evaluation engine:
  - Evaluation strictly anchored to **SOA Statement Date** (`soa.statementDate`).
  - Dynamic Overdue Tolerance based on customer credit terms (`daysOverdue > creditTermDays`).
  - Hard credit limit breach detection.
* **Sales Orders:** Order creation, line item management, and warehouse fulfillment handoff.
*(Database maintenance tab is excluded as requested).*

### 2. Production Operations (`/forms/production`)
* **Forms Home:** Rapid launcher for daily shift reporting, material intake, and handovers.
* **Transfer-In Forms:** Raw material delivery logging and receipt from suppliers.
* **Daily KAR (Shift Reports):** Full shift reporting for Rantau production lines, raw material reconciliation, machine breakdown tracking, and shift carry-forwards.
* **Handover Form:** Shift finished goods handover to Warehouse with auto net-quantity calculation.
* **Production Stock:** Real-time storeroom inventory balance derived from material usage and transfer-in logs.
* **Production Analytics:** ISO week-based reporting, KPI cards, AI executive summary, and PDF report generator.
* **Quarantine (Hold Items):** Item hold and scrap tracking with disposition actions.
* **Pedas / KBP Batch Generator:** Pedas origin batch QR code and packaging tracker.
*(Sage X3 Export and Database purge tab are excluded as requested).*

### 3. Warehouse & Logistics (`/forms/warehouse`)
* **Live Inventory & Transfers:** Real-time finished goods stock, batch traceability, and custodian pallet tracking.
* **Distribution Orders (DO):** Multi-stop customer deliveries, driver assignments, and Proof of Delivery (POD).
* **Quarantine & Returns:** Return intake, quarantine inspection, scrap, and restocking workflow.
* **Gatepass Planning:** Gate pass requisition, approval flow, and vehicle assignment.
* **Security Gate Scanner:** QR code gate verification for gate-in and gate-out validation.
* **Raw Material Warehouse Reports:** Daily raw material ledger (SGMP/15/DRM) and production withdrawal logs.
* **Reports:** Daily, monthly, and opening stock reports.
* **Traceability:** End-to-end audit trail linking batch numbers, production DOs, delivery vehicles, and customer delivery receipts.

### 4. Supply Chain Control Tower (`/dashboard`)
* Executive 3-stage supply chain dashboard monitoring the entire operational lifecycle:
  1. **Demand Intake:** Pending customer POs, SOA credit clearance rate, and approved order value.
  2. **Manufacturing & KAR:** Active line shifts, bottle/cap run rates, and quarantine alerts.
  3. **Fulfillment & Dispatch:** Ready-for-dispatch batches, gate passes, and active transit units.

### 5. User Administration & Self-Service Settings
* **User Management (`/users`):** User creation and granular module access control restricted strictly to the 16 AIO System operational modules.
* **User Settings (`/settings`):** Accessible to all logged-in users to update their profile name and securely change their account password.

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js:** v20.x or later (tested on Node v26)
* **PostgreSQL:** v14 or later (clean database)
* **npm:** v10 or later

### 1. Environment Configuration
Copy `.env.example` or edit `.env` in the project root:
```env
# Database Connection (Dedicated Clean PostgreSQL Database)
DATABASE_URL="postgresql://aio_user:aio_password@localhost:5432/aio_system_db?schema=public"

# NextAuth v5 Secret & App URL
AUTH_SECRET="your-strong-random-32-byte-secret"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 Storage (For document uploads & PDF evidence)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="aio-system-storage"
R2_ENDPOINT="https://your-cloudflare-account-id.r2.cloudflarestorage.com"
R2_PREFIX="aio-system/"

# Gemini API Key (For automated PO & SOA multimodal extraction)
GEMINI_API_KEY="your-gemini-api-key"
```

### 2. Database Initialization
Push the clean schema to your PostgreSQL database:
```bash
npx prisma db push
```

### 3. Seed Initial Administrator Account
Run the idempotent seed script to create default system roles, branches, units, and the initial `SUPERADMIN` user:
```bash
npm run seed
```
**Default Credentials:**
* **Email:** `admin@aiosystem.com`
* **Password:** `Admin@123456`
*(Please change this password immediately via `/settings` after your initial login).*

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🔒 Security & Data Integrity Notes
* **Data Isolation:** This repository contains **NO production data** from the legacy system. The database is initialized completely clean.
* **Strict Localization:** All user interfaces, buttons, notifications, error dialogs, and tables are fully localized in **English**.
