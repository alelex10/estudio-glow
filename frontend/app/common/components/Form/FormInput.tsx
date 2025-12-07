import type { UseFormRegister, FieldErrors } from "react-hook-form";
import clsx from "clsx";

interface FormInputProps {
  label: string;
  type: string;
  placeholder: string;
  register: UseFormRegister<any>;
  name: string;
  errors: FieldErrors;
  className?: string;
}

export function FormInput({
  label,
  type,
  placeholder,
  register,
  name,
  errors,
  className = "",
}: FormInputProps) {
  const hasError = errors[name];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={clsx(
          "w-full px-4 py-3 rounded-xl",
          "bg-white/5 border border-white/10",
          "text-white placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          "transition-all duration-200",
          hasError && "border-red-500 focus:ring-red-500",
          className
        )}
      />
      {hasError && (
        <p className="text-red-400 text-sm mt-1">{hasError.message as string}</p>
      )}
    </div>
  );
}
