import React, { useState } from 'react';
import { ArrowLeft, Calendar, Cpu, AlertTriangle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface ComponentsQuantityReportProps {
  onBack: () => void;
}

export const ComponentsQuantityReport: React.FC<ComponentsQuantityReportProps> = ({ onBack }) => {
  const { components, categories, getComponentStockAsOfDate } = useInventory();

  // Date filter (keep it today by default)
  const todayStr = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(todayStr);
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredComponents = components.filter((comp) => {
    return selectedCategory ? comp.categoryId === selectedCategory : true;
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Components Quantity</h2>
            <p className="text-[11px] text-slate-500">Stock position as of selected date</p>
          </div>
        </div>
      </div>

      {/* Filters (Date + Category) */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-2.5">
        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>As of Date:</span>
          </div>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
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

      {/* Table / Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No components in this category</p>
          </div>
        ) : (
          filteredComponents.map((comp) => {
            const stock = getComponentStockAsOfDate(comp.id, asOfDate);
            const isLow = stock <= comp.reorderLevel;
            const catName = categories.find((c) => c.id === comp.categoryId)?.name || 'Uncategorized';

            return (
              <div
                key={comp.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                      {comp.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {catName}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{comp.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span>Opening: <strong>{comp.openingQty}</strong></span>
                    <span>·</span>
                    <span>Reorder Level: <strong>{comp.reorderLevel}</strong></span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-base font-black ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                    {stock}
                  </div>
                  {isLow && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
