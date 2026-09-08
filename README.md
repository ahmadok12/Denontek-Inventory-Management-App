# Denontek Proximity Sensors - Inventory Management Web App

A light-themed, mobile-first, minimalistic inventory management web application for **Denontek**, tailored for industrial **Proximity Sensors** manufacturing and assembly.

---

## 🌟 Key Features

1. **Finished Items & Components Management**:
   - Pre-loaded with industrial **Inductive and Capacitive Proximity Sensors** (M12, M18) and their raw components (sensing coils, ferrite cores, ASIC trigger ICs, threaded brass & stainless steel barrels, PBT face caps, cables, and potting resins).
   - Auto-generated serial IDs (`FIN-xxx`, `CMP-xxx`).
   - Reorder level alerts with real-time stock status.

2. **Assembly Run & Dynamic BOM**:
   - Bill of Materials (BOM) configurations linking finished products to components.
   - Run Assembly dialog with clean configuration loader.
   - Auto-unlinks recipe and finished item if component specifications are modified, seamlessly guiding you to define new finished items and BOM recipes.
   - Batch quantity scaling.

3. **Stock In & Stock Out**:
   - Multi-item vouchers for vendor receipts and customer dispatches.
   - Clean creation dialogs without unwanted autofill.
   - **Zero Negative Stock Policy**: Real-time validation blocks dispatches, assembly consumption, or voucher deletions if inventory would drop below zero.

4. **Point-in-Time Reports**:
   - **Components Quantity**: Point-in-time stock calculation as of any selected date with warning badges for low stock.
   - **Finished Items Quantity**: Clean ready stock counts by date.
   - **Reorder Level Alert**: Filterable low-stock alerts.
   - **Transaction Ledgers**: Detailed 2-column movement history for components and finished products with KPI summary cards.

5. **Local-First & Data Portability**:
   - Instant state persistence with `localStorage`.
   - Full JSON database export & restore from Settings.

---

## 🚀 Getting Started & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173/` (or scan your local network IP on mobile).

### 3. Build for Production
```bash
npm run build
```
The compiled, production-ready static files are placed in `/dist`.

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Architecture**: Modular, Component-driven, React Context API

