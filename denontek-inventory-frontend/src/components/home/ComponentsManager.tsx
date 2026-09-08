import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, Cpu, ArrowLeft } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { ComponentItem } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';
import { SearchableSelect } from '../common/SearchableSelect';

interface ComponentsManagerProps {
  onBack: () => void;
}

export const ComponentsManager: React.FC<ComponentsManagerProps> = ({ onBack }) => {
  const {
    components,
    categories,
    generateId,
    addComponent,
    updateComponent,
    deleteComponent,
    getComponentStockAsOfDate,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Modal states
  const [viewItem, setViewItem] = useState<ComponentItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComponentItem | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formOpeningQty, setFormOpeningQty] = useState('0');
  const [formReorderLevel, setFormReorderLevel] = useState('10');
  const [formError, setFormError] = useState('');

  const openAddDialog = () => {
    setEditingItem(null);
    setFormId(generateId('component'));
    setFormName('');
    setFormCategoryId('');
    setFormOpeningQty('0');
    setFormReorderLevel('10');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditDialog = (item: ComponentItem) => {
    setViewItem(null);
    setEditingItem(item);
    setFormId(item.id);
    setFormName(item.name);
    setFormCategoryId(item.categoryId);
    setFormOpeningQty(String(item.openingQty));
    setFormReorderLevel(String(item.reorderLevel));
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Component name is required');
      return;
    }
    if (!formCategoryId) {
      setFormError('Please select a category');
      return;
    }

    const openingQtyNum = parseFloat(formOpeningQty) || 0;
    const reorderLevelNum = parseFloat(formReorderLevel) || 0;

    if (openingQtyNum < 0) {
      setFormError('Opening quantity cannot be negative.');
      return;
    }
    if (reorderLevelNum < 0) {
      setFormError('Reorder level cannot be negative.');
      return;
    }

    if (editingItem) {
      const res = updateComponent({
        ...editingItem,
        name: formName.trim(),
        categoryId: formCategoryId,
        openingQty: openingQtyNum,
        reorderLevel: reorderLevelNum,
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot update component.');
        return;
      }
    } else {
      const res = addComponent({
        id: formId,
        name: formName.trim(),
        categoryId: formCategoryId,
        openingQty: openingQtyNum,
        reorderLevel: reorderLevelNum,
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot add component.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteComponent(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete this component.');
      return;
    }
    setViewItem(null);
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const filteredComponents = components.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter ? comp.categoryId === selectedCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top Header */}
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Components</h2>
            <p className="text-[11px] text-slate-500">{components.length} items registered</p>
          </div>
        </div>

        {/* Add Component Button */}
        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search component name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('')}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
              selectedCategoryFilter === ''
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
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                selectedCategoryFilter === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* List of Added Components */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No components found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to create your first component</p>
          </div>
        ) : (
          filteredComponents.map((item) => {
            const currentStock = getComponentStockAsOfDate(item.id);
            const isLowStock = currentStock <= item.reorderLevel;
            const categoryName = categories.find((c) => c.id === item.categoryId)?.name || 'Uncategorized';

            return (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                      {item.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {categoryName}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="text-slate-500">
                      Stock: <strong className={`font-semibold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>{currentStock}</strong>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      Reorder: <strong className="font-semibold text-slate-700">{item.reorderLevel}</strong>
                    </span>
                  </div>
                </div>

                {/* View Button */}
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

      {/* View Modal with Edit at Top, Delete at Bottom, Warning before Deleting */}
      {viewItem && (
        <ViewModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={viewItem.name}
          subtitle={`Autogenerated ID: ${viewItem.id}`}
          badge={
            getComponentStockAsOfDate(viewItem.id) <= viewItem.reorderLevel ? (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                Low Stock
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                In Stock
              </span>
            )
          }
          fields={[
            { label: 'Serial ID', value: viewItem.id },
            {
              label: 'Category',
              value: categories.find((c) => c.id === viewItem.categoryId)?.name || 'N/A',
            },
            { label: 'Opening Quantity', value: viewItem.openingQty },
            { label: 'Reorder Level', value: viewItem.reorderLevel },
            {
              label: 'Current Live Stock',
              value: (
                <span className="text-sm font-bold text-slate-900">
                  {getComponentStockAsOfDate(viewItem.id)} units
                </span>
              ),
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewItem)}
          onDelete={() => handleDelete(viewItem.id)}
          deleteWarningTitle="Delete Component?"
          deleteWarningMessage={`Are you sure you want to delete "${viewItem.name}" (${viewItem.id})? This will permanently remove it from the components master list.`}
        />
      )}

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Component' : 'Add Component'}
        subtitle={editingItem ? `Updating ${editingItem.id}` : 'Create new raw inventory item'}
        onSubmit={handleSubmit}
        submitText={editingItem ? 'Update Component' : 'Save Component'}
      >
        {formError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Autogenerated ID */}
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
          <p className="text-[10px] text-slate-400 mt-1">Serial-wise system generated identifier</p>
        </div>

        {/* Name (Required) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Component Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. STM32 MCU Board"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
            required
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <SearchableSelect
            label="Category"
            options={categoryOptions}
            value={formCategoryId}
            onChange={(val) => setFormCategoryId(val)}
            placeholder="Select component category..."
            required
          />
        </div>

        {/* Opening Quantity & Reorder Level */}
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reorder Level
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formReorderLevel}
              onChange={(e) => setFormReorderLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-slate-800 outline-none"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};
