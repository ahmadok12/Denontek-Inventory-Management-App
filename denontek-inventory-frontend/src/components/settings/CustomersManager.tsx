import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, Users, ArrowLeft } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { Customer } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';

interface CustomersManagerProps {
  onBack: () => void;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({ onBack }) => {
  const { customers, generateId, addCustomer, updateCustomer, deleteCustomer, stockOuts } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');

  const openAddDialog = () => {
    setEditingCustomer(null);
    setFormId(generateId('customer'));
    setFormName('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditDialog = (item: Customer) => {
    setViewCustomer(null);
    setEditingCustomer(item);
    setFormId(item.id);
    setFormName(item.name);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Customer name is required');
      return;
    }

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        name: formName.trim(),
      });
    } else {
      addCustomer({
        id: formId,
        name: formName.trim(),
      });
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteCustomer(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete customer.');
      return;
    }
    setViewCustomer(null);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Customers</h2>
            <p className="text-[11px] text-slate-500">{customers.length} clients registered</p>
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
            placeholder="Search customer name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No customers found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to register a client</p>
          </div>
        ) : (
          filteredCustomers.map((item) => {
            const dispatchesCount = stockOuts.filter((s) => s.customerId === item.id).length;

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
                    {dispatchesCount} recorded dispatch{dispatchesCount !== 1 ? 'es' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewCustomer(item)}
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
      {viewCustomer && (
        <ViewModal
          isOpen={!!viewCustomer}
          onClose={() => setViewCustomer(null)}
          title={viewCustomer.name}
          subtitle={`Customer ID: ${viewCustomer.id}`}
          fields={[
            { label: 'Customer ID', value: viewCustomer.id },
            { label: 'Customer Name', value: viewCustomer.name },
            {
              label: 'Dispatches Delivered',
              value: `${stockOuts.filter((s) => s.customerId === viewCustomer.id).length} shipments recorded`,
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewCustomer)}
          onDelete={() => handleDelete(viewCustomer.id)}
          deleteWarningTitle="Delete Customer?"
          deleteWarningMessage={`Are you sure you want to remove customer "${viewCustomer.name}" (${viewCustomer.id})?`}
        />
      )}

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        subtitle={editingCustomer ? `Updating ${editingCustomer.id}` : 'Register a new buyer / client'}
        onSubmit={handleSubmit}
        submitText={editingCustomer ? 'Update Customer' : 'Save Customer'}
      >
        {formError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Customer ID
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
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. TechWave Dynamics Corp"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
            required
          />
        </div>
      </FormModal>
    </div>
  );
};
