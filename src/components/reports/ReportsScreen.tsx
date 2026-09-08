import React, { useState } from 'react';
import {
  FileText,
  BarChart3,
  Layers,
  ArrowLeftRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { ReportModule } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { ComponentsQuantityReport } from './ComponentsQuantityReport';
import { FinishedItemsQuantityReport } from './FinishedItemsQuantityReport';
import { ComponentsMovementsReport } from './ComponentsMovementsReport';
import { FinishedItemMovementReport } from './FinishedItemMovementReport';
import { ReorderLevelReport } from './ReorderLevelReport';

export const ReportsScreen: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportModule | null>(null);
  const { components, isComponentBelowReorder } = useInventory();

  const lowStockCount = components.filter((c) => isComponentBelowReorder(c.id)).length;

  if (activeReport === 'components-quantity') {
    return <ComponentsQuantityReport onBack={() => setActiveReport(null)} />;
  }
  if (activeReport === 'finished-items-quantity') {
    return <FinishedItemsQuantityReport onBack={() => setActiveReport(null)} />;
  }
  if (activeReport === 'components-movements') {
    return <ComponentsMovementsReport onBack={() => setActiveReport(null)} />;
  }
  if (activeReport === 'finished-item-movement') {
    return <FinishedItemMovementReport onBack={() => setActiveReport(null)} />;
  }
  if (activeReport === 'reorder-level') {
    return <ReorderLevelReport onBack={() => setActiveReport(null)} />;
  }

  const reports = [
    {
      id: 'components-quantity' as ReportModule,
      title: 'Components Quantity',
      desc: 'Point-in-time stock and reorder levels by category',
      icon: Layers,
      badge: `${components.length} components`,
    },
    {
      id: 'finished-items-quantity' as ReportModule,
      title: 'Finished Items Quantity',
      desc: 'Inventory position as of selected date',
      icon: BarChart3,
    },
    {
      id: 'components-movements' as ReportModule,
      title: 'Components Movements',
      desc: '2-column In/Out ledger, assemblies, and balances',
      icon: ArrowLeftRight,
    },
    {
      id: 'finished-item-movement' as ReportModule,
      title: 'Finished Item Movement',
      desc: 'Assembly production vs customer dispatches',
      icon: FileText,
    },
    {
      id: 'reorder-level' as ReportModule,
      title: 'Reorder Level',
      desc: 'Components currently at or below safety stock',
      icon: ShieldAlert,
      badge: lowStockCount > 0 ? `${lowStockCount} below level` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200/80">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
          Analytics &amp; Audits
        </span>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Reports &amp; Ledgers
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select any report to inspect balances, date filters, or 2-column ledgers.
        </p>
      </div>

      {/* Buttons List */}
      <div className="p-4 flex-1 space-y-3">
        {reports.map((report) => {
          const Icon = report.icon;

          return (
            <button
              type="button"
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className="w-full bg-white hover:bg-slate-50/80 active:scale-[0.99] border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between text-left shadow-xs transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-slate-200/70 text-slate-800 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 truncate">
                      {report.title}
                    </h3>
                    {report.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                          report.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {report.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                    {report.desc}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
