import { useEffect, useState } from "react";
import { useRechazarViaje } from "../../hooks/useTravels";
import type { TravelRequest } from "../../types/travels";

type Props = {
  solicitud: TravelRequest | null;
  onClose: () => void;
  onGuardado: () => void;
};

const CAMPO = "w-full rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const LABEL = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function TravelRejectModal({ solicitud, onClose, onGuardado }: Props) {
  const abierto = solicitud !== null;

  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible]       = useState(false);
  const [motivo, setMotivo]         = useState("");
  const [error, setError]           = useState("");

  const rechazar = useRechazarViaje();

  // Animación slide-from-right — mismo patrón que el resto del sistema
  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      const t = window.setTimeout(() => setVisible(true), 50);
      return () => window.clearTimeout(t);
    }
    setVisible(false);
    const t = window.setTimeout(() => {
      setRenderizar(false);
      setMotivo("");
      setError("");
    }, 300);
    return () => window.clearTimeout(t);
  }, [abierto]);

  if (!renderizar || !solicitud) return null;

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }
    await rechazar.mutateAsync({
      id: solicitud.id,
      rejection_reason: motivo.trim(),
    });
    onGuardado();
  };

  const deshabilitado = rechazar.isPending;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={deshabilitado ? undefined : onClose}
      />

      {/* Panel lateral — más angosto porque es solo un campo */}
      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="border-b border-white/10 px-6 py-5 text-white"
          style={{ backgroundColor: "#ef4444" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Rechazar solicitud</h2>
              <p className="mt-1 text-sm text-white/80">
                {solicitud.user?.full_name ?? "—"} · {solicitud.destination}
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

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
          <section className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Motivo del rechazo
            </h3>

            {/* Resumen de la solicitud */}
            <div className="mb-5 rounded-sm border border-slate-100 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <p className="text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {solicitud.request_type === "viatico" ? "Viático" : "Gasto"}
                </span>{" "}
                · {solicitud.destination} · {solicitud.start_date}
                {solicitud.end_date !== solicitud.start_date
                  ? ` → ${solicitud.end_date}`
                  : ""}
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Monto:{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: solicitud.currency_code,
                  }).format(
                    Number(solicitud.approved_amount ?? solicitud.estimated_amount)
                  )}
                </span>
              </p>
            </div>

            <label className={LABEL}>Motivo *</label>
            <textarea
              className={`${CAMPO} min-h-[140px] resize-none`}
              placeholder="Explica al empleado por qué se rechaza esta solicitud..."
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError("");
              }}
              disabled={deshabilitado}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </section>
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
            type="button"
            onClick={handleSubmit}
            disabled={deshabilitado}
            className="rounded-sm bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deshabilitado ? "Rechazando..." : "Confirmar rechazo"}
          </button>
        </div>
      </div>
    </div>
  );
}
