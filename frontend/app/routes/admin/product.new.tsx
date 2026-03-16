import { useActionData, useNavigation, useSubmit, useNavigate } from "react-router";
import { productService } from "~/common/services/productService";
import { ProductForm } from "~/common/components/admin/ProductForm";
import type {
  CreateProductData,
  UpdateProductData,
} from "~/common/types/product-types";
import type { Route } from "./+types/product.new";
import { getToken } from "~/common/services/auth.server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nuevo Producto | Admin Dashboard" },
    { name: "description", content: "Crear nuevo producto - Estudio Glow" },
  ];
}

export async function loader({ request }: Route.ActionArgs) {
  const token = await getToken(request);
  return { token };
}

export async function action({ request }: Route.ActionArgs) {
  const token = await getToken(request);
  const formData = await request.formData();

  try {
    const rawData = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      categoryId: formData.get("categoryId") as string,
    };

    const imageFile = formData.get("image") as File;
    
    if (!imageFile || imageFile.size === 0) {
      return { errors: ["La imagen es requerida"] };
    }

    if (!token) {
      return { errors: ["No autorizado"] };
    }

    await productService.createProduct(rawData, imageFile, token);
    return redirect("/admin/products");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error al crear producto";
    return { errors: [errorMessage] };
  }
}

export default function AdminProductNew() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  const isLoading = navigation.state === "submitting";

  const handleSubmit = async (
    data: CreateProductData | UpdateProductData,
    image?: File
  ) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    if (image) {
      formData.append("image", image);
    }
    
    submit(formData, { 
      method: "post",
      encType: "multipart/form-data"
    });
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea un nuevo producto para tu catálogo
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ProductForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
