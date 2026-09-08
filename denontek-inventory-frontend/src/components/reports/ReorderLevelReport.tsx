import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface ReorderLevelReportProps {
  onBack: () => void;
}

export const ReorderLevelReport: React.FC<ReorderLevelReportProps> = ({ onBack }) => {
  const { components, categories, getComponentStockAsOfDate } = useInventory();
  const [selectedCategory, setSelectedCategory] = useState('');

  // Find components below reorder level (current stock <= reorder level)
  const lowStockComponents = components.filter((comp) => {
    const stock = getComponentStockAsOfDate(comp.id);
    const isBelow = stock <= comp.reorderLevel;
    const matchesCat = selectedCategory ? comp.categoryId === selectedCategory : true;
    return isBelow && matchesCat;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Reorder Level Alert</h2>
            <p className="text-[11px] text-slate-500">Components needing replenishment</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{lowStockComponents.length} alert{lowStockComponents.length !== 1 ? 's' : ''}</span>
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="p-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
              selectedCategory === ''
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {lowStockComponents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All Stock Levels Healthy!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No components are currently at or below their assigned reorder threshold.
            </p>
          </div>
        ) : (
          lowStockComponents.map((comp) => {
            const stock = getComponentStockAsOfDate(comp.id);
            const deficit = comp.reorderLevel - stock;
            const catName = categories.find((c) => c.id === comp.categoryId)?.name || 'Uncategorized';

            return (
              <div
                key={comp.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />

                <div className="flex items-start justify-between gap-2 pl-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded font-semibold border border-amber-200/60">
                        {comp.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {catName}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                      {comp.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      <span className="text-slate-500">
                        Reorder Threshold: <strong className="font-semibold text-slate-700">{comp.reorderLevel}</strong>
                      </span>
                      {deficit > 0 && (
                        <span className="text-red-600 font-bold">
                          (Short by {deficit} units)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-amber-600">
                      {stock}
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Reorder Now
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
