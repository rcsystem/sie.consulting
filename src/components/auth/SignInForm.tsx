import { useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuthStore } from "../../store/useAuthStore";

export default function SignInForm() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);
  const cargando = useAuthStore((state) => state.cargando);

  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState("admin@rh.local");
  const [password, setPassword] = useState("Admin12345");
  const [error, setError] = useState("");

  const iniciar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(correo, password);
      navigate("/");
    } catch (error: any) {
      const mensaje =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.email?.[0] ||
        "No fue posible iniciar sesión.";

      setError(mensaje);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="mx-auto flex w-full max-w-md flex-1 items-start justify-center px-4 pt-10 lg:pt-16">
        <div className="w-full">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center bg-brand-500 text-xl font-bold text-white">
              RH
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Bienvenido
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Accede al sistema de Recursos Humanos para gestionar permisos,
              usuarios e incidencias.
            </p>
          </div>

          <form onSubmit={iniciar}>
            <div className="space-y-5">
              <div>
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="rounded-none border-gray-300 dark:border-gray-700"
                />
              </div>

              <div>
                <Label>Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="rounded-none border-gray-300 pr-11 dark:border-gray-700"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              {error ? (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : null}

              <div>
                <Button
                  className="w-full rounded-none"
                  size="sm"
                  disabled={cargando}
                >
                  {cargando ? "Ingresando..." : "Iniciar sesión"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Acceso con credenciales reales del sistema.
          </div>
        </div>
      </div>
    </div>
  );
}