import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  placeholder = "Buscar...",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || "");

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className={clsx("relative", className)}>
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full pl-10 pr-10 py-2.5 text-sm",
          "bg-white border border-gray-200 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
          "placeholder:text-gray-400 text-gray-700",
          "transition-all duration-200"
        )}
      />

      {/* Clear button */}
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
