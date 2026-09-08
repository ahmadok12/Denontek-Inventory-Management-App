import type {
  ComponentCategory,
  Vendor,
  Customer,
  ComponentItem,
  FinishedItem,
  Configuration,
  AssemblyRun,
  StockIn,
  StockOut,
} from '../types';

export const initialCategories: ComponentCategory[] = [
  { id: 'CAT-001', name: 'Sensing Coils & Cores', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CAT-002', name: 'Sensor ICs & Electronics', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CAT-003', name: 'Threaded Metal Barrels', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CAT-004', name: 'Cables & Connectors', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CAT-005', name: 'Hardware & Fasteners', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CAT-006', name: 'Encapsulation & Optics', createdAt: '2026-08-01T08:00:00.000Z' },
];

export const initialVendors: Vendor[] = [
  { id: 'VND-001', name: 'Hansson Sensing Components Co.', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'VND-002', name: 'Precision Metal & Barrels Ltd', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'VND-003', name: 'Polymeric Resins & Plastics Inc', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'VND-004', name: 'Murata & Core Magnetics', createdAt: '2026-08-01T08:00:00.000Z' },
];

export const initialCustomers: Customer[] = [
  { id: 'CST-001', name: 'Apex Automation & Conveyors Ltd', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CST-002', name: 'Robotic Systems & Tooling Inc', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'CST-003', name: 'PakTech Packaging Machinery', createdAt: '2026-08-01T08:00:00.000Z' },
];

export const initialComponents: ComponentItem[] = [
  {
    id: 'CMP-001',
    name: 'M12 Ferrite Core & Oscillator Coil',
    categoryId: 'CAT-001',
    openingQty: 250,
    reorderLevel: 50,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-002',
    name: 'M18 High-Q Sensing Coil Assembly',
    categoryId: 'CAT-001',
    openingQty: 180,
    reorderLevel: 40,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-003',
    name: 'Inductive Sensor ASIC / Trigger IC',
    categoryId: 'CAT-002',
    openingQty: 300,
    reorderLevel: 60,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-004',
    name: 'PNP/NPN Output Switching Transistors',
    categoryId: 'CAT-002',
    openingQty: 400,
    reorderLevel: 80,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-005',
    name: 'M12 Nickel-Plated Brass Barrel (50mm)',
    categoryId: 'CAT-003',
    openingQty: 200,
    reorderLevel: 40,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-006',
    name: 'M18 Stainless Steel Barrel (65mm)',
    categoryId: 'CAT-003',
    openingQty: 150,
    reorderLevel: 30,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-007',
    name: 'PBT Sensing Face Cap (Yellow)',
    categoryId: 'CAT-006',
    openingQty: 350,
    reorderLevel: 70,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-008',
    name: '3-Core Shielded PUR Sensor Cable (2m)',
    categoryId: 'CAT-004',
    openingQty: 220,
    reorderLevel: 50,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-009',
    name: 'M12 4-Pin Micro DC Male Connector',
    categoryId: 'CAT-004',
    openingQty: 160,
    reorderLevel: 35,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-010',
    name: 'Target Detection Indicator LED (Amber)',
    categoryId: 'CAT-002',
    openingQty: 500,
    reorderLevel: 100,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-011',
    name: 'M12 Mounting Hex Nut & Lock Washer Set',
    categoryId: 'CAT-005',
    openingQty: 600,
    reorderLevel: 120,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-012',
    name: 'M18 Mounting Hex Nut & Lock Washer Set',
    categoryId: 'CAT-005',
    openingQty: 400,
    reorderLevel: 80,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'CMP-013',
    name: 'Two-Part Epoxy Potting Compound (100ml)',
    categoryId: 'CAT-006',
    openingQty: 80,
    reorderLevel: 20,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
];

export const initialFinishedItems: FinishedItem[] = [
  {
    id: 'FIN-001',
    name: 'M12 Inductive Proximity Sensor (NPN NO, 4mm, 2m Cable)',
    openingQty: 45,
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'FIN-002',
    name: 'M18 Inductive Proximity Sensor (PNP NO, 8mm, M12 Plug)',
    openingQty: 30,
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'FIN-003',
    name: 'M18 Capacitive Proximity Sensor (Adjustable 10mm)',
    openingQty: 25,
    createdAt: '2026-08-01T10:00:00.000Z',
  },
];

export const initialConfigurations: Configuration[] = [
  {
    id: 'CFG-001',
    finishedItemId: 'FIN-001',
    components: [
      { componentId: 'CMP-001', qty: 1 },
      { componentId: 'CMP-003', qty: 1 },
      { componentId: 'CMP-004', qty: 1 },
      { componentId: 'CMP-005', qty: 1 },
      { componentId: 'CMP-007', qty: 1 },
      { componentId: 'CMP-008', qty: 1 },
      { componentId: 'CMP-010', qty: 1 },
      { componentId: 'CMP-011', qty: 2 },
      { componentId: 'CMP-013', qty: 1 },
    ],
    details: 'Standard BOM for M12 Inductive Proximity Sensor (2m integrated cable).',
    createdAt: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'CFG-002',
    finishedItemId: 'FIN-002',
    components: [
      { componentId: 'CMP-002', qty: 1 },
      { componentId: 'CMP-003', qty: 1 },
      { componentId: 'CMP-004', qty: 1 },
      { componentId: 'CMP-006', qty: 1 },
      { componentId: 'CMP-007', qty: 1 },
      { componentId: 'CMP-009', qty: 1 },
      { componentId: 'CMP-010', qty: 1 },
      { componentId: 'CMP-012', qty: 2 },
      { componentId: 'CMP-013', qty: 1 },
    ],
    details: 'Standard BOM for M18 Inductive Proximity Sensor with M12 quick-disconnect connector.',
    createdAt: '2026-08-02T10:30:00.000Z',
  },
];

export const initialStockIns: StockIn[] = [
  {
    id: 'IN-001',
    date: '2026-09-02',
    vendorId: 'VND-001',
    items: [
      { componentId: 'CMP-001', qty: 100 },
      { componentId: 'CMP-003', qty: 150 },
    ],
    details: 'Batch shipment of sensing coils and ASIC trigger ICs.',
    createdAt: '2026-09-02T11:00:00.000Z',
  },
  {
    id: 'IN-002',
    date: '2026-09-03',
    vendorId: 'VND-002',
    items: [
      { componentId: 'CMP-005', qty: 80 },
      { componentId: 'CMP-006', qty: 60 },
    ],
    details: 'Machined M12 and M18 barrels restock.',
    createdAt: '2026-09-03T11:00:00.000Z',
  },
];

export const initialAssemblyRuns: AssemblyRun[] = [
  {
    id: 'ASM-001',
    date: '2026-09-04',
    finishedItemId: 'FIN-001',
    finishedItemQty: 15,
    components: [
      { componentId: 'CMP-001', qty: 15 },
      { componentId: 'CMP-003', qty: 15 },
      { componentId: 'CMP-004', qty: 15 },
      { componentId: 'CMP-005', qty: 15 },
      { componentId: 'CMP-007', qty: 15 },
      { componentId: 'CMP-008', qty: 15 },
      { componentId: 'CMP-010', qty: 15 },
      { componentId: 'CMP-011', qty: 30 },
      { componentId: 'CMP-013', qty: 15 },
    ],
    details: 'Production batch of 15 units M12 Inductive Proximity Sensors.',
    createdAt: '2026-09-04T14:30:00.000Z',
  },
];

export const initialStockOuts: StockOut[] = [
  {
    id: 'OUT-001',
    date: '2026-09-06',
    customerId: 'CST-001',
    items: [
      { finishedItemId: 'FIN-001', qty: 5 },
    ],
    details: 'Dispatched to Apex Automation for conveyor sorting project.',
    createdAt: '2026-09-06T16:00:00.000Z',
  },
];
