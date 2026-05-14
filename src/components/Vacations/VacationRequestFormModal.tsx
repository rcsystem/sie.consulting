/**
 * VacationRequestFormModal
 *
 * Modal de solicitud de vacaciones — mismo patrón visual que PermissionRequestFormModal:
 *   - Slide desde la derecha
 *   - Header azul #465fff
 *   - Secciones con border rounded-sm bg-white shadow-sm
 *   - Footer fijo con botones
 *   - DayPicker igual al de permisos
 */
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import type { LeaveRequestPayload, TipoPermiso, VacationBalanceResponse } from "../../types/leaveAndAttendance";
import type { CatalogOption } from "../../types/permissionRequests";

type Props = {
  abierto: boolean;
  enviando?: boolean;
  puedeVerTodos?: boolean;
  usuarios?: CatalogOption[];
  saldo?: VacationBalanceResponse | null;
  onClose: () => void;
  onSubmit: (payload: LeaveRequestPayload) => Promise<void> | void;
};

type EstadoFormulario = {
  user_id: string;
  leave_type: TipoPermiso;
  reason: string;
  medical_reference: string;
};

const estadoInicial: EstadoFormulario = {
  user_id:           "",
  leave_type:        "vacaciones",
  reason:            "",
  medical_reference: "",
};

const TIPOS: { value: TipoPermiso; label: string; desc: string }[] = [
  { value: "vacaciones",       label: "Vacaciones",                 desc: "Días de descanso con goce de sueldo según antigüedad" },
  { value: "permiso_goce",     label: "Permiso con goce de sueldo", desc: "Permiso autorizado que no descuenta del saldo de vacaciones" },
  { value: "permiso_sin_goce", label: "Permiso sin goce de sueldo", desc: "Permiso no remunerado" },
  { value: "incapacidad",      label: "Incapacidad médica",         desc: "Baja médica con número de referencia IMSS" },
];

function contarDiasHabiles(inicio: Date, fin: Date): number {
  return eachDayOfInterval({ start: inicio, end: fin }).filter((d) => !isWeekend(d)).length;
}

