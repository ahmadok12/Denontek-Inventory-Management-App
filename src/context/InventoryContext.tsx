import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  ComponentItem,
  FinishedItem,
  Configuration,
  AssemblyRun,
  StockIn,
  StockOut,
  Vendor,
  Customer,
  ComponentCategory,
  MovementEntry,
  ConfigComponentRow,
} from '../types';
import {
  initialCategories,
  initialVendors,
  initialCustomers,
  initialComponents,
  initialFinishedItems,
  initialConfigurations,
  initialStockIns,
  initialAssemblyRuns,
  initialStockOuts,
} from '../data/initialData';

interface InventoryContextType {
  // Data lists
  categories: ComponentCategory[];
  vendors: Vendor[];
  customers: Customer[];
  components: ComponentItem[];
  finishedItems: FinishedItem[];
  configurations: Configuration[];
  assemblyRuns: AssemblyRun[];
  stockIns: StockIn[];
  stockOuts: StockOut[];

  // ID generators
  generateId: (type: 'component' | 'finished' | 'config' | 'assembly' | 'stockin' | 'stockout' | 'vendor' | 'customer' | 'category') => string;

  // CRUD Components
  addComponent: (item: Omit<ComponentItem, 'createdAt'>) => { success: boolean; message?: string };
  updateComponent: (item: ComponentItem) => { success: boolean; message?: string };
  deleteComponent: (id: string) => { success: boolean; message?: string };

  // CRUD Finished Items
  addFinishedItem: (item: Omit<FinishedItem, 'createdAt'>) => { success: boolean; message?: string };
  updateFinishedItem: (item: FinishedItem) => { success: boolean; message?: string };
  deleteFinishedItem: (id: string) => { success: boolean; message?: string };

  // CRUD Configurations
  addConfiguration: (item: Omit<Configuration, 'createdAt'>) => void;
  updateConfiguration: (item: Configuration) => void;
  deleteConfiguration: (id: string) => { success: boolean; message?: string };
  getConfigurationByFinishedItem: (finishedItemId: string) => Configuration | undefined;
  saveConfigurationForFinishedItem: (finishedItemId: string, components: ConfigComponentRow[], details?: string) => void;

  // CRUD Assembly
  addAssemblyRun: (item: Omit<AssemblyRun, 'createdAt'>) => { success: boolean; message?: string };
  updateAssemblyRun: (item: AssemblyRun) => { success: boolean; message?: string };
  deleteAssemblyRun: (id: string) => { success: boolean; message?: string };

  // CRUD Stock In
  addStockIn: (item: Omit<StockIn, 'createdAt'>) => void;
  updateStockIn: (item: StockIn) => { success: boolean; message?: string };
  deleteStockIn: (id: string) => { success: boolean; message?: string };

  // CRUD Stock Out
  addStockOut: (item: Omit<StockOut, 'createdAt'>) => { success: boolean; message?: string };
  updateStockOut: (item: StockOut) => { success: boolean; message?: string };
  deleteStockOut: (id: string) => void;

  // CRUD Vendors
  addVendor: (item: Omit<Vendor, 'createdAt'>) => void;
  updateVendor: (item: Vendor) => void;
  deleteVendor: (id: string) => { success: boolean; message?: string };

  // CRUD Customers
  addCustomer: (item: Omit<Customer, 'createdAt'>) => void;
  updateCustomer: (item: Customer) => void;
  deleteCustomer: (id: string) => { success: boolean; message?: string };

  // CRUD Categories
  addCategory: (item: Omit<ComponentCategory, 'createdAt'>) => void;
  updateCategory: (item: ComponentCategory) => void;
  deleteCategory: (id: string) => { success: boolean; message?: string };

  // Stock calculations
  getComponentStockAsOfDate: (componentId: string, asOfDate?: string) => number;
  getFinishedItemStockAsOfDate: (finishedItemId: string, asOfDate?: string) => number;
  getComponentMovementLedger: (componentId: string, fromDate?: string, toDate?: string) => MovementEntry[];
  getFinishedItemMovementLedger: (finishedItemId: string, fromDate?: string, toDate?: string) => MovementEntry[];
  isComponentBelowReorder: (componentId: string, asOfDate?: string) => boolean;

  // Global actions
  resetToSampleData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_PREFIX = 'denontek_inventory_v2_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);

