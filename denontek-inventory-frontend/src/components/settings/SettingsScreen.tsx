import React, { useState, useRef } from 'react';
import {
  Building2,
  Users,
  Tag,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import type { SettingsModule } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { VendorsManager } from './VendorsManager';
import { CustomersManager } from './CustomersManager';
import { CategoriesManager } from './CategoriesManager';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsScreen: React.FC = () => {
  const [activeModule, setActiveModule] = useState<SettingsModule | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    vendors,
    customers,
    categories,
    resetToSampleData,
    exportDatabaseJson,
    importDatabaseJson,
  } = useInventory();

  if (activeModule === 'vendors') {
    return <VendorsManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'customers') {
    return <CustomersManager onBack={() => setActiveModule(null)} />;
  }
  if (activeModule === 'categories') {
    return <CategoriesManager onBack={() => setActiveModule(null)} />;
  }

  const handleExport = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denontek_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJson(content);
        if (success) {
          alert('Database restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const settingsItems = [
    {
      id: 'vendors' as SettingsModule,
      title: 'Vendors',
      desc: 'Manage component suppliers and partners',
      icon: Building2,
      count: vendors.length,
    },
    {
      id: 'customers' as SettingsModule,
      title: 'Customers',
      desc: 'Manage buyers, distributors, and clients',
      icon: Users,
      count: customers.length,
    },
    {
      id: 'categories' as SettingsModule,
      title: 'Components Category',
      desc: 'Classification groups for raw materials',
      icon: Tag,
      count: categories.length,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200/80">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
          Preferences &amp; Masters
        </span>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure entity masters, categories, and system data.
        </p>
      </div>

      {/* Master Data Section */}
      <div className="p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Master Directories
        </div>

        {settingsItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className="w-full bg-white hover:bg-slate-50/80 active:scale-[0.99] border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between text-left shadow-xs transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-slate-200/70 text-slate-800 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {item.count}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </button>
          );
        })}

        {/* Data Tools */}
        <div className="pt-4 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Data &amp; Backup
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExport}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-slate-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">Export Backup (JSON)</div>
                <div className="text-[10px] text-slate-400">Download complete inventory database</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              Save
            </span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-slate-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">Restore from Backup</div>
                <div className="text-[10px] text-slate-400">Import a previously saved JSON file</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              Upload
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-red-500" />
              <div>
                <div className="text-xs font-bold text-red-600">Reset Demo Data</div>
                <div className="text-[10px] text-slate-400">Restore factory default sample records</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
              Reset
            </span>
          </button>
        </div>

        {/* Business Info Banner */}
        <div className="mt-4 p-3 bg-slate-100/70 rounded-xl border border-slate-200/60 text-center">
          <p className="text-xs font-bold text-slate-800">Denontek Inventory Suite</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Mobile-first minimalistic inventory &amp; assembly ledger</p>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset All Data?"
        message="This will overwrite any newly created components, finished goods, configurations, or movements with default starter data. Are you sure?"
        confirmText="Yes, Reset Data"
        cancelText="Cancel"
        onConfirm={() => {
          resetToSampleData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
