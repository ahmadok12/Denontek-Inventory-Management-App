export interface ComponentItem {
  id: string; // e.g. "CMP-001"
  name: string;
  categoryId: string;
  openingQty: number;
  reorderLevel: number;
  createdAt: string;
}

export interface FinishedItem {
  id: string; // e.g. "FIN-001"
  name: string;
  openingQty: number;
  createdAt: string;
}

export interface ConfigComponentRow {
  componentId: string;
  qty: number;
}

export interface Configuration {
  id: string; // e.g. "CFG-001"
  finishedItemId: string;
  components: ConfigComponentRow[];
  details: string;
  createdAt: string;
}

export interface AssemblyComponentRow {
  componentId: string;
  qty: number;
}

export interface AssemblyRun {
  id: string; // e.g. "ASM-001"
  date: string; // YYYY-MM-DD
  finishedItemId: string;
  finishedItemQty: number;
  components: AssemblyComponentRow[];
  details?: string;
  createdAt: string;
}

export interface StockInItemRow {
  componentId: string;
  qty: number;
}

export interface StockIn {
  id: string; // e.g. "IN-001"
  date: string; // YYYY-MM-DD
  vendorId: string;
  items: StockInItemRow[];
  details: string;
  createdAt: string;
}

export interface StockOutItemRow {
  finishedItemId: string;
  qty: number;
}

export interface StockOut {
  id: string; // e.g. "OUT-001"
  date: string; // YYYY-MM-DD
  customerId: string;
  items: StockOutItemRow[];
  details: string;
  createdAt: string;
}

export interface Vendor {
  id: string; // e.g. "VND-001"
  name: string;
  createdAt: string;
}

export interface Customer {
  id: string; // e.g. "CST-001"
  name: string;
  createdAt: string;
}

export interface ComponentCategory {
  id: string; // e.g. "CAT-001"
  name: string;
  createdAt: string;
}

// Reports & Ledger types
export interface MovementEntry {
  id: string;
  date: string;
  type: 'OPENING' | 'STOCK_IN' | 'STOCK_OUT' | 'ASSEMBLY_OUT' | 'ASSEMBLY_IN';
  refNumber: string;
  description: string;
  partyName?: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
}

export type TabType = 'home' | 'reports' | 'settings';

export type HomeModule = 
  | 'components' 
  | 'finished-items' 
  | 'configuration' 
  | 'run-assembly' 
  | 'stock-in' 
  | 'stock-out';

export type ReportModule =
  | 'components-quantity'
  | 'finished-items-quantity'
  | 'components-movements'
  | 'finished-item-movement'
  | 'reorder-level';

export type SettingsModule =
  | 'vendors'
  | 'customers'
  | 'categories';
