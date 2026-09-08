import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, Package, ArrowLeft } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { FinishedItem } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';

interface FinishedItemsManagerProps {
  onBack: () => void;
}

export const FinishedItemsManager: React.FC<FinishedItemsManagerProps> = ({ onBack }) => {
  const {
    finishedItems,
    generateId,
    addFinishedItem,
    updateFinishedItem,
    deleteFinishedItem,
    getFinishedItemStockAsOfDate,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewItem, setViewItem] = useState<FinishedItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishedItem | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formOpeningQty, setFormOpeningQty] = useState('0');
  const [formError, setFormError] = useState('');

  const openAddDialog = () => {
    setEditingItem(null);
    setFormId(generateId('finished'));
    setFormName('');
    setFormOpeningQty('0');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditDialog = (item: FinishedItem) => {
    setViewItem(null);
    setEditingItem(item);
    setFormId(item.id);
    setFormName(item.name);
    setFormOpeningQty(String(item.openingQty));
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Finished item name is required');
      return;
    }

    const openingQtyNum = parseFloat(formOpeningQty) || 0;
    if (openingQtyNum < 0) {
      setFormError('Opening quantity cannot be negative.');
      return;
    }

    if (editingItem) {
      const res = updateFinishedItem({
        ...editingItem,
        name: formName.trim(),
        openingQty: openingQtyNum,
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot update finished item.');
        return;
      }
    } else {
      const res = addFinishedItem({
        id: formId,
        name: formName.trim(),
        openingQty: openingQtyNum,
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot add finished item.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteFinishedItem(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete this finished item.');
      return;
    }
    setViewItem(null);
  };

  const filteredItems = finishedItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Finished Items</h2>
            <p className="text-[11px] text-slate-500">{finishedItems.length} products listed</p>
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

      {/* Search Input */}
      <div className="p-3 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search finished item name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No finished items found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to register a finished product</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const currentStock = getFinishedItemStockAsOfDate(item.id);

            return (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                    {item.id}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span>
                      Stock: <strong className="font-semibold text-emerald-700">{currentStock}</strong> units
                    </span>
                    <span>·</span>
                    <span>Opening: {item.openingQty}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewItem(item)}
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
          title={viewItem.name}
          subtitle={`Finished Goods ID: ${viewItem.id}`}
          fields={[
            { label: 'Serial ID', value: viewItem.id },
            { label: 'Opening Quantity', value: `${viewItem.openingQty} units` },
            {
              label: 'Current Available Inventory',
              value: (
                <span className="text-sm font-bold text-emerald-700">
                  {getFinishedItemStockAsOfDate(viewItem.id)} units in stock
                </span>
              ),
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewItem)}
          onDelete={() => handleDelete(viewItem.id)}
          deleteWarningTitle="Delete Finished Item?"
          deleteWarningMessage={`Are you sure you want to delete "${viewItem.name}" (${viewItem.id})? Always ensure no active BOMs or pending orders rely on this item.`}
        />
      )}

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Finished Item' : 'Add Finished Item'}
        subtitle={editingItem ? `Editing ${editingItem.id}` : 'Create new assembled product entry'}
        onSubmit={handleSubmit}
        submitText={editingItem ? 'Update Item' : 'Save Finished Item'}
      >
        {formError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Serialwise Autogenerated ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Autogenerated ID
          </label>
          <input
            type="text"
            value={formId}
            readOnly
            className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-semibold cursor-not-allowed outline-none"
          />
        </div>

        {/* Name (Required) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Finished Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Denontek Smart Gateway Pro"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
            required
          />
        </div>

        {/* Opening Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Opening Quantity
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formOpeningQty}
            onChange={(e) => setFormOpeningQty(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-slate-800 outline-none"
          />
        </div>
      </FormModal>
    </div>
  );
};
