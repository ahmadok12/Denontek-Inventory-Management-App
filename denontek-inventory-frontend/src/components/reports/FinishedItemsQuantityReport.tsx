import React, { useState } from 'react';
import { ArrowLeft, Calendar, Package } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface FinishedItemsQuantityReportProps {
  onBack: () => void;
}

export const FinishedItemsQuantityReport: React.FC<FinishedItemsQuantityReportProps> = ({ onBack }) => {
  const { finishedItems, getFinishedItemStockAsOfDate } = useInventory();

  // Date filter (today by default)
  const todayStr = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(todayStr);

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Finished Items Quantity</h2>
            <p className="text-[11px] text-slate-500">Inventory position as of selected date</p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="p-3 bg-white border-b border-slate-100">
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
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {finishedItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No finished products found</p>
          </div>
        ) : (
          finishedItems.map((item) => {
            const stock = getFinishedItemStockAsOfDate(item.id, asOfDate);

            return (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                    {item.id}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Opening Stock: <strong>{item.openingQty}</strong> units
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-emerald-700">
                    {stock}
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
