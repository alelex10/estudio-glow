import type { UseFormRegister, FieldErrors } from "react-hook-form";
import clsx from "clsx";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps {
  label: string;
  type: string;
  placeholder: string;
  register: UseFormRegister<any>;
  name: string;
  errors: FieldErrors;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}

export function FormInput({
  label,
  type,
  placeholder,
  register,
  name,
  errors,
  className = "",
  step,
  min,
  max,
}: FormInputProps) {
  const hasError = errors[name];
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          {...register(name, { valueAsNumber: type === 'number' })}
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg border transition-all duration-200 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-400/20",
            "bg-white border-gray-200 focus:border-primary-400 hover:border-gray-300",
            "text-gray-900 placeholder:text-gray-400 font-medium text-sm",
            hasError && "border-red-500 focus:ring-red-500 focus:border-red-500",
            isPassword && "pr-10",
            className
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {hasError && (
        <p className="mt-1 text-sm text-red-500 font-medium">{hasError.message as string}</p>
      )}
    </div>
  );
}
