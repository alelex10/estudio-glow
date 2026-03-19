import type { UseFormRegister, FieldErrors } from "react-hook-form";
import clsx from "clsx";

interface FormSelectProps {
  label: string;
  register: UseFormRegister<any>;
  name: string;
  errors: FieldErrors;
  options: { value: string; label: string }[];
  className?: string;
}

export function FormSelect({
  label,
  register,
  name,
  errors,
  options,
  className = "",
}: FormSelectProps) {
  const hasError = errors[name];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <select
        {...register(name)}
        className={clsx(
          "w-full px-4 py-3 rounded-xl",
          "bg-white/5 border border-white/10",
          "text-white",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          "transition-all duration-200",
          hasError && "border-red-500 focus:ring-red-500",
          className
        )}
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="text-red-400 text-sm mt-1">{hasError.message as string}</p>
      )}
    </div>
  );
}
