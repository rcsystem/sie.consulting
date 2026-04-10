import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import type { Departamento, FormularioDepartamento } from "../../types/departments";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onGuardado: () => void;
  departamentoEditar?: Departamento | null;
  departamentosPadre: Departamento[];
};

const estadoInicial: FormularioDepartamento = {
  name: "",
  code: "",
  description: "",
  parent_id: "",
  is_active: true,
};

export default function DepartmentFormModal({
  abierto,
  onClose,
  onGuardado,
  departamentoEditar,
  departamentosPadre,
}: Props) {
  const [formulario, setFormulario] = useState<FormularioDepartamento>(estadoInicial);
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

    if (departamentoEditar) {
      setFormulario({
        name: departamentoEditar.name ?? "",
        code: departamentoEditar.code ?? "",
        description: departamentoEditar.description ?? "",
        parent_id: departamentoEditar.parent_id ? String(departamentoEditar.parent_id) : "",
        is_active: departamentoEditar.is_active,
      });
    } else {
      setFormulario(estadoInicial);
    }

    setError("");
    setErroresLista([]);
  }, [abierto, departamentoEditar]);

  const opcionesPadre = useMemo(() => {
    return departamentosPadre.filter((item) => {
      if (!departamentoEditar) return true;
      return item.id !== departamentoEditar.id;
    });
  }, [departamentosPadre, departamentoEditar]);

  const actualizarCampo = (
    campo: keyof FormularioDepartamento,
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
        parent_id: formulario.parent_id ? Number(formulario.parent_id) : null,
        is_active: formulario.is_active,
      };

      if (departamentoEditar) {
        await api.put(`/departments/${departamentoEditar.id}`, payload);
      } else {
        await api.post("/departments", payload);
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
            "No fue posible guardar el departamento.",
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
              {departamentoEditar ? "Editar departamento" : "Nuevo departamento"}
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
                  className="w-full rounded-sm border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ej. Recursos Humanos"
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
                  className="w-full rounded-sm border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ej. RH"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Departamento padre
                </label>
                <select
                  value={formulario.parent_id}
                  onChange={(e) => actualizarCampo("parent_id", e.target.value)}
                  className="w-full rounded-sm border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Sin departamento padre</option>
                  {opcionesPadre.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.code ? `(${item.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={formulario.description}
                  onChange={(e) => actualizarCampo("description", e.target.value)}
                  className="w-full rounded-sm border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Descripción opcional del departamento"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="departamento-activo"
                  type="checkbox"
                  checked={formulario.is_active}
                  onChange={(e) => actualizarCampo("is_active", e.target.checked)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="departamento-activo"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Departamento activo
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-sm border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {guardando
                ? "Guardando..."
                : departamentoEditar
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}