export default function VacationRequestFormModal({
  abierto,
  enviando = false,
  puedeVerTodos = false,
  usuarios = [],
  saldo,
  onClose,
  onSubmit,
}: Props) {
  const [renderizar, setRenderizar] = useState(false);
  const [visible,    setVisible]    = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [formulario, setFormulario] = useState<EstadoFormulario>(estadoInicial);
  const [rango,      setRango]      = useState<DateRange | undefined>();

  // Días hábiles del rango seleccionado
  const diasHabiles = useMemo(() => {
    if (!rango?.from) return 0;
    return contarDiasHabiles(rango.from, rango.to ?? rango.from);
  }, [rango]);

  // Días que quedarían disponibles tras la solicitud
  const diasTras = useMemo(() => {
    if (formulario.leave_type !== "vacaciones" || !saldo) return null;
    return Math.max(0, saldo.available_days - diasHabiles);
  }, [formulario.leave_type, saldo, diasHabiles]);

  const sinDias =
    formulario.leave_type === "vacaciones" &&
    saldo != null &&
    diasHabiles > 0 &&
    diasHabiles > saldo.available_days;

  const deshabilitado = enviando || guardando;

  // ── Animación apertura / cierre ──────────────────────────────────────────────
  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      const t = window.setTimeout(() => setVisible(true), 50);
      return () => window.clearTimeout(t);
    }

    setVisible(false);
    const t = window.setTimeout(() => {
      setRenderizar(false);
      setFormulario(estadoInicial);
      setRango(undefined);
      setError(null);
    }, 300);
    return () => window.clearTimeout(t);
  }, [abierto]);

  // ── Campo helpers ────────────────────────────────────────────────────────────
  const cambiar = (campo: keyof EstadoFormulario, valor: string) =>
    setFormulario((prev) => ({ ...prev, [campo]: valor }));

  // ── Submit ───────────────────────────────────────────────────────────────────
  const manejarSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!rango?.from) {
      setError("Debes seleccionar al menos una fecha de inicio.");
      return;
    }
    if (diasHabiles === 0) {
      setError("El rango seleccionado no contiene días hábiles.");
      return;
    }
    if (!formulario.reason.trim()) {
      setError("El motivo es requerido.");
      return;
    }
    if (sinDias) {
      setError(`No tienes días disponibles suficientes. Disponibles: ${saldo?.available_days ?? 0}, solicitados: ${diasHabiles}.`);
      return;
    }

    setGuardando(true);
    try {
      const payload: LeaveRequestPayload = {
        leave_type:        formulario.leave_type,
        start_date:        format(rango.from, "yyyy-MM-dd"),
        end_date:          format(rango.to ?? rango.from, "yyyy-MM-dd"),
        reason:            formulario.reason.trim(),
        medical_reference: formulario.medical_reference.trim() || undefined,
        user_id:           puedeVerTodos && formulario.user_id ? Number(formulario.user_id) : undefined,
      };
      await onSubmit(payload);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "No fue posible guardar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  if (!renderizar) return null;

  // ── Estilos reutilizables ────────────────────────────────────────────────────
  const inputCls =
    "w-full rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition " +
    "focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

  const sectionCls =
    "rounded-sm border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  const labelCls =
    "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

  const sectionTitleCls =
    "mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={deshabilitado ? undefined : onClose}
      />

      {/* Panel lateral derecho */}
      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header azul — igual al sistema */}
        <div
          className="border-b border-white/10 px-6 py-5 text-white"
          style={{ backgroundColor: "#465fff" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Nueva solicitud de ausencia
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Vacaciones, permisos e incapacidades. Los fines de semana no se cuentan.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={deshabilitado}
              className="rounded-sm border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Cuerpo con scroll */}
        <form onSubmit={manejarSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
            {/* Error */}
            {error && (
              <div className="mb-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">

              {/* Sección: selección de usuario (RH/admin) */}
              {puedeVerTodos && usuarios.length > 0 && (
                <section className={sectionCls}>
                  <h3 className={sectionTitleCls}>Selección de empleado</h3>
                  <label className={labelCls}>Empleado</label>
                  <select
                    value={formulario.user_id}
                    onChange={(e) => cambiar("user_id", e.target.value)}
                    className={inputCls}
                    required={puedeVerTodos}
                    disabled={deshabilitado}
                  >
                    <option value="">— Para mí mismo —</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.employee_number ? `(${u.employee_number})` : ""}
                      </option>
                    ))}
                  </select>
                </section>
              )}

              {/* Sección: tipo de ausencia */}
              <section className={sectionCls}>
                <h3 className={sectionTitleCls}>Tipo de ausencia</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TIPOS.map((t) => (
                    <label
                      key={t.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition ${
                        formulario.leave_type === t.value
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950"
                      }`}
                    >
                      <input
                        type="radio"
                        name="leave_type"
                        value={t.value}
                        checked={formulario.leave_type === t.value}
                        onChange={() => cambiar("leave_type", t.value)}
                        className="mt-0.5 accent-brand-500"
                        disabled={deshabilitado}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Sección: saldo de vacaciones (solo tipo vacaciones) */}
              {formulario.leave_type === "vacaciones" && saldo && (
                <section className={`${sectionCls} ${sinDias ? "border-red-300 dark:border-red-700" : "border-blue-200 dark:border-blue-700"}`}>
                  <h3 className={sectionTitleCls}>Tu saldo de vacaciones {saldo.year}</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: "Corresponden", val: saldo.entitled_days, color: "text-slate-800 dark:text-slate-200" },
                      { label: "Usados",       val: saldo.used_days,     color: "text-amber-600 dark:text-amber-400" },
                      { label: "Disponibles",  val: saldo.available_days, color: sinDias ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-sm border border-slate-100 bg-slate-50 py-3 dark:border-slate-800 dark:bg-slate-950">
                        <p className={`text-2xl font-bold ${color}`}>{val}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {saldo.seniority_years} año(s) de antigüedad · LFT Art. 76 reforma 2023
                  </p>

                  {diasHabiles > 0 && (
                    <div className={`mt-3 rounded-sm px-4 py-2 text-sm font-medium ${
                      sinDias
                        ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                        : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    }`}>
                      {sinDias
                        ? `⚠ Insuficiente: solicitas ${diasHabiles} día(s) pero solo tienes ${saldo.available_days} disponibles`
                        : `✓ Quedarán ${diasTras} día(s) disponibles después de esta solicitud`}
                    </div>
                  )}
                </section>
              )}

              {/* Sección: periodo — DayPicker igual al de permisos */}
              <section className={sectionCls}>
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className={sectionTitleCls}>Período de ausencia</h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Selecciona el periodo. Los fines de semana no se pueden elegir y no se cuentan.
                    </p>
                  </div>
                  {diasHabiles > 0 && (
                    <div className="rounded-sm bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <span className="font-semibold">Días hábiles:</span> {diasHabiles}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-sm border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <DayPicker
                    mode="range"
                    selected={rango}
                    onSelect={setRango}
                    locale={es}
                    numberOfMonths={2}
                    disabled={[{ dayOfWeek: [0, 6] }, { before: new Date() }]}
                    showOutsideDays
                    className="mx-auto"
                  />
                </div>

                {/* Resumen del rango seleccionado */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { label: "Inicio",  val: rango?.from ? format(rango.from, "dd/MM/yyyy") : "Sin seleccionar" },
                    { label: "Fin",     val: rango?.to   ? format(rango.to,   "dd/MM/yyyy") : "Sin seleccionar" },
                    { label: "Conteo",  val: `${diasHabiles} día(s) hábil(es)` },
                  ].map(({ label, val }) => (
                    <div key={label} className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{val}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sección: referencia médica (solo incapacidad) */}
              {formulario.leave_type === "incapacidad" && (
                <section className={sectionCls}>
                  <h3 className={sectionTitleCls}>Referencia médica</h3>
                  <label className={labelCls}>Número de referencia IMSS / folio médico</label>
                  <input
                    type="text"
                    value={formulario.medical_reference}
                    onChange={(e) => cambiar("medical_reference", e.target.value)}
                    placeholder="Ej. 12345678-A"
                    maxLength={255}
                    className={inputCls}
                    disabled={deshabilitado}
                  />
                </section>
              )}

              {/* Sección: motivo */}
              <section className={sectionCls}>
                <h3 className={sectionTitleCls}>Justificación</h3>
                <label className={labelCls}>Motivo *</label>
                <textarea
                  value={formulario.reason}
                  onChange={(e) => cambiar("reason", e.target.value)}
                  className={`min-h-[130px] ${inputCls}`}
                  placeholder="Describe claramente el motivo de la solicitud"
                  required
                  maxLength={2000}
                  disabled={deshabilitado}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {formulario.reason.length}/2000
                </p>
              </section>

            </div>
          </div>

          {/* Footer fijo — igual al sistema */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              disabled={deshabilitado}
              className="rounded-sm border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={deshabilitado || sinDias}
              className="rounded-sm bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deshabilitado ? "Guardando..." : "Guardar solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
