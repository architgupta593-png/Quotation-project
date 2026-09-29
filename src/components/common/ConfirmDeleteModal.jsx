"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";

/**
 * Universal Luxury Delete Confirmation Consent Modal
 * Prevents accidental deletions with high-visibility item preview, impact advisory,
 * and double-click prevention.
 */
export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  itemTitle = "",
  itemSubtitle = "",
  itemBadge = "",
  warningMessage = "This action is permanent and cannot be undone.",
  confirmText = "Yes, Delete Permanently",
  loading = false,
}) {
  const cancelBtnRef = useRef(null);

  // Focus cancel button on open & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    function handleKeyDown(e) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative">
        {/* Close Icon */}
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
            title="Cancel and close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {/* Warning Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/15 via-red-500/10 to-amber-500/15 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h3 className="text-[18px] font-black text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-[12.5px] text-slate-500 font-medium">
              Please review the item details below before confirming.
            </p>
          </div>

          {/* Item Preview Card */}
          {itemTitle && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-black text-slate-900 truncate flex-1">
                  {itemTitle}
                </span>
                {itemBadge && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 flex-shrink-0">
                    {itemBadge}
                  </span>
                )}
              </div>
              {itemSubtitle && (
                <p className="text-[11.5px] text-slate-500 font-medium truncate">
                  {itemSubtitle}
                </p>
              )}
            </div>
          )}

          {/* Warning Impact Callout */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-amber-950 font-medium leading-relaxed">
              {warningMessage}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[12.5px] font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-700 text-white text-[12.5px] font-black transition-all flex items-center gap-2 shadow-sm shadow-rose-600/30 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
