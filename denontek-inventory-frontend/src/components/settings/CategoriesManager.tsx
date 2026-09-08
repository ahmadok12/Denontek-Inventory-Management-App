import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, Tag, ArrowLeft } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { ComponentCategory } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';

interface CategoriesManagerProps {
  onBack: () => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({ onBack }) => {
  const { categories, generateId, addCategory, updateCategory, deleteCategory, components } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewCat, setViewCat] = useState<ComponentCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ComponentCategory | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');

  const openAddDialog = () => {
    setEditingCat(null);
    setFormId(generateId('category'));
    setFormName('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditDialog = (item: ComponentCategory) => {
    setViewCat(null);
    setEditingCat(item);
    setFormId(item.id);
    setFormName(item.name);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Category name is required');
      return;
    }

    if (editingCat) {
      updateCategory({
        ...editingCat,
        name: formName.trim(),
      });
    } else {
      addCategory({
        id: formId,
        name: formName.trim(),
      });
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteCategory(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete category.');
      return;
    }
    setViewCat(null);
  };

  const filteredCategories = categories.filter(
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Component Categories</h2>
            <p className="text-[11px] text-slate-500">{categories.length} categories defined</p>
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
            placeholder="Search category name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No categories found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to classify your components</p>
          </div>
        ) : (
          filteredCategories.map((item) => {
            const compsInCat = components.filter((c) => c.categoryId === item.id).length;

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
                    {compsInCat} component{compsInCat !== 1 ? 's' : ''} assigned
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewCat(item)}
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
      {viewCat && (
        <ViewModal
          isOpen={!!viewCat}
          onClose={() => setViewCat(null)}
          title={viewCat.name}
          subtitle={`Category ID: ${viewCat.id}`}
          fields={[
            { label: 'Category ID', value: viewCat.id },
            { label: 'Category Name', value: viewCat.name },
            {
              label: 'Assigned Components',
              value: `${components.filter((c) => c.categoryId === viewCat.id).length} items in this category`,
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewCat)}
          onDelete={() => handleDelete(viewCat.id)}
          deleteWarningTitle="Delete Category?"
          deleteWarningMessage={`Are you sure you want to remove category "${viewCat.name}" (${viewCat.id})?`}
        />
      )}

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCat ? 'Edit Category' : 'Add Category'}
        subtitle={editingCat ? `Updating ${editingCat.id}` : 'Create component category classification'}
        onSubmit={handleSubmit}
        submitText={editingCat ? 'Update Category' : 'Save Category'}
      >
        {formError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Category ID
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
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Sensors &amp; Probes"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
            required
          />
        </div>
      </FormModal>
    </div>
  );
};
