import { Form, Link, redirect, useFetcher } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { FormError } from "~/common/components/Form/FormError";
import { setPasswordByTokenSchema, type SetPasswordByTokenFormData } from "~/common/schemas/auth";
import type { Route } from "./+types/set-password-by-token";
import { serverSetPasswordByToken } from "~/common/services/authApi.server";
import { ROUTES } from "~/common/constants/routes";

export function meta() {
  return [
    { title: "Establecer Contraseña | Glow Studio" },
    {
      name: "description",
      content: "Establecé una contraseña para tu cuenta de Glow Studio",
    },
  ];
}

type ActionData =
  | { error: string }
  | { success: true };

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData();
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const parseResult = setPasswordByTokenSchema.safeParse({ password, confirmPassword });
  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    const firstMessage = issues[0]?.message || "Error de validación";
    return { error: firstMessage };
  }

  try {
    await serverSetPasswordByToken(token, password);
    return redirect(`${ROUTES.LOGIN}?message=password_set`);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Ocurrió un error al establecer la contraseña." };
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect(ROUTES.LOGIN);
  }

  return { token };
}

export default function SetPasswordByToken({ loaderData }: Route.ComponentProps) {
  const { token } = loaderData;
  const fetcher = useFetcher<ActionData>();
  const error = fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined;
  const success = fetcher.data && "success" in fetcher.data ? fetcher.data.success : false;
  const isSubmitting = fetcher.state === "submitting";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordByTokenFormData>({
    resolver: zodResolver(setPasswordByTokenSchema),
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-3xl" />
      </div>

      <div
        className={clsx(
          "relative w-full max-w-md",
          "bg-white/70 backdrop-blur-xl rounded-3xl",
          "border border-primary-200/50 shadow-xl shadow-primary-200/20",
          "p-8",
        )}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
              <Logo variant="icon" className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Establecer contraseña
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Creá una contraseña para iniciar sesión con tu email
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-700 text-center">
                ¡Contraseña establecida correctamente! Ahora podés iniciar sesión con tu email y contraseña.
              </p>
            </div>
            <div className="text-center">
              <Link
                to={ROUTES.LOGIN}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Ir a iniciar sesión →
              </Link>
            </div>
          </div>
        ) : (
          <fetcher.Form
            className="space-y-4"
            method="post"
            onSubmit={handleSubmit((data) => {
              fetcher.submit({ ...data, token } as Record<string, string>, { method: "post" });
            })}
          >
            <input type="hidden" name="token" value={token} />

            <FormInput
              label="Nueva contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              register={register}
              name="password"
              errors={errors}
            />

            <FormInput
              label="Confirmar contraseña"
              type="password"
              placeholder="Repetí tu contraseña"
              register={register}
              name="confirmPassword"
              errors={errors}
            />

            <FormError message={error} />

            <FormButton loadingText="Guardando..." isLoading={isSubmitting}>Guardar contraseña</FormButton>

            <div className="text-center">
              <Link
                to={ROUTES.LOGIN}
                className="text-sm text-gray-400 hover:text-primary-500 transition-colors"
              >
                ← Volver a iniciar sesión
              </Link>
            </div>
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
