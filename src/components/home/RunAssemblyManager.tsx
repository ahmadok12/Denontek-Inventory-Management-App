import React, { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  AlertCircle,
  Hammer,
  Trash2,
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Package,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import type { AssemblyRun, AssemblyComponentRow, ConfigComponentRow } from '../../types';
import { ViewModal } from '../common/ViewModal';
import { FormModal } from '../common/FormModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { ConfirmModal } from '../common/ConfirmModal';

interface RunAssemblyManagerProps {
  onBack: () => void;
}

export const RunAssemblyManager: React.FC<RunAssemblyManagerProps> = ({ onBack }) => {
  const {
    assemblyRuns,
    finishedItems,
    components,
    configurations,
    generateId,
    addAssemblyRun,
    updateAssemblyRun,
    deleteAssemblyRun,
    addConfiguration,
    updateConfiguration,
    addFinishedItem,
    getComponentStockAsOfDate,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals for viewing & editing past runs
  const [viewRun, setViewRun] = useState<AssemblyRun | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRun, setEditingRun] = useState<AssemblyRun | null>(null);

  // Form Fields for Main Assembly Voucher
  const [formId, setFormId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formFinishedItemQty, setFormFinishedItemQty] = useState('1');
  const [loadedConfigId, setLoadedConfigId] = useState<string | null>(null);
  const [formRows, setFormRows] = useState<AssemblyComponentRow[]>([]);
  const [formDetails, setFormDetails] = useState('');
  const [formError, setFormError] = useState('');

  // Baseline configuration tracking (per-unit quantities)
  const [baselineComponents, setBaselineComponents] = useState<ConfigComponentRow[]>([]);
  const [baselineConfigId, setBaselineConfigId] = useState<string | null>(null);

  // Dialog 1: Load Configuration Dialog Picker
  const [isConfigPickerOpen, setIsConfigPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Dialog 2: Add Finished Item Dialog (Step 1 of creation chain)
  const [isAddFinishedItemOpen, setIsAddFinishedItemOpen] = useState(false);
  const [newFinId, setNewFinId] = useState('');
  const [newFinName, setNewFinName] = useState('');
  const [newFinOpeningQty, setNewFinOpeningQty] = useState('0');
  const [newFinError, setNewFinError] = useState('');

  // Dialog 3: Add Configuration Dialog (Step 2 of creation chain)
  const [isAddConfigOpen, setIsAddConfigOpen] = useState(false);
  const [newConfigId, setNewConfigId] = useState('');
  const [newConfigFinishedItemId, setNewConfigFinishedItemId] = useState('');
  const [newConfigRows, setNewConfigRows] = useState<ConfigComponentRow[]>([]);
  const [newConfigDetails, setNewConfigDetails] = useState('');
  const [newConfigError, setNewConfigError] = useState('');

  // Confirmation modal for updating existing BOM if user switches finished item
  const [showUpdateExistingBomModal, setShowUpdateExistingBomModal] = useState(false);
  const [existingBomToUpdateId, setExistingBomToUpdateId] = useState<string | null>(null);

  // Scale and apply a configuration
  const applyConfiguration = (cfgId: string, batchQty: number) => {
    const cfg = configurations.find((c) => c.id === cfgId);
    if (!cfg) return;

    setLoadedConfigId(cfg.id);
    setBaselineConfigId(cfg.id);
    setBaselineComponents(cfg.components);

    const scaledRows = cfg.components.map((c) => ({
      componentId: c.componentId,
      qty: c.qty * (batchQty > 0 ? batchQty : 1),
    }));
    setFormRows(scaledRows);
    setIsConfigPickerOpen(false);
  };

  const openAddDialog = () => {
    setEditingRun(null);
    setFormId(generateId('assembly'));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormFinishedItemQty('1');
    setFormDetails('');
    setFormError('');
    setLoadedConfigId(null);
    setBaselineConfigId(null);
    setBaselineComponents([]);
    setFormRows([]);
    setIsFormOpen(true);
  };

  const openEditDialog = (run: AssemblyRun) => {
    setViewRun(null);
    setEditingRun(run);
    setFormId(run.id);
    setFormDate(run.date);
    setFormFinishedItemQty(String(run.finishedItemQty));
    setFormRows([...run.components]);
    setFormDetails(run.details || '');
    setFormError('');

    // Find if a configuration matches this finished item
    const matchingCfg = configurations.find((c) => c.finishedItemId === run.finishedItemId);
    if (matchingCfg) {
      setLoadedConfigId(matchingCfg.id);
      setBaselineConfigId(matchingCfg.id);
      setBaselineComponents(matchingCfg.components);
    } else {
      setLoadedConfigId(null);
      setBaselineConfigId(null);
      setBaselineComponents([]);
    }

    setIsFormOpen(true);
  };

  // Check if current components or quantities differ from baseline
  const currentFinQty = parseFloat(formFinishedItemQty) || 1;
  const isConfigurationModified = (() => {
    if (!baselineConfigId || baselineComponents.length === 0) return true;
    if (formRows.length !== baselineComponents.length) return true;

    for (const bRow of baselineComponents) {
      const match = formRows.find((r) => r.componentId === bRow.componentId);
      if (!match) return true;
      const expected = bRow.qty * currentFinQty;
      if (Math.abs(match.qty - expected) > 0.0001) return true;
    }
    return false;
  })();

  // Autoloaded Finished Item:
  // "the show the finished item (not selectable or editable) autoloaded from the loaded configuration.
  // if there is any change in the configuration, remove the autoloaded finished item"
  const activeConfig = configurations.find((c) => c.id === loadedConfigId);
  const autoloadedFinishedItem = (!isConfigurationModified && activeConfig)
    ? finishedItems.find((f) => f.id === activeConfig.finishedItemId)
    : null;

  // Finished item quantity adjustment
  const handleFinishedItemQtyChange = (qtyStr: string) => {
    setFormFinishedItemQty(qtyStr);
    const newQty = parseFloat(qtyStr);
    if (!isNaN(newQty) && newQty > 0 && loadedConfigId && !isConfigurationModified) {
      const cfg = configurations.find((c) => c.id === loadedConfigId);
      if (cfg) {
        setFormRows(
          cfg.components.map((c) => ({
            componentId: c.componentId,
            qty: c.qty * newQty,
          }))
        );
      }
    }
  };

  // Row modifications in assembly table
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

  // Trigger Chain: Open "Add Finished Item" Dialog
  const handleStartNewItemChain = () => {
    setNewFinId(generateId('finished'));
    setNewFinName('');
    setNewFinOpeningQty('0');
    setNewFinError('');
    setIsAddFinishedItemOpen(true);
  };

  // Step 1 Save: Save Finished Item and immediately advance to Step 2 (Add Configuration)
  const handleSaveFinishedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinName.trim()) {
      setNewFinError('Finished item name is required');
      return;
    }

    const opQty = parseFloat(newFinOpeningQty) || 0;
    if (opQty < 0) {
      setNewFinError('Opening quantity cannot be negative.');
      return;
    }

    const createdItem = {
      id: newFinId,
      name: newFinName.trim(),
      openingQty: opQty,
    };
    const res = addFinishedItem(createdItem);
    if (!res.success) {
      setNewFinError(res.message || 'Cannot add finished item.');
      return;
    }

    // Prepare Step 2: Add Configuration Dialog
    const nextCfgId = generateId('config');
    setNewConfigId(nextCfgId);
    setNewConfigFinishedItemId(createdItem.id);

    // Calculate per-unit quantities based on current batch quantity
    const perUnitRows: ConfigComponentRow[] = formRows.map((r) => ({
      componentId: r.componentId,
      qty: parseFloat((r.qty / currentFinQty).toFixed(4)),
    }));
    setNewConfigRows(perUnitRows);
    setNewConfigDetails(`Configuration for ${createdItem.name}`);
    setNewConfigError('');

    // Close finished item dialog and immediately open configuration dialog
    setIsAddFinishedItemOpen(false);
    setIsAddConfigOpen(true);
  };

  // Step 2 Save: Save Configuration Dialog
  const handleSaveConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfigFinishedItemId) {
      setNewConfigError('Please select a finished item');
      return;
    }
    if (newConfigRows.length === 0) {
      setNewConfigError('Please add at least one component to the configuration');
      return;
    }

    // Check if user selected another finished item that already has a BOM
    const existingBOM = configurations.find((c) => c.finishedItemId === newConfigFinishedItemId);
    if (existingBOM && existingBOM.id !== newConfigId) {
      // Prompt user to update existing BOM
      setExistingBomToUpdateId(existingBOM.id);
      setShowUpdateExistingBomModal(true);
      return;
    }

    // Save as new configuration
    addConfiguration({
      id: newConfigId,
      finishedItemId: newConfigFinishedItemId,
      components: newConfigRows,
      details: newConfigDetails.trim(),
    });

    // Bring user back to run assembly screen with new configuration active!
    setLoadedConfigId(newConfigId);
    setBaselineConfigId(newConfigId);
    setBaselineComponents(newConfigRows);

    setIsAddConfigOpen(false);
  };

  // Confirm updating existing BOM when user selected another finished item with existing BOM
  const handleConfirmUpdateExistingBom = () => {
    if (existingBomToUpdateId) {
      const existingBOM = configurations.find((c) => c.id === existingBomToUpdateId);
      if (existingBOM) {
        updateConfiguration({
          ...existingBOM,
          components: newConfigRows,
          details: newConfigDetails.trim() || existingBOM.details,
        });

        // Bring user back to run assembly screen with this updated BOM
        setLoadedConfigId(existingBOM.id);
        setBaselineConfigId(existingBOM.id);
        setBaselineComponents(newConfigRows);
      }
    }
    setShowUpdateExistingBomModal(false);
    setIsAddConfigOpen(false);
  };

  // Save the Assembly Voucher
  const handleSubmitAssemblyVoucher = (e: React.FormEvent) => {
    e.preventDefault();

    if (!autoloadedFinishedItem) {
      setFormError('Please register and save a configuration for this recipe before saving the voucher.');
      return;
    }

    const finQtyNum = parseFloat(formFinishedItemQty);
    if (isNaN(finQtyNum) || finQtyNum <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }

    if (formRows.length === 0) {
      setFormError('Assembly must consume at least one component');
      return;
    }

    for (let i = 0; i < formRows.length; i++) {
      if (!formRows[i].componentId) {
        setFormError(`Row #${i + 1}: Select a valid component`);
        return;
      }
      if (formRows[i].qty <= 0) {
        setFormError(`Row #${i + 1}: Component quantity must be greater than 0`);
        return;
      }
    }

    // Negative stock check on components
    const qtyByComponent: Record<string, number> = {};
    for (const row of formRows) {
      qtyByComponent[row.componentId] = (qtyByComponent[row.componentId] || 0) + row.qty;
    }

    for (const [compId, reqQty] of Object.entries(qtyByComponent)) {
      const available = getAvailableStockForComponent(compId);
      if (reqQty > available) {
        const comp = components.find((c) => c.id === compId);
        setFormError(
          `Insufficient stock for "${comp?.name || compId}". Required: ${reqQty} units, Available in stock: ${available} units. Negative stock is not permitted.`
        );
        return;
      }
    }

    if (editingRun) {
      const res = updateAssemblyRun({
        ...editingRun,
        date: formDate,
        finishedItemId: autoloadedFinishedItem.id,
        finishedItemQty: finQtyNum,
        components: formRows,
        details: formDetails.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot update assembly run.');
        return;
      }
    } else {
      const res = addAssemblyRun({
        id: formId,
        date: formDate,
        finishedItemId: autoloadedFinishedItem.id,
        finishedItemQty: finQtyNum,
        components: formRows,
        details: formDetails.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'Cannot record assembly run.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const getAvailableStockForComponent = (compId: string) => {
    const liveStock = getComponentStockAsOfDate(compId);
    let creditedBack = 0;
    if (editingRun && Array.isArray(editingRun.components)) {
      for (const row of editingRun.components) {
        if (row.componentId === compId) {
          creditedBack += Number(row.qty) || 0;
        }
      }
    }
    return liveStock + creditedBack;
  };

  const handleDelete = (id: string) => {
    const res = deleteAssemblyRun(id);
    if (!res.success) {
      alert(res.message);
      return;
    }
    setViewRun(null);
  };

  const finishedItemOptions = finishedItems.map((f) => ({
    value: f.id,
    label: `${f.name} (${f.id})`,
  }));

  const componentOptions = components.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `In Stock: ${getAvailableStockForComponent(c.id)} units`,
  }));

  const filteredRuns = assemblyRuns.filter((run) => {
    const fin = finishedItems.find((f) => f.id === run.finishedItemId);
    const finName = fin?.name || '';
    return (
      finName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.date.includes(searchQuery)
    );
  });

  const filteredPickerConfigs = configurations.filter((cfg) => {
    const fin = finishedItems.find((f) => f.id === cfg.finishedItemId);
    const name = fin?.name || '';
    return (
      name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      cfg.id.toLowerCase().includes(pickerSearch.toLowerCase())
    );
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Run Assembly</h2>
            <p className="text-[11px] text-slate-500">{assemblyRuns.length} assembly runs logged</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Run</span>
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
            placeholder="Search assembly runs by product, date, or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List of Assembly Runs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredRuns.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Hammer className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No assembly runs recorded</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap &quot;Run&quot; to execute a new production assembly</p>
          </div>
        ) : (
          filteredRuns.map((run) => {
            const product = finishedItems.find((f) => f.id === run.finishedItemId);

            return (
              <div
                key={run.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                      {run.id}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {run.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    +{run.finishedItemQty}x {product ? product.name : 'Unknown Product'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Consumed {run.components.length} component types
                  </p>
                  {run.details && (
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">
                      &quot;{run.details}&quot;
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewRun(run)}
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
      {viewRun && (
        <ViewModal
          isOpen={!!viewRun}
          onClose={() => setViewRun(null)}
          title={`Assembly: ${viewRun.id}`}
          subtitle={`Executed on ${viewRun.date}`}
          fields={[
            { label: 'Serial ID', value: viewRun.id },
            { label: 'Assembly Date', value: viewRun.date },
            {
              label: 'Finished Item Produced',
              value: finishedItems.find((f) => f.id === viewRun.finishedItemId)?.name || 'N/A',
            },
            {
              label: 'Quantity Produced',
              value: (
                <span className="text-sm font-bold text-emerald-700">
                  +{viewRun.finishedItemQty} units
                </span>
              ),
            },
            {
              label: 'Details / Notes',
              value: viewRun.details || 'None provided.',
              fullWidth: true,
            },
          ]}
          onEdit={() => openEditDialog(viewRun)}
          onDelete={() => handleDelete(viewRun.id)}
          deleteWarningTitle="Reverse Assembly Run?"
          deleteWarningMessage={`Deleting assembly run ${viewRun.id} will revert finished goods inventory by -${viewRun.finishedItemQty} units and restore consumed components back to stock.`}
        >
          {/* Consumed components table */}
          <div className="mt-3">
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>Consumed Components</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Total deducted from stock
              </span>
            </h5>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Component</th>
                    <th className="py-2 px-3 text-right">Deducted Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewRun.components.map((row, idx) => {
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

      {/* MAIN REDESIGNED RUN ASSEMBLY MODAL */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRun ? 'Edit Assembly Run' : 'Run Assembly Voucher'}
        subtitle={editingRun ? `Updating ${editingRun.id}` : 'Convert raw components into finished stock'}
        onSubmit={handleSubmitAssemblyVoucher}
        submitText={editingRun ? 'Update Assembly' : 'Save Assembly Voucher'}
        submitDisabled={!autoloadedFinishedItem}
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
              Serial ID
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
              Assembly Date
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

        {/* 1. LOAD CONFIGURATION FROM A DIALOG */}
        <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Loaded BOM Recipe
            </span>
            <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
              {activeConfig ? (
                <span>
                  {activeConfig.id} - {finishedItems.find((f) => f.id === activeConfig.finishedItemId)?.name || 'BOM'}
                </span>
              ) : (
                <span className="text-slate-400">No configuration loaded</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPickerSearch('');
              setIsConfigPickerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Load Configuration</span>
          </button>
        </div>

        {/* 2. FINISHED ITEM (NOT SELECTABLE OR EDITABLE) AUTOLOADED FROM LOADED CONFIGURATION */}
        {autoloadedFinishedItem ? (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Autoloaded Finished Item (Read-only)</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {autoloadedFinishedItem.name}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 font-semibold">
                  {autoloadedFinishedItem.id}
                </span>
                <span>·</span>
                <span>Config: {loadedConfigId}</span>
              </div>
            </div>
          </div>
        ) : baselineConfigId || formRows.length > 0 ? (
          /* IF THERE IS ANY CHANGE IN CONFIGURATION:
             Remove autoloaded finished item and give option to add new finished item */
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-900 leading-tight">
                  {baselineConfigId ? 'Configuration Recipe Modified' : 'Custom Assembly Recipe'}
                </h5>
                <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                  {baselineConfigId
                    ? 'Components or quantities were altered. The previous finished item has been unlinked. Add a new finished item to save this recipe.'
                    : 'Components have been added without a saved BOM. Add a new finished item to register and save this recipe.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartNewItemChain}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Add New Finished Item</span>
            </button>
          </div>
        ) : null}

        {/* 3. QUANTITY OF FINISHED GOODS TO PRODUCE */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Quantity of Finished Goods to Make <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={formFinishedItemQty}
            onChange={(e) => handleFinishedItemQtyChange(e.target.value)}
            placeholder="e.g. 5"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-slate-800 outline-none"
            required
          />
        </div>

        {/* 4. COMPONENTS AND THEIR QUANTITY */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Components in Assembly
              </label>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">
                {formRows.length} items
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {loadedConfigId && (
                <button
                  type="button"
                  onClick={() => {
                    const q = parseFloat(formFinishedItemQty) || 1;
                    applyConfiguration(loadedConfigId, q);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Reset to original loaded BOM"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Reset BOM</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Extra</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            {formRows.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No components added. Tap &quot;Load Configuration&quot; above.
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
                    {row.componentId && (
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        {(() => {
                          const avail = getAvailableStockForComponent(row.componentId);
                          const isExceeded = (row.qty || 0) > avail;
                          return (
                            <span
                              className={`font-semibold ${
                                isExceeded ? 'text-red-600' : 'text-slate-500'
                              }`}
                            >
                              In Stock: {avail} units {isExceeded && '⚠️ (Insufficient)'}
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
                    onClick={() => handleRemoveRow(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                    title="Remove this component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assembly Details / Work Order Notes
          </label>
          <input
            type="text"
            value={formDetails}
            onChange={(e) => setFormDetails(e.target.value)}
            placeholder="e.g. Production Batch #1 for client order"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
          />
        </div>
      </FormModal>

      {/* DIALOG 1: CONFIGURATION PICKER MODAL */}
      <FormModal
        isOpen={isConfigPickerOpen}
        onClose={() => setIsConfigPickerOpen(false)}
        title="Load Configuration (BOM)"
        subtitle="Choose a saved Bill of Materials template"
        onSubmit={(e) => e.preventDefault()}
        submitText="Close"
      >
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search configuration or product name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800"
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {filteredPickerConfigs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching configurations found.
            </div>
          ) : (
            filteredPickerConfigs.map((cfg) => {
              const fin = finishedItems.find((f) => f.id === cfg.finishedItemId);
              const isSelected = cfg.id === loadedConfigId;

              return (
                <button
                  type="button"
                  key={cfg.id}
                  onClick={() => {
                    const q = parseFloat(formFinishedItemQty) || 1;
                    applyConfiguration(cfg.id, q);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-800 bg-slate-100/80 shadow-xs'
                      : 'border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded font-semibold">
                        {cfg.id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cfg.components.length} components
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                      {fin ? fin.name : 'Finished Item'}
                    </h4>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </FormModal>

      {/* DIALOG 2: ADD FINISHED ITEM DIALOG (STEP 1 OF CREATION CHAIN) */}
      <FormModal
        isOpen={isAddFinishedItemOpen}
        onClose={() => setIsAddFinishedItemOpen(false)}
        title="Add Finished Item"
        subtitle="Step 1 of 2: Register new product for this customized recipe"
        onSubmit={handleSaveFinishedItem}
        submitText="Save &amp; Configure BOM"
      >
        {newFinError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{newFinError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Autogenerated Product ID
          </label>
          <input
            type="text"
            value={newFinId}
            readOnly
            className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-semibold cursor-not-allowed outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Finished Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newFinName}
            onChange={(e) => setNewFinName(e.target.value)}
            placeholder="e.g. Denontek Edge Gateway Pro Rev 2"
            className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Opening Quantity
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={newFinOpeningQty}
            onChange={(e) => setNewFinOpeningQty(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-slate-800 outline-none"
          />
        </div>
      </FormModal>

      {/* DIALOG 3: ADD CONFIGURATION DIALOG (STEP 2 OF CREATION CHAIN) */}
      <FormModal
        isOpen={isAddConfigOpen}
        onClose={() => setIsAddConfigOpen(false)}
        title="Add Configuration (BOM)"
        subtitle="Step 2 of 2: Save components recipe for the finished product"
        onSubmit={handleSaveConfiguration}
        submitText="Save Configuration"
      >
        {newConfigError && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{newConfigError}</span>
          </div>
        )}

        {/* Autogenerated Configuration ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Autogenerated Configuration ID
          </label>
          <input
            type="text"
            value={newConfigId}
            readOnly
            className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-semibold cursor-not-allowed outline-none"
          />
        </div>

        {/* Finished Item Dropdown (Preloaded with item added from previous screen) */}
        <div>
          <SearchableSelect
            label="Finished Item"
            options={finishedItemOptions}
            value={newConfigFinishedItemId}
            onChange={(val) => setNewConfigFinishedItemId(val)}
            placeholder="Select finished goods item..."
            required
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Preloaded with the newly created finished item. If you switch to another item with an existing BOM, you will be prompted to update it.
          </p>
        </div>

        {/* Components Table Pre-filled */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Required Components (Per 1 Finished Unit)
            </label>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">
              {newConfigRows.length} items pre-filled
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Component</th>
                  <th className="py-2 px-3 text-right">Qty / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {newConfigRows.map((row, idx) => {
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

        {/* Details Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Configuration Notes
          </label>
          <textarea
            rows={2}
            value={newConfigDetails}
            onChange={(e) => setNewConfigDetails(e.target.value)}
            placeholder="e.g. Standard BOM for Edge Gateway Rev 2"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none resize-none"
          />
        </div>
      </FormModal>

      {/* PROMPT: UPDATE EXISTING BOM CONFIRMATION */}
      <ConfirmModal
        isOpen={showUpdateExistingBomModal}
        title="Update Existing BOM Configuration?"
        message={`A BOM configuration is already registered for "${
          finishedItems.find((f) => f.id === newConfigFinishedItemId)?.name || 'this item'
        }" (${existingBomToUpdateId}). Do you want to update/overwrite the existing BOM with these new components?`}
        confirmText="Yes, Update BOM"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleConfirmUpdateExistingBom}
        onCancel={() => {
          // Bring user back to previous dialog (Add Configuration modal)
          setShowUpdateExistingBomModal(false);
        }}
      />
    </div>
  );
};
