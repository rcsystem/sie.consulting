import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { CatalogoBase } from "../../types/users";
import type { FormularioPuesto, Puesto } from "../../types/positions";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onGuardado: () => void;
  puestoEditar?: Puesto | null;
  departamentos: CatalogoBase[];
};

const estadoInicial: FormularioPuesto = {
  name: "",
  code: "",
  description: "",
  department_id: "",
  base_salary: "",
  is_active: true,
};

export default function PositionFormModal({
  abierto,
  onClose,
  onGuardado,
  puestoEditar,
  departamentos,
}: Props) {
  const [formulario, setFormulario] = useState<FormularioPuesto>(estadoInicial);
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

    if (puestoEditar) {
      setFormulario({
        name: puestoEditar.name ?? "",
        code: puestoEditar.code ?? "",
        description: puestoEditar.description ?? "",
        department_id: puestoEditar.department_id ? String(puestoEditar.department_id) : "",
        base_salary: puestoEditar.base_salary != null ? String(puestoEditar.base_salary) : "",
        is_active: puestoEditar.is_active,
      });
    } else {
      setFormulario(estadoInicial);
    }

    setError("");
    setErroresLista([]);
  }, [abierto, puestoEditar]);

  const actualizarCampo = (
    campo: keyof FormularioPuesto,
    valor: string | boolean,
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
      const payload = {
        name: formulario.name.trim(),
        code: formulario.code.trim() || null,
        description: formulario.description.trim() || null,
        department_id: Number(formulario.department_id),
        base_salary: formulario.base_salary.trim() !== "" ? Number(formulario.base_salary) : null,
        is_active: formulario.is_active,
      };

      if (puestoEditar) {
        await api.put(`/positions/${puestoEditar.id}`, payload);
      } else {
        await api.post("/positions", payload);
      }

      onGuardado();
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
            "No fue posible guardar el puesto.",
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
            <h2 className="text-xl font-semibold">
              {puestoEditar ? "Editar puesto" : "Nuevo puesto"}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Captura la información principal del catálogo.
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
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formulario.name}
                  onChange={(e) => actualizarCampo("name", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ej. Analista de RH"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Clave
                </label>
                <input
                  type="text"
                  value={formulario.code}
                  onChange={(e) => actualizarCampo("code", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ej. ARH"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Departamento
                </label>
                <select
                  value={formulario.department_id}
                  onChange={(e) => actualizarCampo("department_id", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sueldo base
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.base_salary}
                  onChange={(e) => actualizarCampo("base_salary", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ej. 18000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={formulario.description}
                  onChange={(e) => actualizarCampo("description", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Descripción opcional del puesto"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="puesto-activo"
                  type="checkbox"
                  checked={formulario.is_active}
                  onChange={(e) => actualizarCampo("is_active", e.target.checked)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="puesto-activo"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Puesto activo
                </label>
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
              {guardando
                ? "Guardando..."
                : puestoEditar
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}