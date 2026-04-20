import clsx from "clsx";

export interface TabOption {
  value: string;
  label: string;
}

interface StatusTabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const tabVariantStyles = {
  active: "bg-gray-900 text-white border-gray-900",
  inactive: "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
};

export function StatusTabs({
  options,
  value,
  onChange,
  className,
}: StatusTabsProps) {
  return (
    <div className={clsx("flex gap-2 flex-wrap", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
            value === option.value
              ? tabVariantStyles.active
              : tabVariantStyles.inactive
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
