import { useState } from "react";
import { Form, redirect, useNavigate } from "react-router";
import clsx from "clsx";
import { authService } from "~/common/services/authService";
import { Logo } from "~/common/components/Logo";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import type { Route } from "../+types/layout";
import { userContext } from "~/common/context/user-context";

export async function action({
    request,
    context,
}: Route.ActionArgs) {
    let formData = await request.formData();
    let email = formData.get("email") as string;
    let password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña son obligatorios" };
    }

    try {
        const response = await authService.login({ email, password });

        // Verificar que sea admin
        if (response.user.role !== "admin") {
            throw new Error("No tienes permisos de administrador");
        }

        // Guardar usuario en el contexto
        context.set(userContext, response.user);

        // Establecer cookie para persistir la sesión
        const userCookie = `admin_user=${encodeURIComponent(JSON.stringify(response.user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`;
        
        // Redirigir al dashboard con la cookie
        return redirect("/admin", {
            headers: {
                "Set-Cookie": userCookie,
            },
        });
    } catch (err) {
        console.log("Login error", err);
        return { error: err instanceof Error ? err.message : "Error al iniciar sesión" };
    }
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await authService.login({ email, password });

            // Verificar que sea admin
            if (response.user.role !== "admin") {
                setError("No tienes permisos de administrador");
                return;
            }

            // Guardar usuario
            authService.storeUser(response.user);

            // Redirigir al dashboard
            navigate("/admin");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
            </div>

            {/* Card de login */}
            <div
                className={clsx(
                    "relative w-full max-w-md",
                    "bg-white/10 backdrop-blur-xl rounded-2xl",
                    "border border-white/20 shadow-2xl",
                    "p-8"
                )}
            >
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
                            <Logo variant="icon" className="w-12 h-12" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Estudio Glow</h1>
                    <p className="text-gray-400 mt-2">Panel de Administración</p>
                </div>

                {/* Formulario */}
                <Form method="post" className="space-y-5">

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            name="email"
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl",
                                "bg-white/5 border border-white/10",
                                "text-white placeholder:text-gray-500",
                                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                "transition-all duration-200"
                            )}
                            placeholder="admin@estudioglow.com"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            name="password"
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl",
                                "bg-white/5 border border-white/10",
                                "text-white placeholder:text-gray-500",
                                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                "transition-all duration-200"
                            )}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={clsx(
                            "w-full py-3 px-4 rounded-xl",
                            "bg-linear-to-r from-primary-500 to-primary-600",
                            "text-white font-semibold",
                            "hover:from-primary-600 hover:to-primary-700",
                            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900",
                            "transition-all duration-200",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "flex items-center justify-center gap-2"
                        )}
                    >
                        {isLoading && <LoadingSpinner size="sm" />}
                        {isLoading ? "Ingresando..." : "Ingresar"}
                    </button>
                </Form>

                {/* Link a tienda */}
                <p className="mt-6 text-center text-sm text-gray-400">
                    <a href="/" className="hover:text-primary-400 transition-colors">
                        ← Volver a la tienda
                    </a>
                </p>
            </div>
        </div>
    );
}
