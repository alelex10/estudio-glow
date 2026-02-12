import clsx from "clsx";
import { Trash2, AlertTriangle, Info, Loader2 } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: "bg-red-100 text-red-600",
            button: "bg-red-600 hover:bg-red-700 text-white",
        },
        warning: {
            icon: "bg-amber-100 text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700 text-white",
        },
        info: {
            icon: "bg-blue-100 text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700 text-white",
        },
    };

    const icons = {
        danger: <Trash2 className="w-6 h-6" />,
        warning: <AlertTriangle className="w-6 h-6" />,
        info: <Info className="w-6 h-6" />,
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={clsx("flex-shrink-0 p-3 rounded-full", variantStyles[variant].icon)}>
                            {icons[variant]}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            <p className="mt-2 text-sm text-gray-600">{message}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2",
                                variantStyles[variant].button
                            )}
                        >
                            {isLoading && (
                                <Loader2 className="animate-spin w-4 h-4" />
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
