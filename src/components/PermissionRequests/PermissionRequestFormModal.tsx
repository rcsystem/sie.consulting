import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { UsuarioSistema } from "../../types/users";
import type {
  FormularioSolicitudPermiso,
  RespuestaSolicitudPermiso,
} from "../../types/permissionRequests";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onGuardado: () => Promise<void> | void;
  permitirCapturarParaOtros?: boolean;
  usuarios?: UsuarioSistema[];
};

const estadoInicial: FormularioSolicitudPermiso = {
  user_id: "",
  request_kind: "entrada",
  date: "",
  entry_time: "",
  exit_time: "",
  days_count: "1",
  reason: "",
  comments: "",
};

export default function PermissionRequestFormModal({
  abierto,
  onClose,
  onGuardado,
  permitirCapturarParaOtros = false,
  usuarios = [],
}: Props) {
  const [formulario, setFormulario] =
    useState<FormularioSolicitudPermiso>(estadoInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [erroresLista, setErroresLista] = useState<string[]>([]);
  const [renderizar, setRenderizar] = useState(abierto);

  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      return;
    }

    const temporizador = setTimeout(() => {
      setRenderizar(false);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    setFormulario(estadoInicial);
    setError("");
    setErroresLista([]);
  }, [abierto]);

  const actualizarCampo = (
    campo: keyof FormularioSolicitudPermiso,
    valor: string,
  ) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setErroresLista([]);

    try {
      const payload: Record<string, unknown> = {
        request_kind: formulario.request_kind,
        date: formulario.date,
        reason: formulario.reason.trim(),
        comments: formulario.comments.trim() || null,
      };

      if (permitirCapturarParaOtros && formulario.user_id) {
        payload.user_id = Number(formulario.user_id);
      }

      if (formulario.request_kind === "entrada") {
        payload.entry_time = formulario.entry_time;
      }

      if (formulario.request_kind === "salida") {
        payload.exit_time = formulario.exit_time;
      }

      if (formulario.request_kind === "inasistencia") {
        payload.days_count = Number(formulario.days_count || "1");
      }

      await api.post<RespuestaSolicitudPermiso>("/permission-requests", payload);

      await onGuardado();
      onClose();
    } catch (error: any) {
      const erroresBackend = error?.response?.data?.errors;

      if (erroresBackend && typeof erroresBackend === "object") {
        const lista = Object.values(erroresBackend).flat() as string[];
        setErroresLista(lista);
        setError(
          error?.response?.data?.message ||
            "Hay errores en el formulario. Revisa los campos capturados.",
        );
      } else {
        setError(
          error?.response?.data?.message ||
            "No fue posible guardar la solicitud.",
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!renderizar) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] ${
        abierto ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-gray-900 ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-brand-500 px-6 py-4 text-white">
          <div>
            <h2 className="text-xl font-semibold">Nueva solicitud de permiso</h2>
            <p className="mt-1 text-sm text-white/80">
              Captura la información principal de la solicitud.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-white/90 hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {erroresLista.length > 0 ? (
              <div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-300">
                <ul className="space-y-1">
                  {erroresLista.map((item, index) => (
                    <li key={`${item}-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {permitirCapturarParaOtros ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Empleado
                  </label>
                  <select
                    value={formulario.user_id}
                    onChange={(e) => actualizarCampo("user_id", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Selecciona un empleado</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.full_name}{" "}
                        {usuario.employee_number
                          ? `(${usuario.employee_number})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de solicitud
                </label>
                <select
                  value={formulario.request_kind}
                  onChange={(e) =>
                    actualizarCampo(
                      "request_kind",
                      e.target.value as "entrada" | "salida" | "inasistencia",
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="entrada">Permiso de entrada</option>
                  <option value="salida">Permiso de salida</option>
                  <option value="inasistencia">Inasistencia</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formulario.date}
                  onChange={(e) => actualizarCampo("date", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {formulario.request_kind === "entrada" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hora de entrada
                  </label>
                  <input
                    type="time"
                    value={formulario.entry_time}
                    onChange={(e) => actualizarCampo("entry_time", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              ) : null}

              {formulario.request_kind === "salida" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hora de salida
                  </label>
                  <input
                    type="time"
                    value={formulario.exit_time}
                    onChange={(e) => actualizarCampo("exit_time", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              ) : null}

              {formulario.request_kind === "inasistencia" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Días
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formulario.days_count}
                    onChange={(e) => actualizarCampo("days_count", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              ) : null}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motivo
                </label>
                <textarea
                  rows={4}
                  value={formulario.reason}
                  onChange={(e) => actualizarCampo("reason", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe el motivo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comentarios
                </label>
                <textarea
                  rows={3}
                  value={formulario.comments}
                  onChange={(e) => actualizarCampo("comments", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Comentarios opcionales"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Crear solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}