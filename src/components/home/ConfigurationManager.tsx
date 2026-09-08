import React, { useState } from 'react';
import { Plus, Search, Eye, AlertCircle, Trash2, ArrowLeft, Layers } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { Configuration, ConfigComponentRow } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';
import { SearchableSelect } from '../common/SearchableSelect';

interface ConfigurationManagerProps {
  onBack: () => void;
}

export const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({ onBack }) => {
  const {
    configurations,
    finishedItems,
    components,
    generateId,
    addConfiguration,
    updateConfiguration,
    deleteConfiguration,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewConfig, setViewConfig] = useState<Configuration | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formFinishedItemId, setFormFinishedItemId] = useState('');
  const [formRows, setFormRows] = useState<ConfigComponentRow[]>([]);
  const [formDetails, setFormDetails] = useState('');
  const [formError, setFormError] = useState('');

  const openAddDialog = () => {
    setEditingConfig(null);
    setFormId(generateId('config'));
    setFormFinishedItemId('');
    setFormRows([]);
    setFormDetails('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditDialog = (cfg: Configuration) => {
    setViewConfig(null);
    setEditingConfig(cfg);
    setFormId(cfg.id);
    setFormFinishedItemId(cfg.finishedItemId);
    setFormRows([...cfg.components]);
    setFormDetails(cfg.details || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleAddRow = () => {
    setFormRows([...formRows, { componentId: '', qty: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    setFormRows(formRows.filter((_, i) => i !== index));
  };

  const handleRowComponentChange = (index: number, componentId: string) => {
    const updated = [...formRows];
    updated[index] = { ...updated[index], componentId };
    setFormRows(updated);
  };

  const handleRowQtyChange = (index: number, qtyStr: string) => {
    const updated = [...formRows];
    const qty = parseFloat(qtyStr) || 0;
    updated[index] = { ...updated[index], qty };
    setFormRows(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formRows.length === 0) {
      setFormError('Add at least one component to this configuration');
      return;
    }

    for (let i = 0; i < formRows.length; i++) {
      if (!formRows[i].componentId) {
        setFormError(`Row #${i + 1}: Select a valid component`);
        return;
      }
      if (formRows[i].qty <= 0) {
        setFormError(`Row #${i + 1}: Quantity must be greater than 0`);
        return;
      }
    }

    if (!formFinishedItemId) {
      setFormError('Please select a finished item for this configuration');
      return;
    }

    if (editingConfig) {
      updateConfiguration({
        ...editingConfig,
        finishedItemId: formFinishedItemId,
        components: formRows,
        details: formDetails.trim(),
      });
      setIsFormOpen(false);
      return;
    }

    addConfiguration({
      id: formId,
      finishedItemId: formFinishedItemId,
      components: formRows,
      details: formDetails.trim(),
    });

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteConfiguration(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete configuration.');
      return;
    }
    setViewConfig(null);
  };

  // Only show finished items that do not already have a BOM configured
  // (when editing, include the currently edited item)
  const availableFinishedItems = finishedItems.filter(
    (f) =>
      (editingConfig && f.id === editingConfig.finishedItemId) ||
      !configurations.some((c) => c.finishedItemId === f.id)
  );

  const finishedItemOptions = availableFinishedItems.map((f) => ({
    value: f.id,
    label: `${f.name} (${f.id})`,
  }));

  const componentOptions = components.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.id,
  }));

  const filteredConfigs = configurations.filter((cfg) => {
    const fin = finishedItems.find((f) => f.id === cfg.finishedItemId);
    const finName = fin?.name || '';
    return (
      finName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cfg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cfg.details.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">BOM Configurations</h2>
            <p className="text-[11px] text-slate-500">{configurations.length} assemblies defined</p>
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
            placeholder="Search configuration by product or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List of Configurations */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredConfigs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No configurations defined</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Add&quot; to define components required for a product</p>
          </div>
        ) : (
          filteredConfigs.map((cfg) => {
            const finishedProduct = finishedItems.find((f) => f.id === cfg.finishedItemId);

            return (
              <div
                key={cfg.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                      {cfg.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {cfg.components.length} components
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {finishedProduct ? finishedProduct.name : 'Unknown Product'}
                  </h4>
                  {cfg.details && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {cfg.details}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewConfig(cfg)}
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
      {viewConfig && (
        <ViewModal
          isOpen={!!viewConfig}
          onClose={() => setViewConfig(null)}
          title={`BOM: ${finishedItems.find((f) => f.id === viewConfig.finishedItemId)?.name || 'Product'}`}
          subtitle={`Configuration ID: ${viewConfig.id}`}
          fields={[
            { label: 'Config ID', value: viewConfig.id },
            {
              label: 'Finished Item',
              value: finishedItems.find((f) => f.id === viewConfig.finishedItemId)?.name || 'N/A',
            },
            {
              label: 'Details',
              value: viewConfig.details || 'No details provided.',
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewConfig)}
          onDelete={() => handleDelete(viewConfig.id)}
          deleteWarningTitle="Delete Configuration?"
          deleteWarningMessage={`Are you sure you want to remove BOM configuration ${viewConfig.id}? Assembly runs referencing this template may not auto-populate.`}
        >
          {/* Table of Components */}
          <div className="mt-3">
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>Required Components</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Per 1 finished unit
              </span>
            </h5>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Component</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewConfig.components.map((row, idx) => {
                    const comp = components.find((c) => c.id === row.componentId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800">
                            {comp ? comp.name : row.componentId}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {row.componentId}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {row.qty}
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
        title={editingConfig ? 'Edit Configuration' : 'Add Configuration'}
        subtitle={editingConfig ? `Editing ${editingConfig.id}` : 'Define assembly Bill of Materials'}
        onSubmit={handleSubmit}
        submitText={editingConfig ? 'Update Configuration' : 'Save Configuration'}
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
        </div>

        {/* Finished Item Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Finished Item <span className="text-red-500">*</span>
          </label>
          {finishedItemOptions.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              All finished items already have a BOM configuration defined. To create a new BOM, register a new finished item first.
            </div>
          ) : (
            <SearchableSelect
              options={finishedItemOptions}
              value={formFinishedItemId}
              onChange={(val) => setFormFinishedItemId(val)}
              placeholder="Select finished goods item..."
              required
            />
          )}
        </div>

        {/* Components Table Below */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Components &amp; Quantities <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            {formRows.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No components added yet. Tap &quot;Add Row&quot; above.
              </div>
            ) : (
              formRows.map((row, index) => (
                <div
                  key={index}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <SearchableSelect
                      options={componentOptions}
                      value={row.componentId}
                      onChange={(val) => handleRowComponentChange(index, val)}
                      placeholder="Select component..."
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={row.qty || ''}
                      onChange={(e) => handleRowQtyChange(index, e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:border-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                    title="Remove component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Field at the End */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Configuration Details / Notes
          </label>
          <textarea
            rows={3}
            value={formDetails}
            onChange={(e) => setFormDetails(e.target.value)}
            placeholder="e.g. Standard BOM revision 2.0 with updated connector specification"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none resize-none"
          />
        </div>
      </FormModal>
    </div>
  );
};
