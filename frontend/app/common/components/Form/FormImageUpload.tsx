import { useState, useRef, useEffect } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import clsx from "clsx";

interface Props {
  label?: string;
  name: string;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  initialPreview?: string;
  required?: boolean;
}

export function FormImageUpload({
  label,
  name,
  register,
  errors,
  initialPreview,
  required = false,
}: Props) {
  const [preview, setPreview] = useState<string | null>(
    initialPreview || null
  );
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const setFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
      inputRef.current.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && "*"}
        </label>
      )}

      <input
        type="file"
        accept="image/*"
        {...register(name)}
        ref={(e) => {
          register(name).ref(e);
          inputRef.current = e;
        }}
        className="hidden"
        onChange={(e) => {
          register(name).onChange(e);
          handleChange(e);
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          "flex flex-col items-center justify-center gap-2",
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-32 h-32 object-cover rounded-lg shadow"
          />
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">
              Arrastrá una imagen o hacé click
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, WEBP
            </p>
          </>
        )}
      </div>

      {errors[name] && (
        <p className="text-red-500 text-sm">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
}