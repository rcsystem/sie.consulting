import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useCalcularViatico, useCrearViaje, useTravelCatalogs } from "../../hooks/useTravels";
import type { TravelRequestPayload } from "../../types/travels";

type Props = {
  abierto: boolean;
  onClose: () => void;
};

type TipoSolicitud = "viatico" | "gasto";

// ─── Estado del formulario separado por tipo ──────────────────────────────────

type FormViatico = {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  hierarchy_level_id: string;
  travel_country_id: string;
  needs_flight: boolean;
  departure_time: string;
  return_time: string;
  reason: string;
  ncr_number: string;
  observations: string;
  needs_advance: boolean;
  advance_type: "" | "efectivo" | "tarjeta";
  advance_amount: string;
};

type FormGasto = {
  concept: string;        // "concepto de gasto" — label más claro que "reason"
  destination: string;    // lugar donde se generó el gasto (opcional)
  expense_date: string;   // fecha del gasto
  estimated_amount: string;
  observations: string;
};

const VIATICO_INICIAL: FormViatico = {
  origin: "", destination: "", start_date: "", end_date: "",
  hierarchy_level_id: "", travel_country_id: "",
  needs_flight: false, departure_time: "", return_time: "",
  reason: "", ncr_number: "", observations: "",
  needs_advance: false, advance_type: "", advance_amount: "",
};

const GASTO_INICIAL: FormGasto = {
  concept: "", destination: "", expense_date: "",
  estimated_amount: "", observations: "",
};

// ─── Clases reutilizables ─────────────────────────────────────────────────────

