import clsx from "clsx";
import { X } from "lucide-react";
import React from "react";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, children }: DrawerProps) {
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
                className={clsx("absolute top-0 left-0 w-80 h-screen bg-primary-700 shadow-2xl p-6 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex justify-end mb-6">
                    <button
                        onClick={onClose}
                        className="text-primary-100 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        aria-label="Close drawer"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
