import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import clsx from "clsx";
import type {
  CreateProductData,
  UpdateProductData,
  Product,
  ProductResponse,
} from "../../types/product-types";
import type { Category } from "../../types/category-types";
import { categoryService } from "../../services/categoryService";
import {
  FormInput,
  FormTextArea,
  FormButton,
  FormError,
  FormImageUpload,
} from "../Form";
import { LoadingSpinner } from "./LoadingSpinner";
import { Button } from "../Button";

type ProductFormData = CreateProductData & { image?: File };

const getProductSchema = (mode: "create" | "edit") =>
  z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    price: z.number().min(0.01, "El precio debe ser mayor a 0"),
    stock: z.number().min(0, "El stock no puede ser negativo"),
    categoryId: z.string().min(1, "La categoría es requerida"),
    image: z
      .any()
      .transform((files) => files?.[0])
      .refine(
        (file) => mode === "edit" || file instanceof File,
        mode === "create" ? "Archivo requerido" : undefined
      ),
  });

interface ProductFormProps {
  initialData?: ProductResponse;
  onSubmit: (
    data: CreateProductData | UpdateProductData,
    image?: File,
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(getProductSchema(mode)) as any,
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      stock: initialData?.stock || 0,
      categoryId: initialData?.category?.id || "",
    },
  });

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

  const onFormSubmit = async (data: any) => {
    const { image: imageFile, ...productData } = data;

    await onSubmit(productData, imageFile);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-4 min-h-screen p-4"
    >
      {/* Nombre */}
      <div className="mb-4">
        <FormInput
          label="Nombre del producto"
          type="text"
          placeholder="Ej: Crema hidratante facial"
          register={register}
          name="name"
          errors={errors}
          className="text-gray-900 placeholder:text-gray-400 bg-white border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md w-full"
        />
      </div>

      {/* Descripción */}
      <div className="mb-4">
        <FormTextArea
          label="Descripción"
          placeholder="Describe los beneficios, ingredientes y características del producto..."
          register={register}
          name="description"
          errors={errors}
          rows={3}
          className="text-gray-900 placeholder:text-gray-400 bg-white border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md resize-none w-full"
        />
      </div>

      {/* Precio y Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <FormInput
          label="Precio"
          type="number"
          placeholder="0.00"
          register={register}
          name="price"
          errors={errors}
          step="0.01"
          min="0"
          className="text-gray-900 placeholder:text-gray-400 bg-white border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md w-full"
        />

        <FormInput
          label="Stock"
          type="number"
          placeholder="0"
          register={register}
          name="stock"
          errors={errors}
          min="0"
          className="text-gray-900 placeholder:text-gray-400 bg-white border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md w-full"
        />
      </div>

      {/* Categoría */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Categoría
        </label>

        {isLoadingCategories ? (
          <div className="flex items-center justify-center py-4 bg-gray-50 rounded-lg border border-gray-200">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-600 font-medium">
              Cargando categorías...
            </span>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setValue("categoryId", category.id)}
                className={clsx(
                  "px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-300 transform",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400/50",
                  "hover:scale-105 active:scale-95",
                  watch("categoryId") === category.id
                    ? "bg-linear-to-r from-primary-500 to-primary-600 text-white border-transparent shadow-lg shadow-primary-500/30"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700 font-medium">
              No hay categorías disponibles
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Crea categorías primero para poder asignar productos
            </p>
          </div>
        )}

        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-500 font-medium bg-red-50 p-2 rounded-lg">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      {/* Imagen */}
      <div>
        <FormImageUpload
          label="Imagen del producto"
          register={register}
          name="image"
          errors={errors}
          initialPreview={initialData?.imageUrl}
          required={mode === "create"}
        />
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={clsx(
            "flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg",
            "hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 order-2 sm:order-1",
          )}
        >
          Cancelar
        </button>
        <FormButton
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          loadingText={mode === "create" ? "Creando..." : "Guardando..."}
          className="flex-1 bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 order-1 sm:order-2"
        >
          {mode === "create" ? "Crear producto" : "Guardar cambios"}
        </FormButton>
      </div>
    </form>
  );
}