const CAMPO = "w-full rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white disabled:opacity-60";
const LABEL = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const ERR   = "mt-1 text-xs text-red-500";
const SECTION = "rounded-sm border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const SECTION_TITLE = "mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export default function TravelFormModal({ abierto, onClose }: Props) {
  // ── Animación slide-from-right (mismo patrón que todos los modales del sistema) ──
  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible]       = useState(false);

  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      const t = window.setTimeout(() => setVisible(true), 50);
      return () => window.clearTimeout(t);
    }
    setVisible(false);
    const t = window.setTimeout(() => {
      setRenderizar(false);
      resetTodo();
    }, 300);
    return () => window.clearTimeout(t);
  }, [abierto]);

  // ── Estado ────────────────────────────────────────────────────────────────
  const [tipo, setTipo]             = useState<TipoSolicitud>("viatico");
  const [viatico, setViatico]       = useState<FormViatico>({ ...VIATICO_INICIAL });
  const [gasto, setGasto]           = useState<FormGasto>({ ...GASTO_INICIAL });
  const [errores, setErrores]       = useState<Record<string, string>>({});
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [guardando, setGuardando]   = useState(false);
  const [calculo, setCalculo]       = useState<{
    amount: number; currency: string; days: number; daily: number;
  } | null>(null);

  const { data: catalogos }   = useTravelCatalogs();
  const crearViaje            = useCrearViaje();
  const calcularPresupuesto   = useCalcularViatico();

  // ── Recalcular presupuesto al cambiar campos de viático ───────────────────
  useEffect(() => {
    if (
      tipo === "viatico" &&
      viatico.hierarchy_level_id &&
      viatico.travel_country_id &&
      viatico.start_date &&
      viatico.end_date &&
      viatico.end_date >= viatico.start_date
    ) {
      calcularPresupuesto.mutate(
        {
          hierarchy_level_id: Number(viatico.hierarchy_level_id),
          travel_country_id:  Number(viatico.travel_country_id),
          start_date:         viatico.start_date,
          end_date:           viatico.end_date,
        },
        {
          onSuccess: (data) => setCalculo(data),
          onError:   ()     => setCalculo(null),
        }
      );
    } else {
      setCalculo(null);
    }
  }, [
    viatico.hierarchy_level_id,
    viatico.travel_country_id,
    viatico.start_date,
    viatico.end_date,
    tipo,
  ]);

  if (!renderizar) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetTodo = () => {
    setTipo("viatico");
    setViatico({ ...VIATICO_INICIAL });
    setGasto({ ...GASTO_INICIAL });
    setErrores({});
    setErrorGlobal(null);
    setCalculo(null);
  };

  const setV = (campo: keyof FormViatico, valor: unknown) => {
    setViatico((p) => ({ ...p, [campo]: valor }));
    setErrores((p) => { const n = { ...p }; delete n[campo]; return n; });
  };

  const setG = (campo: keyof FormGasto, valor: string) => {
    setGasto((p) => ({ ...p, [campo]: valor }));
    setErrores((p) => { const n = { ...p }; delete n[campo]; return n; });
  };

  const limpiarError = (campo: string) =>
    setErrores((p) => { const n = { ...p }; delete n[campo]; return n; });

  // ── Validación ────────────────────────────────────────────────────────────

  const validarViatico = (): boolean => {
    const e: Record<string, string> = {};
    if (!viatico.origin)             e.origin             = "Campo requerido";
    if (!viatico.destination)        e.destination        = "Campo requerido";
    if (!viatico.start_date)         e.start_date         = "Campo requerido";
    if (!viatico.end_date)           e.end_date           = "Campo requerido";
    if (viatico.end_date && viatico.start_date && viatico.end_date < viatico.start_date)
      e.end_date = "Debe ser igual o posterior a la fecha de salida";
    if (!viatico.hierarchy_level_id) e.hierarchy_level_id = "Campo requerido";
    if (!viatico.travel_country_id)  e.travel_country_id  = "Campo requerido";
    if (!viatico.reason)             e.reason             = "Campo requerido";
    if (viatico.needs_flight) {
      if (!viatico.departure_time)   e.departure_time     = "Campo requerido";
      if (!viatico.return_time)      e.return_time        = "Campo requerido";
    }
    if (viatico.needs_advance) {
      if (!viatico.advance_type)     e.advance_type       = "Selecciona el tipo";
      if (!viatico.advance_amount)   e.advance_amount     = "Campo requerido";
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const validarGasto = (): boolean => {
    const e: Record<string, string> = {};
    if (!gasto.concept)          e.concept          = "Campo requerido";
    if (!gasto.expense_date)     e.expense_date     = "Campo requerido";
    if (!gasto.estimated_amount) e.estimated_amount = "Campo requerido";
    else if (Number(gasto.estimated_amount) <= 0)
      e.estimated_amount = "El monto debe ser mayor a 0";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const manejarSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorGlobal(null);

    const valido = tipo === "viatico" ? validarViatico() : validarGasto();
    if (!valido) return;

    setGuardando(true);

    try {
      let payload: TravelRequestPayload;

      if (tipo === "viatico") {
        payload = {
          request_type:        "viatico",
          origin:              viatico.origin,
          destination:         viatico.destination,
          start_date:          viatico.start_date,
          end_date:            viatico.end_date,
          hierarchy_level_id:  Number(viatico.hierarchy_level_id),
          travel_country_id:   Number(viatico.travel_country_id),
          reason:              viatico.reason.trim(),
          ncr_number:          viatico.ncr_number  || undefined,
          observations:        viatico.observations || undefined,
          needs_flight:        viatico.needs_flight,
          departure_time:      viatico.needs_flight ? viatico.departure_time : undefined,
          return_time:         viatico.needs_flight ? viatico.return_time    : undefined,
          needs_advance:       viatico.needs_advance,
          advance_type:        viatico.needs_advance
            ? (viatico.advance_type as "efectivo" | "tarjeta")
            : undefined,
          advance_amount:      viatico.needs_advance
            ? Number(viatico.advance_amount)
            : undefined,
        };
      } else {
        payload = {
          request_type:      "gasto",
          // Para gastos: origin = ciudad actual (vacío OK), destination = lugar del gasto
          origin:            "N/A",
          destination:       gasto.destination || "N/A",
          start_date:        gasto.expense_date,
          end_date:          gasto.expense_date,
          reason:            gasto.concept.trim(),
          estimated_amount:  Number(gasto.estimated_amount),
          observations:      gasto.observations || undefined,
        };
      }

      await crearViaje.mutateAsync(payload);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setErrorGlobal(msg ?? "No fue posible guardar la solicitud. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const deshabilitado = guardando;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Overlay con blur — click cierra */}
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={deshabilitado ? undefined : onClose}
      />

      {/* Panel lateral derecho */}
      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="border-b border-white/10 px-6 py-5 text-white"
          style={{ backgroundColor: "#465fff" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Nueva solicitud
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {tipo === "viatico"
                  ? "Viático de viaje con cálculo automático de presupuesto"
                  : "Reembolso o comprobación de gasto"}
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

        {/* Formulario scrollable */}
        <form
          onSubmit={manejarSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
            {errorGlobal && (
              <div className="mb-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {errorGlobal}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">

              {/* ── Selector de tipo ───────────────────────────────────── */}
              <section className={SECTION}>
                <h3 className={SECTION_TITLE}>Tipo de solicitud</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(["viatico", "gasto"] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 transition ${
                        tipo === t
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={t}
                        checked={tipo === t}
                        onChange={() => {
                          setTipo(t);
                          setErrores({});
                          setCalculo(null);
                        }}
                        disabled={deshabilitado}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {t === "viatico" ? "Viático" : "Gasto"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t === "viatico"
                            ? "Viaje con origen, destino y cálculo por jerarquía"
                            : "Reembolso o comprobación de gasto puntual"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* ══════════════════════════════════════════════════════════
                  SECCIÓN VIÁTICO
              ══════════════════════════════════════════════════════════ */}
              {tipo === "viatico" && (
                <>
                  {/* Origen y destino */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Origen y destino</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={LABEL}>Ciudad de origen *</label>
                        <input
                          className={CAMPO}
                          placeholder="Ej. Monterrey, NL"
                          value={viatico.origin}
                          onChange={(e) => setV("origin", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.origin && <p className={ERR}>{errores.origin}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Ciudad de destino *</label>
                        <input
                          className={CAMPO}
                          placeholder="Ej. Ciudad de México"
                          value={viatico.destination}
                          onChange={(e) => setV("destination", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.destination && <p className={ERR}>{errores.destination}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Fecha de salida *</label>
                        <input
                          type="date"
                          className={CAMPO}
                          value={viatico.start_date}
                          onChange={(e) => setV("start_date", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.start_date && <p className={ERR}>{errores.start_date}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Fecha de regreso *</label>
                        <input
                          type="date"
                          className={CAMPO}
                          value={viatico.end_date}
                          min={viatico.start_date || undefined}
                          onChange={(e) => setV("end_date", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.end_date && <p className={ERR}>{errores.end_date}</p>}
                      </div>
                    </div>
                  </section>

                  {/* Jerarquía y país */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Presupuesto de viático</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={LABEL}>Jerarquía *</label>
                        <select
                          className={CAMPO}
                          value={viatico.hierarchy_level_id}
                          onChange={(e) => setV("hierarchy_level_id", e.target.value)}
                          disabled={deshabilitado}
                        >
                          <option value="">Selecciona tu nivel jerárquico</option>
                          {catalogos?.hierarchy_levels.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                              {h.daily_amount
                                ? ` — $${Number(h.daily_amount).toLocaleString("es-MX")}/día`
                                : ""}
                            </option>
                          ))}
                        </select>
                        {errores.hierarchy_level_id && (
                          <p className={ERR}>{errores.hierarchy_level_id}</p>
                        )}
                      </div>
                      <div>
                        <label className={LABEL}>País de destino *</label>
                        <select
                          className={CAMPO}
                          value={viatico.travel_country_id}
                          onChange={(e) => setV("travel_country_id", e.target.value)}
                          disabled={deshabilitado}
                        >
                          <option value="">Selecciona el país</option>
                          {catalogos?.countries.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.currency_code})
                              {c.daily_amount
                                ? ` — $${Number(c.daily_amount).toLocaleString("es-MX")}/día`
                                : ""}
                            </option>
                          ))}
                        </select>
                        {errores.travel_country_id && (
                          <p className={ERR}>{errores.travel_country_id}</p>
                        )}
                      </div>
                    </div>

                    {/* Presupuesto calculado */}
                    {calcularPresupuesto.isPending && (
                      <div className="mt-4 rounded-sm bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800">
                        Calculando presupuesto...
                      </div>
                    )}
                    {calculo && !calcularPresupuesto.isPending && (
                      <div className="mt-4 rounded-sm border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800/40 dark:bg-brand-500/10">
                        <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
                          Presupuesto estimado:{" "}
                          <span className="text-lg font-bold">
                            {new Intl.NumberFormat("es-MX", {
                              style:    "currency",
                              currency: calculo.currency,
                            }).format(calculo.amount)}
                          </span>
                          {calculo.currency !== "MXN" && (
                            <span className="ml-1 text-xs text-brand-600">
                              ({calculo.currency})
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-brand-600 dark:text-brand-400">
                          {calculo.days} día{calculo.days !== 1 ? "s" : ""} ·{" "}
                          ${Number(calculo.daily).toLocaleString("es-MX")}/día ·
                          el último día cuenta como medio día
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Vuelo */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Vuelo (opcional)</h3>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={viatico.needs_flight}
                        onChange={(e) => setV("needs_flight", e.target.checked)}
                        disabled={deshabilitado}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Este viaje requiere vuelo
                      </span>
                    </label>
                    {viatico.needs_flight && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL}>Horario preferente de ida</label>
                          <input
                            type="time"
                            className={CAMPO}
                            value={viatico.departure_time}
                            onChange={(e) => setV("departure_time", e.target.value)}
                            disabled={deshabilitado}
                          />
                          {errores.departure_time && (
                            <p className={ERR}>{errores.departure_time}</p>
                          )}
                        </div>
                        <div>
                          <label className={LABEL}>Horario preferente de regreso</label>
                          <input
                            type="time"
                            className={CAMPO}
                            value={viatico.return_time}
                            onChange={(e) => setV("return_time", e.target.value)}
                            disabled={deshabilitado}
                          />
                          {errores.return_time && (
                            <p className={ERR}>{errores.return_time}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Anticipo */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Anticipo (opcional)</h3>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={viatico.needs_advance}
                        onChange={(e) => setV("needs_advance", e.target.checked)}
                        disabled={deshabilitado}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Solicitar anticipo de viáticos
                      </span>
                    </label>
                    {viatico.needs_advance && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL}>Tipo de anticipo *</label>
                          <select
                            className={CAMPO}
                            value={viatico.advance_type}
                            onChange={(e) =>
                              setV("advance_type", e.target.value as FormViatico["advance_type"])
                            }
                            disabled={deshabilitado}
                          >
                            <option value="">Selecciona el tipo</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta empresarial</option>
                          </select>
                          {errores.advance_type && (
                            <p className={ERR}>{errores.advance_type}</p>
                          )}
                        </div>
                        <div>
                          <label className={LABEL}>Monto solicitado *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={CAMPO}
                            placeholder="0.00"
                            value={viatico.advance_amount}
                            onChange={(e) => setV("advance_amount", e.target.value)}
                            disabled={deshabilitado}
                          />
                          {errores.advance_amount && (
                            <p className={ERR}>{errores.advance_amount}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Justificación viático */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Justificación</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={LABEL}>Motivo del viaje *</label>
                        <textarea
                          className={`${CAMPO} min-h-[100px] resize-none`}
                          placeholder="Describe el objetivo del viaje"
                          value={viatico.reason}
                          onChange={(e) => setV("reason", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.reason && <p className={ERR}>{errores.reason}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>NCR / Número de proyecto (opcional)</label>
                        <input
                          className={CAMPO}
                          placeholder="Ej. NCR-2024-001"
                          value={viatico.ncr_number}
                          onChange={(e) => setV("ncr_number", e.target.value)}
                          disabled={deshabilitado}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Observaciones (opcional)</label>
                        <textarea
                          className={`${CAMPO} min-h-[80px] resize-none`}
                          placeholder="Información adicional"
                          value={viatico.observations}
                          onChange={(e) => setV("observations", e.target.value)}
                          disabled={deshabilitado}
                        />
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* ══════════════════════════════════════════════════════════
                  SECCIÓN GASTO — formulario simplificado
              ══════════════════════════════════════════════════════════ */}
              {tipo === "gasto" && (
                <>
                  {/* Concepto principal */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Concepto del gasto</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={LABEL}>Concepto *</label>
                        <input
                          className={CAMPO}
                          placeholder="Ej. Gasolina visita cliente, Comida reunión, Taxi aeropuerto"
                          value={gasto.concept}
                          onChange={(e) => setG("concept", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.concept && <p className={ERR}>{errores.concept}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Lugar donde se generó (opcional)</label>
                        <input
                          className={CAMPO}
                          placeholder="Ej. Monterrey, NL"
                          value={gasto.destination}
                          onChange={(e) => setG("destination", e.target.value)}
                          disabled={deshabilitado}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Fecha y monto */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Fecha y monto</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={LABEL}>Fecha del gasto *</label>
                        <input
                          type="date"
                          className={CAMPO}
                          value={gasto.expense_date}
                          onChange={(e) => setG("expense_date", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.expense_date && (
                          <p className={ERR}>{errores.expense_date}</p>
                        )}
                      </div>
                      <div>
                        <label className={LABEL}>Monto (MXN) *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={CAMPO}
                          placeholder="0.00"
                          value={gasto.estimated_amount}
                          onChange={(e) => setG("estimated_amount", e.target.value)}
                          disabled={deshabilitado}
                        />
                        {errores.estimated_amount && (
                          <p className={ERR}>{errores.estimated_amount}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Observaciones gasto */}
                  <section className={SECTION}>
                    <h3 className={SECTION_TITLE}>Observaciones (opcional)</h3>
                    <textarea
                      className={`${CAMPO} min-h-[100px] resize-none`}
                      placeholder="Información adicional sobre el gasto"
                      value={gasto.observations}
                      onChange={(e) => setG("observations", e.target.value)}
                      disabled={deshabilitado}
                    />
                  </section>
                </>
              )}

            </div>
          </div>

          {/* Footer fijo */}
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
              disabled={deshabilitado}
              className="rounded-sm bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deshabilitado ? "Guardando..." : "Crear solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
