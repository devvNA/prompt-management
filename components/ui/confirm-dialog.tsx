"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "destructive" | "warning" | "info";
}

const variantStyles = {
  destructive: {
    icon: "text-red-400",
    iconBg: "bg-red-500/10",
    iconBorder: "border-red-500/20",
    button: "destructive" as const,
  },
  warning: {
    icon: "text-amber-400",
    iconBg: "bg-amber-500/10",
    iconBorder: "border-amber-500/20",
    button: "secondary" as const,
  },
  info: {
    icon: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
    iconBorder: "border-indigo-500/20",
    button: "default" as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll & trap focus when open
  useEffect(() => {
    if (!open) return;

    // Focus the cancel button when the dialog opens
    const raf = requestAnimationFrame(() => cancelRef.current?.focus());

    // Close on Escape
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, onOpenChange]);

  // Use portal to render above Radix Dialog focus-trap
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-2xl">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 px-6 py-5">
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg} ${styles.iconBorder}`}
                  >
                    <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
                  </div>
                  <div className="space-y-1 pt-1">
                    <h3
                      id="confirm-dialog-title"
                      className="text-lg font-semibold text-zinc-100"
                    >
                      {title}
                    </h3>
                    <p
                      id="confirm-dialog-desc"
                      className="text-sm leading-relaxed text-zinc-400"
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 bg-zinc-950/30 px-6 py-4">
                <Button
                  ref={cancelRef}
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={styles.button}
                  onClick={() => {
                    onConfirm();
                  }}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
