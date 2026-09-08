import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, Building2, ArrowLeft } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { Vendor } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';

interface VendorsManagerProps {
  onBack: () => void;
}

export const VendorsManager: React.FC<VendorsManagerProps> = ({ onBack }) => {
  const { vendors, generateId, addVendor, updateVendor, deleteVendor, stockIns } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');

  const openAddDialog = () => {
    setEditingVendor(null);
    setFormId(generateId('vendor'));
    setFormName('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditDialog = (item: Vendor) => {
    setViewVendor(null);
    setEditingVendor(item);
    setFormId(item.id);
    setFormName(item.name);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vendor name is required');
      return;
    }

    if (editingVendor) {
      updateVendor({
        ...editingVendor,
        name: formName.trim(),
      });
    } else {
      addVendor({
        id: formId,
        name: formName.trim(),
      });
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteVendor(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete vendor.');
      return;
    }
    setViewVendor(null);
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Vendors</h2>
            <p className="text-[11px] text-slate-500">{vendors.length} suppliers registered</p>
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
            placeholder="Search vendor name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No vendors found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to register a supplier</p>
          </div>
        ) : (
          filteredVendors.map((item) => {
            const receiptsCount = stockIns.filter((s) => s.vendorId === item.id).length;

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
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {receiptsCount} recorded shipment{receiptsCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewVendor(item)}
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
      {viewVendor && (
        <ViewModal
          isOpen={!!viewVendor}
          onClose={() => setViewVendor(null)}
          title={viewVendor.name}
          subtitle={`Vendor ID: ${viewVendor.id}`}
          fields={[
            { label: 'Vendor ID', value: viewVendor.id },
            { label: 'Vendor Name', value: viewVendor.name },
            {
              label: 'Historical Transactions',
              value: `${stockIns.filter((s) => s.vendorId === viewVendor.id).length} receipts from this supplier`,
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewVendor)}
          onDelete={() => handleDelete(viewVendor.id)}
          deleteWarningTitle="Delete Vendor?"
          deleteWarningMessage={`Are you sure you want to remove vendor "${viewVendor.name}" (${viewVendor.id})?`}
        />
      )}

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        subtitle={editingVendor ? `Updating ${editingVendor.id}` : 'Register a component supplier'}
        onSubmit={handleSubmit}
        submitText={editingVendor ? 'Update Vendor' : 'Save Vendor'}
      >
        {formError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Vendor ID
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
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Shenzhen Electronics Ltd"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
            required
          />
        </div>
      </FormModal>
    </div>
  );
};
