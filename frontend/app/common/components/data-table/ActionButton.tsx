import clsx from "clsx";
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface ActionButtonProps {
  onClick: () => void;
  variant?: "edit" | "delete" | "view" | "approve" | "reject";
  disabled?: boolean;
}

export function ActionButton({
  onClick,
  variant = "view",
  disabled,
}: ActionButtonProps) {
  const variants = {
    view: {
      className: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      icon: <Eye className="w-4 h-4" />,
    },
    edit: {
      className: "text-primary-600 hover:text-primary-800 hover:bg-primary-50",
      icon: <Edit className="w-4 h-4" />,
    },
    delete: {
      className: "text-red-600 hover:text-red-800 hover:bg-red-50",
      icon: <Trash2 className="w-4 h-4" />,
    },
    approve: {
      className: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    reject: {
      className: "text-red-600 hover:text-red-800 hover:bg-red-50",
      icon: <XCircle className="w-4 h-4" />,
    },
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={clsx(
        "p-2 rounded-lg transition-colors",
        variants[variant].className,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {variants[variant].icon}
    </button>
  );
}
