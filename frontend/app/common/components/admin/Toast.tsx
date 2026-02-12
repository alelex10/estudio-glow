import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { Check, X, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-blue-500 text-white",
  };

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        typeStyles[toast.type]
      )}
    >
      {icons[toast.type]}
      <span className="font-medium">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Sistema global de toasts
let toastCallback: ((toast: Omit<Toast, "id">) => void) | null = null;

export function toast(type: ToastType, message: string) {
  if (toastCallback) {
    toastCallback({ type, message });
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastCallback = (newToast) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...newToast, id }]);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
