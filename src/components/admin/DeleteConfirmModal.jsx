"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import AdminButton from '@/components/admin/AdminButton';

export default function DeleteConfirmModal({
  isOpen,
  title,
  itemName,
  itemType = 'data',
  message,
  onConfirm,
  onClose,
  isLoading = false
}) {
  if (!isOpen) return null;

  const displayTitle = title || `Hapus ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const displayMessage = message || (itemName 
    ? `Apakah Anda yakin ingin menghapus "${itemName}"?`
    : `Apakah Anda yakin ingin menghapus ${itemType} ini?`);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-3.5 sm:p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden p-4 sm:p-6 select-none"
        >
          <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight break-words">
                  {displayTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 leading-relaxed break-words">
            {displayMessage}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-3.5 sm:pt-4 border-t border-gray-100">
            <AdminButton
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Batal
            </AdminButton>
            <AdminButton
              type="button"
              onClick={onConfirm}
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={isLoading}
            >
              {isLoading ? 'Menghapus...' : 'Hapus'}
            </AdminButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
