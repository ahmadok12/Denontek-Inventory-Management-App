import React, { useState } from 'react';
import { X, Edit3, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ViewField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields: ViewField[];
  children?: React.ReactNode; // For tables, BOM components, etc.
  onEdit: () => void;
  onDelete: () => void;
  deleteWarningTitle?: string;
  deleteWarningMessage?: string;
}

export const ViewModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  fields,
  children,
  onEdit,
  onDelete,
  deleteWarningTitle = 'Delete Item?',
  deleteWarningMessage = 'Are you sure you want to delete this record? This action cannot be undone.',
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
          {/* Header with Top Edit Button & Close Button */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* TOP EDIT BUTTON */}
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Edit item"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              {fields.map((field, idx) => (
                <div
                  key={idx}
                  className={field.fullWidth ? 'col-span-2' : 'col-span-1'}
                >
                  <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    {field.label}
                  </span>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-words">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>

            {children}
          </div>

          {/* Footer with BOTTOM DELETE BUTTON */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Warning Dialog */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title={deleteWarningTitle}
        message={deleteWarningMessage}
        confirmText="Yes, Delete"
        cancelText="Keep Record"
        onConfirm={() => {
          setShowConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};
