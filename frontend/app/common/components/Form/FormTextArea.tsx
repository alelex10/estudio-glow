import type { UseFormRegister, FieldErrors } from "react-hook-form";
import clsx from "clsx";

interface FormTextAreaProps {
  label: string;
  placeholder: string;
  register: UseFormRegister<any>;
  name: string;
  errors: FieldErrors;
  rows?: number;
  className?: string;
}

export function FormTextArea({
  label,
  placeholder,
  register,
  name,
  errors,
  rows = 3,
  className = "",
}: FormTextAreaProps) {
  const hasError = errors[name];

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <textarea
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
        className={clsx(
          "w-full px-4 py-3 rounded-xl resize-none",
          "bg-white/5 border border-white/10",
          "placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          "transition-all duration-200",
          hasError && "border-red-500 focus:ring-red-500",
          className,
        )}
      />
      {hasError && (
        <p className="text-red-400 text-sm mt-1">
          {hasError.message as string}
        </p>
      )}
    </div>
  );
}
