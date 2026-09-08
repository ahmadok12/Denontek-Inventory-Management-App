import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, ArrowUpRight, ArrowLeft, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { StockOut, StockOutItemRow } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';
import { SearchableSelect } from '../common/SearchableSelect';

interface StockOutManagerProps {
  onBack: () => void;
}

export const StockOutManager: React.FC<StockOutManagerProps> = ({ onBack }) => {
  const {
    stockOuts,
    customers,
    finishedItems,
    generateId,
    addStockOut,
    updateStockOut,
    deleteStockOut,
    getFinishedItemStockAsOfDate,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewItem, setViewItem] = useState<StockOut | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockOut | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formItems, setFormItems] = useState<StockOutItemRow[]>([]);
  const [formDetails, setFormDetails] = useState('');
  const [formError, setFormError] = useState('');

  // Collapsed quick-add state
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [newRowFinishedItemId, setNewRowFinishedItemId] = useState('');
  const [newRowQty, setNewRowQty] = useState('1');

  const openAddDialog = () => {
    setEditingItem(null);
    setFormId(generateId('stockout'));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCustomerId('');
    setFormItems([]);
    setFormDetails('');
    setFormError('');
    setIsAddRowOpen(false);
    setNewRowFinishedItemId('');
    setNewRowQty('1');
    setIsFormOpen(true);
  };

  const openEditDialog = (item: StockOut) => {
    setViewItem(null);
    setEditingItem(item);
    setFormId(item.id);
    setFormDate(item.date);
    setFormCustomerId(item.customerId);
    setFormItems(item.items ? [...item.items] : []);
    setFormDetails(item.details || '');
    setFormError('');
    setIsAddRowOpen(false);
    setNewRowFinishedItemId('');
    setNewRowQty('1');
    setIsFormOpen(true);
  };

  const getAvailableStockForFinItem = (finId: string) => {
    const liveStock = getFinishedItemStockAsOfDate(finId);
    let creditedBack = 0;
    if (editingItem && Array.isArray(editingItem.items)) {
      for (const it of editingItem.items) {
        if (it.finishedItemId === finId) {
          creditedBack += Number(it.qty) || 0;
        }
      }
    }
    return liveStock + creditedBack;
  };

  const handleAppendQuickRow = () => {
    if (!newRowFinishedItemId) {
      setFormError('Please select a finished product');
      return;
    }
    const q = parseFloat(newRowQty);
    if (isNaN(q) || q <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }

    const available = getAvailableStockForFinItem(newRowFinishedItemId);
    const existingInForm = formItems
      .filter((it) => it.finishedItemId === newRowFinishedItemId)
      .reduce((sum, it) => sum + it.qty, 0);

    if (existingInForm + q > available) {
      const fin = finishedItems.find((f) => f.id === newRowFinishedItemId);
      setFormError(
        `Cannot add ${q} units of "${fin?.name || newRowFinishedItemId}". Total requested (${existingInForm + q}) exceeds available stock (${available} units). Negative stock is not allowed.`
      );
      return;
    }

    setFormItems([...formItems, { finishedItemId: newRowFinishedItemId, qty: q }]);
    setIsAddRowOpen(false);
    setNewRowFinishedItemId('');
    setNewRowQty('1');
    setFormError('');
  };

  const handleDeleteRow = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleRowItemChange = (index: number, finishedItemId: string) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], finishedItemId };
    setFormItems(updated);
  };

  const handleRowQtyChange = (index: number, qtyStr: string) => {
    const updated = [...formItems];
    const qty = parseFloat(qtyStr) || 0;
    updated[index] = { ...updated[index], qty };
    setFormItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId) {
      setFormError('Please select a customer');
      return;
    }
    if (formItems.length === 0) {
      setFormError('Please add at least one finished item to this dispatch');
      return;
    }

    for (let i = 0; i < formItems.length; i++) {
      if (!formItems[i].finishedItemId) {
        setFormError(`Row #${i + 1}: Select a valid finished item`);
        return;
      }
      if (formItems[i].qty <= 0) {
        setFormError(`Row #${i + 1}: Quantity must be greater than 0`);
        return;
      }
    }

    // Negative stock check across all items
    const qtyByItem: Record<string, number> = {};
    for (const row of formItems) {
      qtyByItem[row.finishedItemId] = (qtyByItem[row.finishedItemId] || 0) + row.qty;
    }

    for (const [finId, requestedQty] of Object.entries(qtyByItem)) {
      const available = getAvailableStockForFinItem(finId);
      if (requestedQty > available) {
        const fin = finishedItems.find((f) => f.id === finId);
        setFormError(
          `Cannot dispatch ${requestedQty} units of "${fin?.name || finId}". Available stock: ${available} units. Negative stock is not allowed.`
        );
        return;
      }
    }

    if (editingItem) {
      const res = updateStockOut({
        ...editingItem,
        date: formDate,
        customerId: formCustomerId,
        items: formItems,
        details: formDetails.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot update stock out voucher.');
        return;
      }
    } else {
      const res = addStockOut({
        id: formId,
        date: formDate,
        customerId: formCustomerId,
        items: formItems,
        details: formDetails.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot save stock out voucher.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteStockOut(id);
    setViewItem(null);
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.id,
  }));

  const finishedItemOptions = finishedItems.map((f) => {
    const avail = getAvailableStockForFinItem(f.id);
    return {
      value: f.id,
      label: f.name,
      sublabel: `In Stock: ${avail} units`,
    };
  });

  const filteredStockOuts = stockOuts.filter((item) => {
    const custName = customers.find((c) => c.id === item.customerId)?.name || '';
    const matchesItem = item.items?.some((row) => {
      const fin = finishedItems.find((f) => f.id === row.finishedItemId);
      return fin?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return (
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matchesItem
    );
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Stock Out</h2>
            <p className="text-[11px] text-slate-500">{stockOuts.length} dispatch vouchers</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, item, or voucher ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredStockOuts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ArrowUpRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No stock-out dispatches found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to create a multi-item dispatch voucher</p>
          </div>
        ) : (
          filteredStockOuts.map((voucher) => {
            const cust = customers.find((c) => c.id === voucher.customerId);
            const totalQty = (voucher.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
            const itemCount = voucher.items?.length || 0;

            return (
              <div
                key={voucher.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                      {voucher.id}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {voucher.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {cust ? cust.name : 'Customer'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-amber-700">-{totalQty} units dispatched</span>
                    <span>·</span>
                    <span>{itemCount} finished good{itemCount !== 1 ? 's' : ''}</span>
                  </div>
                  {voucher.details && (
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">
                      &quot;{voucher.details}&quot;
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewItem(voucher)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* View Modal with Edit at Top, Delete at Bottom */}
      {viewItem && (
        <ViewModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={`Dispatch: ${viewItem.id}`}
          subtitle={`Dispatched on ${viewItem.date}`}
          fields={[
            { label: 'Voucher ID', value: viewItem.id },
            { label: 'Date', value: viewItem.date },
            {
              label: 'Customer',
              value: customers.find((c) => c.id === viewItem.customerId)?.name || 'N/A',
            },
            {
              label: 'Total Dispatched',
              value: (
                <span className="text-sm font-bold text-amber-700">
                  -{(viewItem.items || []).reduce((sum, r) => sum + (Number(r.qty) || 0), 0)} units
                </span>
              ),
            },
            {
              label: 'Details / Reference',
              value: viewItem.details || 'None provided.',
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewItem)}
          onDelete={() => handleDelete(viewItem.id)}
          deleteWarningTitle="Delete Stock Out Voucher?"
          deleteWarningMessage={`Are you sure you want to delete voucher ${viewItem.id}? Finished goods stock will be restored for all ${viewItem.items?.length || 0} line items.`}
        >
          {/* Table of Dispatched Items */}
          <div className="mt-3">
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>Dispatched Products</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {viewItem.items?.length || 0} line items
              </span>
            </h5>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Finished Item</th>
                    <th className="py-2 px-3 text-right">Dispatched Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewItem.items || []).map((row, idx) => {
                    const fin = finishedItems.find((f) => f.id === row.finishedItemId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800">
                            {fin ? fin.name : row.finishedItemId}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {row.finishedItemId}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-700">
                          -{row.qty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ViewModal>
      )}

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Stock Out Voucher' : 'Add Stock Out Voucher'}
        subtitle={editingItem ? `Updating ${editingItem.id}` : 'Record multi-item dispatch to customer'}
        onSubmit={handleSubmit}
        submitText={editingItem ? 'Update Voucher' : 'Save Dispatch'}
      >
        {formError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Date & ID */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Voucher ID
            </label>
            <input
              type="text"
              value={formId}
              readOnly
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-semibold cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Date
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-slate-800 outline-none"
              required
            />
          </div>
        </div>

        {/* Customer Dropdown */}
        <div>
          <SearchableSelect
            label="Customer Name"
            options={customerOptions}
            value={formCustomerId}
            onChange={(val) => setFormCustomerId(val)}
            placeholder="Select customer..."
            required
          />
        </div>

        {/* Multi-Finished Goods Table & Collapsed Add Button */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700">
              Finished Goods in Voucher <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-500">
              {formItems.length} added
            </span>
          </div>

          {/* List of added finished items with Delete option */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-2.5">
            {formItems.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No products added yet. Use &quot;Add Finished item&quot; below.
              </div>
            ) : (
              formItems.map((row, index) => (
                <div
                  key={index}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <SearchableSelect
                      options={finishedItemOptions}
                      value={row.finishedItemId}
                      onChange={(val) => handleRowItemChange(index, val)}
                      placeholder="Select finished item..."
                    />
                    {row.finishedItemId && (
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        {(() => {
                          const avail = getAvailableStockForFinItem(row.finishedItemId);
                          const isExceeded = (row.qty || 0) > avail;
                          return (
                            <span
                              className={`font-semibold ${
                                isExceeded ? 'text-red-600' : 'text-slate-500'
                              }`}
                            >
                              In Stock: {avail} units {isExceeded && '⚠️ (Exceeds stock)'}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={row.qty || ''}
                      onChange={(e) => handleRowQtyChange(index, e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:border-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                    title="Delete this item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Collapsed "Add Finished item" accordion trigger */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-2.5 bg-white">
            <button
              type="button"
              onClick={() => setIsAddRowOpen(!isAddRowOpen)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-slate-950 p-1 cursor-pointer transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Add Finished item</span>
              </span>
              {isAddRowOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isAddRowOpen && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                <SearchableSelect
                  label="Pick Finished Item"
                  options={finishedItemOptions}
                  value={newRowFinishedItemId}
                  onChange={(val) => setNewRowFinishedItemId(val)}
                  placeholder="Select finished good to add..."
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dispatch Quantity
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={newRowQty}
                      onChange={(e) => setNewRowQty(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAppendQuickRow}
                    className="self-end px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Add to Voucher
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Details / Delivery Note / Reference
          </label>
          <input
            type="text"
            value={formDetails}
            onChange={(e) => setFormDetails(e.target.value)}
            placeholder="e.g. Invoice #INV-1022 - Client Pickup"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
          />
        </div>
      </FormModal>
    </div>
  );
};
