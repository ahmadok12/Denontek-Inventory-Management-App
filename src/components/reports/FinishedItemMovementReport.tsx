import React, { useState } from 'react';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { SearchableSelect } from '../common/SearchableSelect';

interface FinishedItemMovementReportProps {
  onBack: () => void;
}

export const FinishedItemMovementReport: React.FC<FinishedItemMovementReportProps> = ({ onBack }) => {
  const { finishedItems, getFinishedItemMovementLedger } = useInventory();

  // Date filters: 1st of current month to end of current month by default
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [selectedItemId, setSelectedItemId] = useState('');

  const finishedItemOptions = finishedItems.map((f) => ({
    value: f.id,
    label: `${f.name} (${f.id})`,
  }));

  const selectedItem = finishedItems.find((f) => f.id === selectedItemId);
  const ledger = selectedItemId
    ? getFinishedItemMovementLedger(selectedItemId, fromDate, toDate)
    : [];

  const totalIn = ledger.reduce((acc, row) => acc + (row.type !== 'OPENING' ? row.qtyIn : 0), 0);
  const totalOut = ledger.reduce((acc, row) => acc + (row.type !== 'OPENING' ? row.qtyOut : 0), 0);
  const closingBalance = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Finished Goods Movement</h2>
            <p className="text-[11px] text-slate-500">2-Column In/Out Inventory Ledger</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-3">
        {/* Finished Item Selector */}
        <div>
          <SearchableSelect
            label="Select Finished Item"
            options={finishedItemOptions}
            value={selectedItemId}
            onChange={(val) => setSelectedItemId(val)}
            placeholder="Choose product to view movements..."
          />
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {selectedItem && (
        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-emerald-600">Assembled (IN)</span>
            <span className="text-xs font-black text-slate-900">+{totalIn}</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-amber-600">Dispatched (OUT)</span>
            <span className="text-xs font-black text-slate-900">-{totalOut}</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-slate-700">Closing</span>
            <span className="text-xs font-black text-slate-900">{closingBalance}</span>
          </div>
        </div>
      )}

      {/* 2-Column Ledger View */}
      <div className="flex-1 overflow-y-auto p-3">
        {!selectedItem ? (
          <div className="text-center py-12 px-4 text-xs text-slate-400">
            Select a finished product to display ledger
          </div>
        ) : ledger.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No transactions found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try changing the date range</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ledger.map((row) => {
              const isOpening = row.type === 'OPENING';

              return (
                <div
                  key={row.id}
                  className={`bg-white p-3 rounded-2xl border shadow-2xs transition-all ${
                    isOpening
                      ? 'border-slate-300 bg-slate-50/50'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left: Date, Ref, Description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-400">
                          {row.date}
                        </span>
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {row.refNumber}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5 break-words">
                        {row.description}
                      </p>
                      {row.partyName && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Ref: {row.partyName}
                        </p>
                      )}
                    </div>

                    {/* Right: 2-Column In / Out + Balance */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        {/* IN column (Assembly) */}
                        <div className="w-12 text-right">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">
                            IN
                          </span>
                          <span
                            className={`font-bold ${
                              row.qtyIn > 0 ? 'text-emerald-700' : 'text-slate-300'
                            }`}
                          >
                            {row.qtyIn > 0 ? `+${row.qtyIn}` : '-'}
                          </span>
                        </div>

                        {/* OUT column (Stock Out) */}
                        <div className="w-12 text-right">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">
                            OUT
                          </span>
                          <span
                            className={`font-bold ${
                              row.qtyOut > 0 ? 'text-amber-700' : 'text-slate-300'
                            }`}
                          >
                            {row.qtyOut > 0 ? `-${row.qtyOut}` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Running Balance */}
                      <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-end gap-1.5 text-[11px]">
                        <span className="text-slate-400 text-[10px] font-medium">Balance:</span>
                        <span className="font-bold text-slate-900">{row.balance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
