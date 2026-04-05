import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { differenceInBusinessDays, format } from "date-fns";
import type {
  CatalogOption,
  SolicitudPermisoPayload,
} from "../../types/permissionRequests";

type Props = {
  abierto: boolean;
  enviando?: boolean;
  puedeVerTodos?: boolean;
  usuarios?: CatalogOption[];
  onClose: () => void;
  onSubmit: (payload: SolicitudPermisoPayload) => Promise<void> | void;
};

type EstadoFormulario = {
  user_id: string;
  request_kind: "entrada" | "salida" | "inasistencia";
  date: string;
  entry_time: string;
  exit_time: string;
  reason: string;
};

const estadoInicial: EstadoFormulario = {
  user_id: "",
  request_kind: "entrada",
  date: "",
  entry_time: "",
  exit_time: "",
  reason: "",
};

export default function PermissionRequestFormModal({
  abierto,
  enviando = false,
  puedeVerTodos = false,
  usuarios = [],
  onClose,
  onSubmit,
}: Props) {
  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<EstadoFormulario>(estadoInicial);
  const [rangoInasistencia, setRangoInasistencia] = useState<
    DateRange | undefined
  >();

  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      setError(null);

      const frame = requestAnimationFrame(() => {
        setVisible(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);

    const temporizador = window.setTimeout(() => {
      setRenderizar(false);
      setFormulario(estadoInicial);
      setRangoInasistencia(undefined);
      setError(null);
    }, 300);

    return () => window.clearTimeout(temporizador);
  }, [abierto]);

  const titulo = useMemo(() => "Nuevo permiso", []);

  if (!renderizar) return null;

  const cambiarCampo = (campo: keyof EstadoFormulario, valor: string) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const requiereHoraEntrada = formulario.request_kind === "entrada";
  const requiereHoraSalida = formulario.request_kind === "salida";
  const requiereRango = formulario.request_kind === "inasistencia";

  const diasHabiles =
    rangoInasistencia?.from && rangoInasistencia?.to
      ? differenceInBusinessDays(rangoInasistencia.to, rangoInasistencia.from) +
        1
      : rangoInasistencia?.from
        ? 1
        : 0;

  const manejarSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const payload: SolicitudPermisoPayload = {
      request_kind: formulario.request_kind,
      reason: formulario.reason.trim(),
    };

    if (puedeVerTodos && formulario.user_id) {
      payload.user_id = Number(formulario.user_id);
    }

    if (formulario.request_kind === "entrada") {
      payload.date = formulario.date;
      payload.entry_time = formulario.entry_time;
    }

    if (formulario.request_kind === "salida") {
      payload.date = formulario.date;
      payload.exit_time = formulario.exit_time;
    }

    if (formulario.request_kind === "inasistencia") {
      if (!rangoInasistencia?.from || !rangoInasistencia?.to) {
        setError("Debes seleccionar un rango válido para la inasistencia.");
        setGuardando(false);
        return;
      }

      payload.start_date = format(rangoInasistencia.from, "yyyy-MM-dd");
      payload.end_date = format(rangoInasistencia.to, "yyyy-MM-dd");
      payload.days_count = diasHabiles;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error("Error desde PermissionRequestFormModal:", err);
      setError("No fue posible guardar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  const deshabilitado = enviando || guardando;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={deshabilitado ? undefined : onClose}
      />

      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="border-b border-white/10 px-6 py-5 text-white"
          style={{ backgroundColor: "#465fff" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
              <p className="mt-1 text-sm text-white/80">
                Captura una nueva solicitud de permiso de forma rápida y clara.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={deshabilitado}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              Cerrar
            </button>
          </div>
        </div>

        <form onSubmit={manejarSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
            {error ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6">
              {puedeVerTodos ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Selección de usuario
                  </h3>

                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Usuario
                  </label>
                  <select
                    value={formulario.user_id}
                    onChange={(e) => cambiarCampo("user_id", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required={puedeVerTodos}
                    disabled={deshabilitado}
                  >
                    <option value="">Selecciona un usuario</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.name}
                      </option>
                    ))}
                  </select>
                </section>
              ) : null}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Datos de la solicitud
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tipo de solicitud
                    </label>
                    <select
                      value={formulario.request_kind}
                      onChange={(e) =>
                        cambiarCampo(
                          "request_kind",
                          e.target.value as EstadoFormulario["request_kind"],
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      disabled={deshabilitado}
                    >
                      <option value="entrada">Entrada</option>
                      <option value="salida">Salida</option>
                      <option value="inasistencia">Inasistencia</option>
                    </select>
                  </div>

                  {requiereHoraEntrada || requiereHoraSalida ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formulario.date}
                        onChange={(e) => cambiarCampo("date", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        required
                        disabled={deshabilitado}
                      />
                    </div>
                  ) : null}

                  {requiereHoraEntrada ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hora de entrada
                      </label>
                      <input
                        type="time"
                        value={formulario.entry_time}
                        onChange={(e) =>
                          cambiarCampo("entry_time", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        required
                        disabled={deshabilitado}
                      />
                    </div>
                  ) : null}

                  {requiereHoraSalida ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hora de salida
                      </label>
                      <input
                        type="time"
                        value={formulario.exit_time}
                        onChange={(e) =>
                          cambiarCampo("exit_time", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        required
                        disabled={deshabilitado}
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              {requiereRango ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Rango de inasistencia
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Selecciona el periodo. Los fines de semana no se pueden
                        elegir y no se cuentan.
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <span className="font-semibold">Días hábiles:</span>{" "}
                      {diasHabiles}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <DayPicker
                      mode="range"
                      selected={rangoInasistencia}
                      onSelect={setRangoInasistencia}
                      numberOfMonths={2}
                      disabled={{ dayOfWeek: [0, 6] }}
                      showOutsideDays
                      className="mx-auto"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Inicio
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {rangoInasistencia?.from
                          ? format(rangoInasistencia.from, "dd/MM/yyyy")
                          : "Sin seleccionar"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Fin
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {rangoInasistencia?.to
                          ? format(rangoInasistencia.to, "dd/MM/yyyy")
                          : "Sin seleccionar"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Conteo
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {diasHabiles} día(s) hábil(es)
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Justificación
                </h3>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Motivo
                </label>
                <textarea
                  value={formulario.reason}
                  onChange={(e) => cambiarCampo("reason", e.target.value)}
                  className="min-h-[130px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Describe claramente el motivo de la solicitud"
                  required
                  disabled={deshabilitado}
                />
              </section>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={deshabilitado}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deshabilitado}
            >
              {deshabilitado ? "Guardando..." : "Guardar permiso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
