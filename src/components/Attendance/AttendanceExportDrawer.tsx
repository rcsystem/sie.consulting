import { useEffect, useMemo, useState } from "react";
import DateRangeCalendar from "./DateRangeCalendar";

type ValoresIniciales = {
  fechaInicio: string;
  fechaFin: string;
};

type RangoExportacion = {
  fechaInicio: string;
  fechaFin: string;
};

type Props = {
  abierto: boolean;
  onClose: () => void;
  onExportar: (rango: RangoExportacion) => Promise<void>;
  exportando: boolean;
  valoresIniciales: ValoresIniciales;
};

function formatearFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function restarDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return formatearFecha(fecha);
}

function inicioMesActual(): string {
  const fecha = new Date();
  return formatearFecha(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
}

function finMesActual(): string {
  const fecha = new Date();
  return formatearFecha(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0));
}

function inicioMesAnterior(): string {
  const fecha = new Date();
  return formatearFecha(new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1));
}

function finMesAnterior(): string {
  const fecha = new Date();
  return formatearFecha(new Date(fecha.getFullYear(), fecha.getMonth(), 0));
}

export default function AttendanceExportDrawer({
  abierto,
  onClose,
  onExportar,
  exportando,
  valoresIniciales,
}: Props) {
  const [fechaInicio, setFechaInicio] = useState(valoresIniciales.fechaInicio);
  const [fechaFin, setFechaFin] = useState(valoresIniciales.fechaFin);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setFechaInicio(valoresIniciales.fechaInicio);
      setFechaFin(valoresIniciales.fechaFin);
      setError(null);
    }
  }, [abierto, valoresIniciales.fechaInicio, valoresIniciales.fechaFin]);

  const diasSeleccionados = useMemo(() => {
    if (!fechaInicio || !fechaFin) return 0;

    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);
    const diferencia = fin.getTime() - inicio.getTime();

    if (diferencia < 0) return 0;

    return Math.floor(diferencia / 86_400_000) + 1;
  }, [fechaInicio, fechaFin]);

  const aplicarRango = (inicio: string, fin: string) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
    setError(null);
  };

  const confirmarExportacion = async () => {
    if (!fechaInicio || !fechaFin) {
      setError("Selecciona fecha inicio y fecha fin.");
      return;
    }

    if (fechaInicio > fechaFin) {
      setError("La fecha inicio no puede ser mayor que la fecha fin.");
      return;
    }

    setError(null);

    await onExportar({
      fechaInicio,
      fechaFin,
    });
  };

  return (
    <div
      className={`fixed inset-0 z-[999] transition ${
        abierto ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!abierto}
    >
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity ${
          abierto ? "opacity-100" : "opacity-0"
        }`}
        onClick={exportando ? undefined : onClose}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900 sm:w-[92vw] lg:w-[860px] ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-b border-[#465fff]/20 bg-gradient-to-r from-[#465fff] via-[#3f55e6] to-[#2637a8] px-6 py-5 text-white dark:border-[#465fff]/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                Zenda by SISU
              </p>

              <h2 className="mt-2 text-xl font-bold text-white">
                Exportar checadas
              </h2>

              <p className="mt-1 text-sm text-white/75">
                Genera un reporte Excel por rango de fechas.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={exportando}
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/25 disabled:opacity-60"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-7 dark:bg-slate-950">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Rango del reporte
            </p>

            <DateRangeCalendar
              value={{
                fechaInicio,
                fechaFin,
              }}
              onChange={(rango) => {
                setFechaInicio(rango.fechaInicio);
                setFechaFin(rango.fechaFin);
                setError(null);
              }}
            />

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Inicio
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {fechaInicio || "Sin seleccionar"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fin
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {fechaFin || "Sin seleccionar"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Días incluidos:{" "}
              <span className="font-bold text-[#465fff]">
                {diasSeleccionados}
              </span>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Rangos rápidos
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  aplicarRango(restarDias(14), formatearFecha(new Date()))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Últimos 15 días
              </button>

              <button
                type="button"
                onClick={() =>
                  aplicarRango(restarDias(29), formatearFecha(new Date()))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Últimos 30 días
              </button>

              <button
                type="button"
                onClick={() => aplicarRango(inicioMesActual(), finMesActual())}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Mes actual
              </button>

              <button
                type="button"
                onClick={() =>
                  aplicarRango(inicioMesAnterior(), finMesAnterior())
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Mes anterior
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
            El archivo incluirá horarios, checadas, retardos, salidas tempranas,
            tiempo extra y estado de asistencia.
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={exportando}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmarExportacion}
              disabled={exportando}
              className="rounded-xl bg-[#465fff] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3548d4] disabled:opacity-60"
            >
              {exportando ? "Generando..." : "Generar Excel"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
