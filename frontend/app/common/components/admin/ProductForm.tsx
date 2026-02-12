import { useState, useEffect } from "react";
import clsx from "clsx";
import type {
  CreateProductData,
  UpdateProductData,
  Product,
  ProductResponse,
} from "../../types/product-types";
import type { Category } from "../../types/category-types";
import { categoryService } from "../../services/categoryService";
import { LoadingSpinner } from "./LoadingSpinner";
import { Button } from "../Button";
import { ImageUp, Upload } from "lucide-react";

interface ProductFormProps {
  initialData?: ProductResponse;
  onSubmit: (
    data: CreateProductData | UpdateProductData,
    image?: File
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductData>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    categoryId: 0,
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.listCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        price: initialData.price,
        stock: initialData.stock,
        categoryId: initialData.category.id,
      });
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (formData.price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0";
    }
    if (formData.stock < 0) {
      newErrors.stock = "El stock no puede ser negativo";
    }
    if (!formData.categoryId) {
      newErrors.categoryId = "La categoría es requerida";
    }
    if (mode === "create" && !image) {
      newErrors.image = "La imagen es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit(formData, image || undefined);
  };

  const inputClassName = (hasError: boolean) =>
    clsx(
      "w-full px-4 py-2.5 rounded-lg border-2 transition-colors",
      "focus:outline-none focus:ring-2",
      hasError
        ? "border-red-300 focus:ring-red-400 focus:border-transparent"
        : "border-gray-200 focus:ring-primary-400 focus:border-transparent"
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del producto *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClassName(!!errors.name)}
          placeholder="Ej: Crema hidratante"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className={clsx(inputClassName(false), "resize-none")}
          rows={3}
          placeholder="Describe el producto..."
        />
      </div>

      {/* Precio y Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              className={clsx(inputClassName(!!errors.price), "pl-7")}
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock *
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
            }
            className={inputClassName(!!errors.stock)}
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
          )}
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría *
        </label>

        {isLoadingCategories ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <LoadingSpinner size="sm" />
            Cargando categorías...
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, categoryId: category.id })
                }
                className={clsx(
                  "px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400/50",
                  formData.categoryId === category.id
                    ? "bg-primary-500 text-white border-primary-500 shadow-primary-500/30 shadow-lg scale-[1.02]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No hay categorías disponibles
          </p>
        )}

        {errors.categoryId && (
          <p className="mt-2 text-sm text-red-500">{errors.categoryId}</p>
        )}
      </div>

      {/* Imagen */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagen{" "}
          {mode === "create" ? "*" : "(dejar vacío para mantener actual)"}
        </label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div
            className={clsx(
              "w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden",
              errors.image ? "border-red-300" : "border-gray-200"
            )}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageUp className="text-gray-200" size={30} />
            )}
          </div>

          {/* Input */}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="product-image"
            />
            <label
              htmlFor="product-image"
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors",
                "border border-gray-200 text-gray-700",
                "hover:bg-gray-50"
              )}
            >
              <Upload className="w-5 h-5" />
              Subir imagen
            </label>
            {image && (
              <p className="mt-2 text-sm text-gray-500">{image.name}</p>
            )}
          </div>
        </div>
        {errors.image && (
          <p className="mt-1 text-sm text-red-500">{errors.image}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <Button type="submit" variant="tertiary" disabled={isLoading}>
          {isLoading && <LoadingSpinner size="sm" />}
          {mode === "create" ? "Crear producto" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
