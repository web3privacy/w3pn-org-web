"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

export type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
});

export function useAdminToast() {
  return useContext(ToastContext);
}

let toastIdCounter = 0;

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <div className="admin-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  const iconMap: Record<ToastType, string> = {
    success: "\u2713",
    error: "\u2717",
    info: "\u2139",
  };

  return (
    <div className={`admin-toast admin-toast--${toast.type}`} role="alert">
      <span className="admin-toast-icon">{iconMap[toast.type]}</span>
      <span className="admin-toast-msg">{toast.message}</span>
      <button
        type="button"
        className="admin-toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
