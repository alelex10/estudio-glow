import { Logo } from "./Logo";
import { X } from "lucide-react";
import clsx from "clsx";

interface DrawerHeaderProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  borderColor?: string;
  subtitleColor?: string;
  closeButtonColor?: string;
}

export default function DrawerHeader({
  title,
  subtitle,
  onClose,
  borderColor = "border-gray-700",
  subtitleColor = "text-gray-400",
  closeButtonColor = "text-gray-400 hover:text-white"
}: DrawerHeaderProps) {
  return (
    <div className={clsx("flex items-center justify-between p-6 border-b", borderColor)}>
      <div className="flex items-center gap-3">
        <Logo variant="icon" className="w-10 h-10" />
        <div>
          <h1 className="text-white font-bold text-lg">{title}</h1>
          <span className={clsx("text-xs", subtitleColor)}>{subtitle}</span>
        </div>
      </div>
      <button
        onClick={onClose}
        className={clsx("transition-colors", closeButtonColor)}
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