    // Migration for StockIn (single item to items array)
    if (key === 'stockIns' && Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        if (!item.items && item.componentId) {
          return {
            id: item.id,
            date: item.date,
            vendorId: item.vendorId,
            items: [{ componentId: item.componentId, qty: item.qty || 0 }],
            details: item.details || '',
            createdAt: item.createdAt,
          };
        }
        return item;
      }) as unknown as T;
    }

    // Migration for StockOut (single item to items array)
    if (key === 'stockOuts' && Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        if (!item.items && item.finishedItemId) {
          return {
            id: item.id,
            date: item.date,
            customerId: item.customerId,
            items: [{ finishedItemId: item.finishedItemId, qty: item.qty || 0 }],
            details: item.details || '',
            createdAt: item.createdAt,
          };
        }
        return item;
      }) as unknown as T;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<ComponentCategory[]>(() =>
    loadFromStorage('categories', initialCategories)
  );
  const [vendors, setVendors] = useState<Vendor[]>(() =>
    loadFromStorage('vendors', initialVendors)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage('customers', initialCustomers)
  );
  const [components, setComponents] = useState<ComponentItem[]>(() =>
    loadFromStorage('components', initialComponents)
  );
  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>(() =>
    loadFromStorage('finishedItems', initialFinishedItems)
  );
  const [configurations, setConfigurations] = useState<Configuration[]>(() =>
    loadFromStorage('configurations', initialConfigurations)
  );
  const [assemblyRuns, setAssemblyRuns] = useState<AssemblyRun[]>(() =>
    loadFromStorage('assemblyRuns', initialAssemblyRuns)
  );
  const [stockIns, setStockIns] = useState<StockIn[]>(() =>
    loadFromStorage('stockIns', initialStockIns)
  );
  const [stockOuts, setStockOuts] = useState<StockOut[]>(() =>
    loadFromStorage('stockOuts', initialStockOuts)
  );

  // Sync state to localStorage
  useEffect(() => { saveToStorage('categories', categories); }, [categories]);
  useEffect(() => { saveToStorage('vendors', vendors); }, [vendors]);
  useEffect(() => { saveToStorage('customers', customers); }, [customers]);
  useEffect(() => { saveToStorage('components', components); }, [components]);
  useEffect(() => { saveToStorage('finishedItems', finishedItems); }, [finishedItems]);
  useEffect(() => { saveToStorage('configurations', configurations); }, [configurations]);
  useEffect(() => { saveToStorage('assemblyRuns', assemblyRuns); }, [assemblyRuns]);
  useEffect(() => { saveToStorage('stockIns', stockIns); }, [stockIns]);
  useEffect(() => { saveToStorage('stockOuts', stockOuts); }, [stockOuts]);

  // ID generator
  const generateId = (type: 'component' | 'finished' | 'config' | 'assembly' | 'stockin' | 'stockout' | 'vendor' | 'customer' | 'category') => {
    let prefix = 'ID';
    let items: { id: string }[] = [];

    switch (type) {
      case 'component':
        prefix = 'CMP';
        items = components;
        break;
      case 'finished':
        prefix = 'FIN';
        items = finishedItems;
        break;
      case 'config':
        prefix = 'CFG';
        items = configurations;
        break;
      case 'assembly':
        prefix = 'ASM';
        items = assemblyRuns;
        break;
      case 'stockin':
        prefix = 'IN';
        items = stockIns;
        break;
      case 'stockout':
        prefix = 'OUT';
        items = stockOuts;
        break;
      case 'vendor':
        prefix = 'VND';
        items = vendors;
        break;
      case 'customer':
        prefix = 'CST';
        items = customers;
        break;
      case 'category':
        prefix = 'CAT';
        items = categories;
        break;
    }

    let maxNum = 0;
    for (const item of items) {
      const match = item.id.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  };

  // Stock Calculations
  const getComponentStockAsOfDate = (componentId: string, asOfDate?: string): number => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return 0;

    let stock = Number(comp.openingQty) || 0;
    const targetDate = asOfDate || '9999-12-31';

    // Add stock in across all multi-component vouchers
    for (const inVoucher of stockIns) {
      if (inVoucher.date <= targetDate && Array.isArray(inVoucher.items)) {
        for (const item of inVoucher.items) {
          if (item.componentId === componentId) {
            stock += Number(item.qty) || 0;
          }
        }
      }
    }

    // Subtract assembly consumption
    for (const asm of assemblyRuns) {
      if (asm.date <= targetDate) {
        for (const row of asm.components) {
          if (row.componentId === componentId) {
            stock -= Number(row.qty) || 0;
          }
        }
      }
    }

    return stock;
  };

  const getFinishedItemStockAsOfDate = (finishedItemId: string, asOfDate?: string): number => {
    const item = finishedItems.find((f) => f.id === finishedItemId);
    if (!item) return 0;

    let stock = Number(item.openingQty) || 0;
    const targetDate = asOfDate || '9999-12-31';

    // Add assembly runs output
    for (const asm of assemblyRuns) {
      if (asm.finishedItemId === finishedItemId && asm.date <= targetDate) {
        stock += Number(asm.finishedItemQty) || 0;
      }
    }

    // Subtract stock outs across all multi-finished goods vouchers
    for (const outVoucher of stockOuts) {
      if (outVoucher.date <= targetDate && Array.isArray(outVoucher.items)) {
        for (const item of outVoucher.items) {
          if (item.finishedItemId === finishedItemId) {
            stock -= Number(item.qty) || 0;
          }
        }
      }
    }

    return stock;
  };

  const isComponentBelowReorder = (componentId: string, asOfDate?: string): boolean => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return false;
    const currentStock = getComponentStockAsOfDate(componentId, asOfDate);
    return currentStock <= comp.reorderLevel;
  };

  // CRUD Handlers
  const addComponent = (item: Omit<ComponentItem, 'createdAt'>) => {
    if (item.openingQty < 0) {
      return { success: false, message: 'Opening quantity cannot be negative.' };
    }
    const newItem: ComponentItem = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setComponents((prev) => [newItem, ...prev]);
    return { success: true };
  };

  const updateComponent = (item: ComponentItem) => {
    if (item.openingQty < 0) {
      return { success: false, message: 'Opening quantity cannot be negative.' };
    }
    const prev = components.find((c) => c.id === item.id);
    if (prev) {
      const diff = item.openingQty - prev.openingQty;
      const currentStock = getComponentStockAsOfDate(item.id);
      if (currentStock + diff < 0) {
        return {
          success: false,
          message: `Cannot reduce opening quantity. Available stock of "${item.name}" would become negative (${currentStock + diff} units).`,
        };
      }
    }
    setComponents((prev) => prev.map((c) => (c.id === item.id ? item : c)));
    return { success: true };
  };

  const deleteComponent = (id: string) => {
    const isUsedInConfig = configurations.some((c) => c.components.some((row) => row.componentId === id));
    const isUsedInStockIn = stockIns.some((s) => s.items.some((row) => row.componentId === id));
    const isUsedInAssembly = assemblyRuns.some((a) => a.components.some((row) => row.componentId === id));

    if (isUsedInConfig || isUsedInStockIn || isUsedInAssembly) {
      return {
        success: false,
        message: 'This component is referenced in BOM configurations, stock-in receipts, or assembly history.',
      };
    }
    setComponents((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  const addFinishedItem = (item: Omit<FinishedItem, 'createdAt'>) => {
    if (item.openingQty < 0) {
      return { success: false, message: 'Opening quantity cannot be negative.' };
    }
    const newItem: FinishedItem = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setFinishedItems((prev) => [newItem, ...prev]);
    return { success: true };
  };

  const updateFinishedItem = (item: FinishedItem) => {
    if (item.openingQty < 0) {
      return { success: false, message: 'Opening quantity cannot be negative.' };
    }
    const prev = finishedItems.find((f) => f.id === item.id);
    if (prev) {
      const diff = item.openingQty - prev.openingQty;
      const currentStock = getFinishedItemStockAsOfDate(item.id);
      if (currentStock + diff < 0) {
        return {
          success: false,
          message: `Cannot reduce opening quantity. Available stock of "${item.name}" would become negative (${currentStock + diff} units).`,
        };
      }
    }
    setFinishedItems((prev) => prev.map((f) => (f.id === item.id ? item : f)));
    return { success: true };
  };

  const deleteFinishedItem = (id: string) => {
    const isUsedInConfig = configurations.some((c) => c.finishedItemId === id);
    const isUsedInAssembly = assemblyRuns.some((a) => a.finishedItemId === id);
    const isUsedInStockOut = stockOuts.some((s) => s.items.some((row) => row.finishedItemId === id));

    if (isUsedInConfig || isUsedInAssembly || isUsedInStockOut) {
      return {
        success: false,
        message: 'This finished item is used in BOM configuration, assembly runs, or stock-out orders. Remove those references first.',
      };
    }
    setFinishedItems((prev) => prev.filter((f) => f.id !== id));
    return { success: true };
  };

  const addConfiguration = (item: Omit<Configuration, 'createdAt'>) => {
    const newItem: Configuration = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setConfigurations((prev) => [newItem, ...prev]);
  };

  const updateConfiguration = (item: Configuration) => {
    setConfigurations((prev) => prev.map((cfg) => (cfg.id === item.id ? item : cfg)));
  };

  const deleteConfiguration = (id: string) => {
    setConfigurations((prev) => prev.filter((cfg) => cfg.id !== id));
    return { success: true };
  };

  const getConfigurationByFinishedItem = (finishedItemId: string) => {
    return configurations.find((c) => c.finishedItemId === finishedItemId);
  };

  const saveConfigurationForFinishedItem = (
    finishedItemId: string,
    componentsList: ConfigComponentRow[],
    details = ''
  ) => {
    const existing = configurations.find((c) => c.finishedItemId === finishedItemId);
    if (existing) {
      updateConfiguration({
        ...existing,
        components: componentsList,
        details: details || existing.details,
      });
    } else {
      const newConfigId = generateId('config');
      addConfiguration({
        id: newConfigId,
        finishedItemId,
        components: componentsList,
        details: details || `BOM created from assembly run template.`,
      });
    }
  };

  const addAssemblyRun = (item: Omit<AssemblyRun, 'createdAt'>) => {
    // Validate component stock
    const qtyByComponent: Record<string, number> = {};
    for (const row of item.components) {
      qtyByComponent[row.componentId] = (qtyByComponent[row.componentId] || 0) + row.qty;
    }
    for (const [compId, reqQty] of Object.entries(qtyByComponent)) {
      const currentStock = getComponentStockAsOfDate(compId);
      if (reqQty > currentStock) {
        const comp = components.find((c) => c.id === compId);
        return {
          success: false,
          message: `Insufficient stock for component "${comp?.name || compId}". Required: ${reqQty} units, Available in stock: ${currentStock} units. Negative stock is not permitted.`,
        };
      }
    }
    const newItem: AssemblyRun = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setAssemblyRuns((prev) => [newItem, ...prev]);
    return { success: true };
  };

  const updateAssemblyRun = (item: AssemblyRun) => {
    const prevRun = assemblyRuns.find((a) => a.id === item.id);
    const qtyByComponent: Record<string, number> = {};
    for (const row of item.components) {
      qtyByComponent[row.componentId] = (qtyByComponent[row.componentId] || 0) + row.qty;
    }
    for (const [compId, reqQty] of Object.entries(qtyByComponent)) {
      let available = getComponentStockAsOfDate(compId);
      if (prevRun && Array.isArray(prevRun.components)) {
        for (const row of prevRun.components) {
          if (row.componentId === compId) {
            available += Number(row.qty) || 0;
          }
        }
      }
      if (reqQty > available) {
        const comp = components.find((c) => c.id === compId);
        return {
          success: false,
          message: `Insufficient stock for component "${comp?.name || compId}". Required: ${reqQty} units, Available: ${available} units. Negative stock is not permitted.`,
        };
      }
    }
    // Check finished item stock if output quantity reduced
    if (prevRun && prevRun.finishedItemId === item.finishedItemId) {
      const diff = item.finishedItemQty - prevRun.finishedItemQty;
      const currentFinStock = getFinishedItemStockAsOfDate(item.finishedItemId);
      if (currentFinStock + diff < 0) {
        const fin = finishedItems.find((f) => f.id === item.finishedItemId);
        return {
          success: false,
          message: `Cannot reduce assembly output. Stock of "${fin?.name || item.finishedItemId}" would drop to ${currentFinStock + diff} units, which is negative.`,
        };
      }
    }
    setAssemblyRuns((prev) => prev.map((a) => (a.id === item.id ? item : a)));
    return { success: true };
  };

  const deleteAssemblyRun = (id: string) => {
    const run = assemblyRuns.find((a) => a.id === id);
    if (run) {
      const currentFinStock = getFinishedItemStockAsOfDate(run.finishedItemId);
      if (currentFinStock - run.finishedItemQty < 0) {
        const fin = finishedItems.find((f) => f.id === run.finishedItemId);
        return {
          success: false,
          message: `Cannot delete assembly run ${id}. Reversing this run would cause finished goods stock of "${fin?.name || run.finishedItemId}" to drop to ${currentFinStock - run.finishedItemQty} units, which is negative. Revert or adjust subsequent Stock Out vouchers first.`,
        };
      }
    }
    setAssemblyRuns((prev) => prev.filter((a) => a.id !== id));
    return { success: true };
  };

  const addStockIn = (item: Omit<StockIn, 'createdAt'>) => {
    const newItem: StockIn = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setStockIns((prev) => [newItem, ...prev]);
  };

  const updateStockIn = (item: StockIn) => {
    const prevVoucher = stockIns.find((s) => s.id === item.id);
    if (prevVoucher && Array.isArray(prevVoucher.items)) {
      const prevQtyByComp: Record<string, number> = {};
      for (const row of prevVoucher.items) {
        prevQtyByComp[row.componentId] = (prevQtyByComp[row.componentId] || 0) + row.qty;
      }
      const newQtyByComp: Record<string, number> = {};
      if (Array.isArray(item.items)) {
        for (const row of item.items) {
          newQtyByComp[row.componentId] = (newQtyByComp[row.componentId] || 0) + row.qty;
        }
      }
      for (const [compId, prevQty] of Object.entries(prevQtyByComp)) {
        const newQty = newQtyByComp[compId] || 0;
        const diff = newQty - prevQty;
        const currentStock = getComponentStockAsOfDate(compId);
        if (currentStock + diff < 0) {
          const comp = components.find((c) => c.id === compId);
          return {
            success: false,
            message: `Cannot reduce received quantity of "${comp?.name || compId}". Available stock would drop to ${currentStock + diff} units, which is negative.`,
          };
        }
      }
    }
    setStockIns((prev) => prev.map((s) => (s.id === item.id ? item : s)));
    return { success: true };
  };

  const deleteStockIn = (id: string) => {
    const voucher = stockIns.find((s) => s.id === id);
    if (voucher && Array.isArray(voucher.items)) {
      for (const item of voucher.items) {
        const currentStock = getComponentStockAsOfDate(item.componentId);
        if (currentStock - item.qty < 0) {
          const comp = components.find((c) => c.id === item.componentId);
          return {
            success: false,
            message: `Cannot delete Stock In voucher ${id}. Removing this receipt would cause stock of "${comp?.name || item.componentId}" to drop to ${currentStock - item.qty} units, which is negative. Please adjust assembly runs consuming this component first.`,
          };
        }
      }
    }
    setStockIns((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  const addStockOut = (item: Omit<StockOut, 'createdAt'>) => {
    const qtyByItem: Record<string, number> = {};
    if (Array.isArray(item.items)) {
      for (const row of item.items) {
        qtyByItem[row.finishedItemId] = (qtyByItem[row.finishedItemId] || 0) + row.qty;
      }
    }
    for (const [finId, reqQty] of Object.entries(qtyByItem)) {
      const currentStock = getFinishedItemStockAsOfDate(finId);
      if (reqQty > currentStock) {
        const fin = finishedItems.find((f) => f.id === finId);
        return {
          success: false,
          message: `Cannot dispatch ${reqQty} units of "${fin?.name || finId}". Available in stock: ${currentStock} units. Negative stock is not permitted.`,
        };
      }
    }
    const newItem: StockOut = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setStockOuts((prev) => [newItem, ...prev]);
    return { success: true };
  };

  const updateStockOut = (item: StockOut) => {
    const prevOut = stockOuts.find((s) => s.id === item.id);
    const qtyByItem: Record<string, number> = {};
    if (Array.isArray(item.items)) {
      for (const row of item.items) {
        qtyByItem[row.finishedItemId] = (qtyByItem[row.finishedItemId] || 0) + row.qty;
      }
    }
    for (const [finId, reqQty] of Object.entries(qtyByItem)) {
      let available = getFinishedItemStockAsOfDate(finId);
      if (prevOut && Array.isArray(prevOut.items)) {
        for (const row of prevOut.items) {
          if (row.finishedItemId === finId) {
            available += Number(row.qty) || 0;
          }
        }
      }
      if (reqQty > available) {
        const fin = finishedItems.find((f) => f.id === finId);
        return {
          success: false,
          message: `Cannot dispatch ${reqQty} units of "${fin?.name || finId}". Available in stock: ${available} units. Negative stock is not permitted.`,
        };
      }
    }
    setStockOuts((prev) => prev.map((s) => (s.id === item.id ? item : s)));
    return { success: true };
  };

  const deleteStockOut = (id: string) => {
    setStockOuts((prev) => prev.filter((s) => s.id !== id));
  };

  const addVendor = (item: Omit<Vendor, 'createdAt'>) => {
    const newItem: Vendor = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setVendors((prev) => [newItem, ...prev]);
  };

  const updateVendor = (item: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === item.id ? item : v)));
  };

  const deleteVendor = (id: string) => {
    const isUsedInStockIn = stockIns.some((s) => s.vendorId === id);
    if (isUsedInStockIn) {
      return {
        success: false,
        message: 'This vendor has existing Stock In transactions recorded. Please reassign or delete them first.',
      };
    }
    setVendors((prev) => prev.filter((v) => v.id !== id));
    return { success: true };
  };

  const addCustomer = (item: Omit<Customer, 'createdAt'>) => {
    const newItem: Customer = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newItem, ...prev]);
  };

  const updateCustomer = (item: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === item.id ? item : c)));
  };

  const deleteCustomer = (id: string) => {
    const isUsedInStockOut = stockOuts.some((s) => s.customerId === id);
    if (isUsedInStockOut) {
      return {
        success: false,
        message: 'This customer has existing Stock Out transactions recorded. Please reassign or delete them first.',
      };
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  const addCategory = (item: Omit<ComponentCategory, 'createdAt'>) => {
    const newItem: ComponentCategory = {
      ...item,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [newItem, ...prev]);
  };

  const updateCategory = (item: ComponentCategory) => {
    setCategories((prev) => prev.map((cat) => (cat.id === item.id ? item : cat)));
  };

  const deleteCategory = (id: string) => {
    const isUsedInComponents = components.some((c) => c.categoryId === id);
    if (isUsedInComponents) {
      return {
        success: false,
        message: 'Components are assigned to this category. Reassign them before deleting.',
      };
    }
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    return { success: true };
  };


  // 2-Column Ledger for Components
  const getComponentMovementLedger = (
    componentId: string,
    fromDate?: string,
    toDate?: string
  ): MovementEntry[] => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return [];

    const fDate = fromDate || '0000-00-00';
    const tDate = toDate || '9999-12-31';

    let initialBalance = Number(comp.openingQty) || 0;

    // Transactions before fDate
    for (const inVoucher of stockIns) {
      if (inVoucher.date < fDate && Array.isArray(inVoucher.items)) {
        for (const item of inVoucher.items) {
          if (item.componentId === componentId) {
            initialBalance += Number(item.qty) || 0;
          }
        }
      }
    }
    for (const asm of assemblyRuns) {
      if (asm.date < fDate) {
        for (const row of asm.components) {
          if (row.componentId === componentId) {
            initialBalance -= Number(row.qty) || 0;
          }
        }
      }
    }

    const ledger: MovementEntry[] = [];

    ledger.push({
      id: 'OP-ROW',
      date: fDate,
      type: 'OPENING',
      refNumber: 'OP-BAL',
      description: 'Opening Balance (as of ' + fDate + ')',
      qtyIn: initialBalance >= 0 ? initialBalance : 0,
      qtyOut: initialBalance < 0 ? Math.abs(initialBalance) : 0,
      balance: initialBalance,
    });

    type RawTx = {
      date: string;
      createdAt: string;
      type: 'STOCK_IN' | 'ASSEMBLY_OUT';
      refNumber: string;
      description: string;
      partyName?: string;
      qtyIn: number;
      qtyOut: number;
    };

    const rawTxs: RawTx[] = [];

    for (const inVoucher of stockIns) {
      if (inVoucher.date >= fDate && inVoucher.date <= tDate && Array.isArray(inVoucher.items)) {
        for (const item of inVoucher.items) {
          if (item.componentId === componentId) {
            const vendor = vendors.find((v) => v.id === inVoucher.vendorId);
            rawTxs.push({
              date: inVoucher.date,
              createdAt: inVoucher.createdAt,
              type: 'STOCK_IN',
              refNumber: inVoucher.id,
              description: inVoucher.details
                ? `Stock In (${inVoucher.id}): ${inVoucher.details}`
                : `Stock In (${inVoucher.id})`,
              partyName: vendor ? vendor.name : 'Unknown Vendor',
              qtyIn: Number(item.qty) || 0,
              qtyOut: 0,
            });
          }
        }
      }
    }

    for (const asm of assemblyRuns) {
      if (asm.date >= fDate && asm.date <= tDate) {
        for (const row of asm.components) {
          if (row.componentId === componentId) {
            const fin = finishedItems.find((f) => f.id === asm.finishedItemId);
            rawTxs.push({
              date: asm.date,
              createdAt: asm.createdAt,
              type: 'ASSEMBLY_OUT',
              refNumber: asm.id,
              description: `Assembly (${asm.id}) for ${asm.finishedItemQty}x ${fin?.name || 'Finished Item'}`,
              partyName: 'Internal Production',
              qtyIn: 0,
              qtyOut: Number(row.qty) || 0,
            });
          }
        }
      }
    }

    rawTxs.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.createdAt.localeCompare(b.createdAt);
    });

    let currentBalance = initialBalance;
    for (const tx of rawTxs) {
      currentBalance = currentBalance + tx.qtyIn - tx.qtyOut;
      ledger.push({
        id: tx.refNumber + '-' + tx.date + '-' + Math.random().toString(36).substr(2, 4),
        date: tx.date,
        type: tx.type,
        refNumber: tx.refNumber,
        description: tx.description,
        partyName: tx.partyName,
        qtyIn: tx.qtyIn,
        qtyOut: tx.qtyOut,
        balance: currentBalance,
      });
    }

    return ledger;
  };

  // 2-Column Ledger for Finished Items
  const getFinishedItemMovementLedger = (
    finishedItemId: string,
    fromDate?: string,
    toDate?: string
  ): MovementEntry[] => {
    const item = finishedItems.find((f) => f.id === finishedItemId);
    if (!item) return [];

    const fDate = fromDate || '0000-00-00';
    const tDate = toDate || '9999-12-31';

    let initialBalance = Number(item.openingQty) || 0;

    for (const asm of assemblyRuns) {
      if (asm.finishedItemId === finishedItemId && asm.date < fDate) {
        initialBalance += Number(asm.finishedItemQty) || 0;
      }
    }

    for (const outVoucher of stockOuts) {
      if (outVoucher.date < fDate && Array.isArray(outVoucher.items)) {
        for (const outItem of outVoucher.items) {
          if (outItem.finishedItemId === finishedItemId) {
            initialBalance -= Number(outItem.qty) || 0;
          }
        }
      }
    }

    const ledger: MovementEntry[] = [];

    ledger.push({
      id: 'OP-ROW-FIN',
      date: fDate,
      type: 'OPENING',
      refNumber: 'OP-BAL',
      description: 'Opening Balance (as of ' + fDate + ')',
      qtyIn: initialBalance >= 0 ? initialBalance : 0,
      qtyOut: initialBalance < 0 ? Math.abs(initialBalance) : 0,
      balance: initialBalance,
    });

    type RawTx = {
      date: string;
      createdAt: string;
      type: 'ASSEMBLY_IN' | 'STOCK_OUT';
      refNumber: string;
      description: string;
      partyName?: string;
      qtyIn: number;
      qtyOut: number;
    };

    const rawTxs: RawTx[] = [];

    for (const asm of assemblyRuns) {
      if (asm.finishedItemId === finishedItemId && asm.date >= fDate && asm.date <= tDate) {
        rawTxs.push({
          date: asm.date,
          createdAt: asm.createdAt,
          type: 'ASSEMBLY_IN',
          refNumber: asm.id,
          description: asm.details ? `Assembly Run: ${asm.details}` : 'Assembled from Components',
          partyName: 'Assembly Line',
          qtyIn: Number(asm.finishedItemQty) || 0,
          qtyOut: 0,
        });
      }
    }

    for (const outVoucher of stockOuts) {
      if (outVoucher.date >= fDate && outVoucher.date <= tDate && Array.isArray(outVoucher.items)) {
        for (const outItem of outVoucher.items) {
          if (outItem.finishedItemId === finishedItemId) {
            const cust = customers.find((c) => c.id === outVoucher.customerId);
            rawTxs.push({
              date: outVoucher.date,
              createdAt: outVoucher.createdAt,
              type: 'STOCK_OUT',
              refNumber: outVoucher.id,
              description: outVoucher.details
                ? `Stock Out (${outVoucher.id}): ${outVoucher.details}`
                : `Stock Out (${outVoucher.id})`,
              partyName: cust ? cust.name : 'Unknown Customer',
              qtyIn: 0,
              qtyOut: Number(outItem.qty) || 0,
            });
          }
        }
      }
    }

    rawTxs.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.createdAt.localeCompare(b.createdAt);
    });

    let currentBalance = initialBalance;
    for (const tx of rawTxs) {
      currentBalance = currentBalance + tx.qtyIn - tx.qtyOut;
      ledger.push({
        id: tx.refNumber + '-' + tx.date + '-' + Math.random().toString(36).substr(2, 4),
        date: tx.date,
        type: tx.type,
        refNumber: tx.refNumber,
        description: tx.description,
        partyName: tx.partyName,
        qtyIn: tx.qtyIn,
        qtyOut: tx.qtyOut,
        balance: currentBalance,
      });
    }

    return ledger;
  };

  const resetToSampleData = () => {
    setCategories(initialCategories);
    setVendors(initialVendors);
    setCustomers(initialCustomers);
    setComponents(initialComponents);
    setFinishedItems(initialFinishedItems);
    setConfigurations(initialConfigurations);
    setAssemblyRuns(initialAssemblyRuns);
    setStockIns(initialStockIns);
    setStockOuts(initialStockOuts);

    localStorage.removeItem(STORAGE_PREFIX + 'categories');
    localStorage.removeItem(STORAGE_PREFIX + 'vendors');
    localStorage.removeItem(STORAGE_PREFIX + 'customers');
    localStorage.removeItem(STORAGE_PREFIX + 'components');
    localStorage.removeItem(STORAGE_PREFIX + 'finishedItems');
    localStorage.removeItem(STORAGE_PREFIX + 'configurations');
    localStorage.removeItem(STORAGE_PREFIX + 'assemblyRuns');
    localStorage.removeItem(STORAGE_PREFIX + 'stockIns');
    localStorage.removeItem(STORAGE_PREFIX + 'stockOuts');
  };

  const exportDatabaseJson = () => {
    const data = {
      categories,
      vendors,
      customers,
      components,
      finishedItems,
      configurations,
      assemblyRuns,
      stockIns,
      stockOuts,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.components && data.finishedItems) {
        if (data.categories) setCategories(data.categories);
        if (data.vendors) setVendors(data.vendors);
        if (data.customers) setCustomers(data.customers);
        if (data.components) setComponents(data.components);
        if (data.finishedItems) setFinishedItems(data.finishedItems);
        if (data.configurations) setConfigurations(data.configurations);
        if (data.assemblyRuns) setAssemblyRuns(data.assemblyRuns);
        if (data.stockIns) setStockIns(data.stockIns);
        if (data.stockOuts) setStockOuts(data.stockOuts);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        categories,
        vendors,
        customers,
        components,
        finishedItems,
        configurations,
        assemblyRuns,
        stockIns,
        stockOuts,
        generateId,
        addComponent,
        updateComponent,
        deleteComponent,
        addFinishedItem,
        updateFinishedItem,
        deleteFinishedItem,
        addConfiguration,
        updateConfiguration,
        deleteConfiguration,
        getConfigurationByFinishedItem,
        saveConfigurationForFinishedItem,
        addAssemblyRun,
        updateAssemblyRun,
        deleteAssemblyRun,
        addStockIn,
        updateStockIn,
        deleteStockIn,
        addStockOut,
        updateStockOut,
        deleteStockOut,
        addVendor,
        updateVendor,
        deleteVendor,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCategory,
        updateCategory,
        deleteCategory,
        getComponentStockAsOfDate,
        getFinishedItemStockAsOfDate,
        getComponentMovementLedger,
        getFinishedItemMovementLedger,
        isComponentBelowReorder,
        resetToSampleData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
