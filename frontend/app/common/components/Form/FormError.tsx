import clsx from "clsx";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={clsx(
        "p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm",
        className
      )}
    >
      {message}
    </div>
  );
}
