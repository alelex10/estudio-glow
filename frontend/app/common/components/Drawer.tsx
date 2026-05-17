import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    showCloseButton?: boolean;
    ariaLabel?: string;
}

export default function Drawer({ isOpen, onClose, children, showCloseButton = true, ariaLabel = "Drawer" }: DrawerProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const lastActiveRef = useRef<HTMLElement | null>(null);

    // Close on Escape, restore focus on close, basic focus trap inside the panel.
    useEffect(() => {
        if (!isOpen) return;
        lastActiveRef.current = document.activeElement as HTMLElement | null;

        const panel = panelRef.current;
        const focusables = () =>
            panel
                ? Array.from(panel.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                ))
                : [];
        // Move focus into the panel
        const initial = focusables()[0] ?? panel;
        initial?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== "Tab") return;
            const items = focusables();
            if (items.length === 0) {
                e.preventDefault();
                return;
            }
            const first = items[0]!;
            const last = items[items.length - 1]!;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        // Prevent body scroll while open
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            lastActiveRef.current?.focus();
        };
    }, [isOpen, onClose]);

    return (
        <div
            className={clsx("fixed inset-0 z-50 transition-all duration-500 ease-in-out",
                isOpen ? "visible" : "invisible"
            )}
            aria-hidden={!isOpen}
        >
            <div
                className={clsx("absolute inset-0 h-screen bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-in-out",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                tabIndex={-1}
                className={clsx("absolute top-0 left-0 w-80 h-screen bg-primary-900 shadow-2xl p-6 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {showCloseButton && (
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={onClose}
                            className="text-primary-100 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                            aria-label="Cerrar"
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}
