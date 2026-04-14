import { useEffect } from "react";
import { useNavigation, useSubmit, useNavigate, useActionData } from "react-router";
import { productService } from "~/common/services/productService";
import { ProductForm } from "~/common/components/admin/ProductForm";
import type {
  CreateProductData,
  UpdateProductData,
} from "~/common/types/product-types";
import type { Route } from "./+types/product.new";
import { requireAuth } from "~/common/actions/auth-helpers";
import { parseFormData, getFileFromFormData } from "~/common/actions/form-helpers";
import { handleActionError } from "~/common/actions/error-helpers";
import { toast } from "~/common/components/Toast";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nuevo Producto | Admin Dashboard" },
    { name: "description", content: "Crear nuevo producto - Estudio Glow" },
  ];
}

export async function loader({ request }: Route.ActionArgs) {
  const token = await requireAuth(request);
  return { token };
}

interface ProductFormData {
  name: string;
  description: string | undefined;
  price: number;
  stock: number;
  categoryId: string;
}

interface ActionSuccess {
  success: true;
}

interface ActionError {
  success: false;
  errors: string[];
}

type ActionData = ActionSuccess | ActionError;

function isActionError(data: ActionData): data is ActionError {
  return data.success === false;
}

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  try {
    const token = await requireAuth(request);
    const formData = await request.formData();

    const data = parseFormData<ProductFormData>(formData, {
      name: (v) => String(v),
      description: (v) => v ? String(v) : undefined,
      price: (v) => parseFloat(String(v)),
      stock: (v) => parseInt(String(v)),
      categoryId: (v) => String(v),
    });

    const imageFile = getFileFromFormData(formData, "image");

    if (!imageFile) {
      return { success: false, errors: ["La imagen es requerida"] };
    }

    await productService.createProduct(data, imageFile, token);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export default function AdminProductNew() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  const isLoading = navigation.state === "submitting";

  // Show toast and navigate on success/error
  useEffect(() => {
    if (actionData?.success) {
      toast("success", "Producto creado correctamente");
      navigate("/admin/products");
    }
    if (actionData && isActionError(actionData)) {
      actionData.errors.forEach((error) => toast("error", error));
    }
  }, [actionData, navigate]);

  const handleSubmit = async (
    data: CreateProductData | UpdateProductData,
    image?: File,
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
      encType: "multipart/form-data",
    });
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 md:p-6">
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
