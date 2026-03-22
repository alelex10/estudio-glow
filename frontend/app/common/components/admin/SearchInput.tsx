import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useSubmit, useNavigation } from "react-router";
import clsx from "clsx";
import { Search, X, Loader2 } from "lucide-react";

interface SearchInputProps {
  paramName: string;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  replace?: boolean;
}

export function SearchInput({
  paramName,
  placeholder = "Buscar...",
  className,
  debounceMs = 200,
  replace = true,
}: SearchInputProps) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSearching = navigation.state !== "idle";
  const queryValue = searchParams.get(paramName) || "";

  const [inputValue, setInputValue] = useState(queryValue);

  useEffect(() => {
    setInputValue(queryValue);
  }, [queryValue]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue !== queryValue) {
        submit(
          inputValue ? { [paramName]: inputValue } : {},
          { method: "get", replace }
        );
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [inputValue, queryValue, submit, paramName, replace, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue("");
    submit(
      {},
      { method: "get", replace }
    );
  }, [submit, replace]);

  return (
    <div className={clsx("relative", className)}>
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>

      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={clsx(
          "w-full pl-10 pr-10 py-2.5 text-sm",
          "bg-white border border-gray-200 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
          "placeholder:text-gray-400 text-gray-700",
          "transition-all duration-200"
        )}
      />

      {/* Loading spinner o Clear button */}
      {isSearching ? (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      ) : inputValue ? (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}
