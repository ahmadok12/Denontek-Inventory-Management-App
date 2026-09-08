import React, { useState } from 'react';
import {
  Cpu,
  Package,
  Layers,
  Hammer,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { HomeModule } from '../../types';
import { ComponentsManager } from './ComponentsManager';
import { FinishedItemsManager } from './FinishedItemsManager';
import { ConfigurationManager } from './ConfigurationManager';
import { RunAssemblyManager } from './RunAssemblyManager';
import { StockInManager } from './StockInManager';
import { StockOutManager } from './StockOutManager';

export const HomeScreen: React.FC = () => {
  const [activeModule, setActiveModule] = useState<HomeModule | null>(null);

  const {
    components,
    finishedItems,
    configurations,
    assemblyRuns,
    stockIns,
    stockOuts,
    isComponentBelowReorder,
  } = useInventory();

  // Low stock counter
  const lowStockCount = components.filter((c) => isComponentBelowReorder(c.id)).length;

  if (activeModule === 'components') {
    return <ComponentsManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'finished-items') {
    return <FinishedItemsManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'configuration') {
    return <ConfigurationManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'run-assembly') {
    return <RunAssemblyManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'stock-in') {
    return <StockInManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'stock-out') {
    return <StockOutManager onBack={() => setActiveModule(null)} />;
  }

  const buttons = [
    {
      id: 'components' as HomeModule,
      title: 'Components',
      desc: `${components.length} Raw items`,
      icon: Cpu,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'finished-items' as HomeModule,
      title: 'Finished Items',
      desc: `${finishedItems.length} Products`,
      icon: Package,
    },
    {
      id: 'configuration' as HomeModule,
      title: 'Configuration',
      desc: `${configurations.length} BOM setups`,
      icon: Layers,
    },
    {
      id: 'run-assembly' as HomeModule,
      title: 'Run Assembly',
      desc: `${assemblyRuns.length} Runs logged`,
      icon: Hammer,
    },
    {
      id: 'stock-in' as HomeModule,
      title: 'Stock In',
      desc: `${stockIns.length} Receipts`,
      icon: ArrowDownRight,
    },
    {
      id: 'stock-out' as HomeModule,
      title: 'Stock Out',
      desc: `${stockOuts.length} Dispatches`,
      icon: ArrowUpRight,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Welcome Card */}
      <div className="p-4 bg-white border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Inventory Dashboard
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Denontek Operations
            </h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Warning Banner if applicable */}
        {lowStockCount > 0 && (
          <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{lowStockCount} component{lowStockCount > 1 ? 's' : ''} below reorder level</span>
            </div>
            <span className="text-[11px] font-bold text-amber-700">Check Reports</span>
          </div>
        )}
      </div>

      {/* 2-in-a-row Square Buttons Grid */}
      <div className="p-4 flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Quick Modules
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                type="button"
                key={btn.id}
                onClick={() => setActiveModule(btn.id)}
                className="aspect-square bg-white hover:bg-slate-50/80 active:scale-[0.98] border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between text-left shadow-xs transition-all duration-150 cursor-pointer group relative overflow-hidden"
              >
                {/* Top Row: Icon + Optional Badge */}
                <div className="flex items-start justify-between w-full">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200/70 text-slate-800 flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  {btn.badge ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${btn.badgeColor}`}
                    >
                      {btn.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>

                {/* Bottom Row: Title + Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 leading-snug">
                    {btn.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{btn.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
