import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useSubmit, useNavigation } from 'react-router';
import clsx from 'clsx';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchFilterProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchFilter({ 
  placeholder = "Buscar...", 
  paramName = "q",
  className = "",
  debounceMs = 300
}: SearchFilterProps) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const justSubmitted = useRef(false);
  
  const isSearching = navigation.state !== "idle" && navigation.location?.search.includes(paramName);
  const queryValue = searchParams.get(paramName) || "";
  
  const [inputValue, setInputValue] = useState(queryValue);

  // Sync with URL only for external changes (back button, etc), not our own submits
  useEffect(() => {
    if (justSubmitted.current) {
      justSubmitted.current = false;
      return;
    }
    setInputValue(queryValue);
  }, [queryValue]);

  // Build params object preserving existing filters
  const buildSearchParams = (value: string | null) => {
    const params: Record<string, string> = {};
    
    // Preserve all existing params
    searchParams.forEach((v, k) => {
      if (k !== paramName) {
        params[k] = v;
      }
    });
    
    // Add/update search param
    if (value) {
      params[paramName] = value;
    }
    
    return params;
  };

  // Debounced submit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== queryValue) {
        justSubmitted.current = true;
        submit(
          buildSearchParams(inputValue),
          { method: "get", replace: true }
        );
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, queryValue, submit, paramName, debounceMs, searchParams]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue("");
    justSubmitted.current = true;
    submit(
      buildSearchParams(null),
      { method: "get", replace: true }
    );
  }, [submit, searchParams]);

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

      {/* Loading spinner or Clear button */}
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
