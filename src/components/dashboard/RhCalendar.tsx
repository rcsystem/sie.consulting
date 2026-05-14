import { useEffect, useMemo, useState } from "react";
import type { DashboardEvent } from "../../types/dashboard";

type Props = {
  month: number;
  year: number;
  events: DashboardEvent[];
  onSelectDate?: (fecha: string | null) => void;
};

type DiaCalendario = {
  fecha: Date;
  fechaTexto: string;
  numero: number;
  esMesActual: boolean;
};

const nombresDias = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function formatearFechaLocal(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes  = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia  = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function obtenerIndiceLunesPrimero(fecha: Date) {
  const dia = fecha.getDay();
  return dia === 0 ? 6 : dia - 1;
}

function generarMatrizMes(month: number, year: number): DiaCalendario[] {
  const primerDiaMes  = new Date(year, month - 1, 1);
  const ultimoDiaMes  = new Date(year, month, 0);
  const primerIndice  = obtenerIndiceLunesPrimero(primerDiaMes);
  const diasMesActual = ultimoDiaMes.getDate();

  const fechaMesAnterior       = new Date(year, month - 2, 1);
  const ultimoDiaMesAnterior   = new Date(year, month - 1, 0).getDate();
  const dias: DiaCalendario[]  = [];

  for (let i = primerIndice - 1; i >= 0; i--) {
    const numeroDia = ultimoDiaMesAnterior - i;
    const fecha = new Date(fechaMesAnterior.getFullYear(), fechaMesAnterior.getMonth(), numeroDia);
    dias.push({ fecha, fechaTexto: formatearFechaLocal(fecha), numero: numeroDia, esMesActual: false });
  }

  for (let dia = 1; dia <= diasMesActual; dia++) {
    const fecha = new Date(year, month - 1, dia);
    dias.push({ fecha, fechaTexto: formatearFechaLocal(fecha), numero: dia, esMesActual: true });
  }

  let siguienteDia = 1;
  while (dias.length < 42) {
    const fecha = new Date(year, month, siguienteDia);
    dias.push({ fecha, fechaTexto: formatearFechaLocal(fecha), numero: siguienteDia, esMesActual: false });
    siguienteDia++;
  }

  return dias;
}

// ── Mapa de colores por tipo de evento ────────────────────────────────────────
// El dot del calendario sigue esta prioridad visual:
//   vacation (aprobada definitivo) → verde
//   vacation (aprobada por jefe)   → naranja
//   birthday                       → azul
//   work_anniversary               → amarillo
//   cualquier otro                 → brand (morado)

function resolverColorDot(events: DashboardEvent[], esSeleccionado: boolean): string {
  if (esSeleccionado) return "bg-white/90";

  // Prioridad: si hay vacaciones en el día, mostrar ese color primero
  const tieneVacacion   = events.some((e) => e.type === "vacation" && e.color === "green");
  const tienePendiente  = events.some((e) => e.type === "vacation" && e.color === "orange");
  const tieneCumple     = events.some((e) => e.type === "birthday");
  const tieneAniversario = events.some((e) => e.type === "work_anniversary");

  if (tieneVacacion)    return "bg-green-500";
  if (tienePendiente)   return "bg-orange-400";
  if (tieneCumple)      return "bg-blue-500";
  if (tieneAniversario) return "bg-yellow-500";
  return "bg-brand-500";
}

// Retorna todos los colores únicos del día para mostrar múltiples dots
function resolverDots(events: DashboardEvent[], esSeleccionado: boolean): string[] {
  if (esSeleccionado) return events.length > 0 ? ["bg-white/90"] : [];

  const colores: string[] = [];
  const tipos = new Set(events.map((e) => `${e.type}-${e.color ?? ""}`));

  if (tipos.has("vacation-green"))  colores.push("bg-green-500");
  if (tipos.has("vacation-orange")) colores.push("bg-orange-400");
  if ([...tipos].some((t) => t.startsWith("birthday")))        colores.push("bg-blue-500");
  if ([...tipos].some((t) => t.startsWith("work_anniversary"))) colores.push("bg-yellow-500");
  // Otros tipos
  const otrosTypes = new Set(
    events
      .filter((e) => !["vacation", "birthday", "work_anniversary"].includes(e.type))
      .map(() => "brand")
  );
  if (otrosTypes.size > 0) colores.push("bg-brand-500");

  return colores.slice(0, 3); // máximo 3 dots
}

export default function RhCalendar({ month, year, events, onSelectDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, DashboardEvent[]>>((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  const dias = useMemo(() => generarMatrizMes(month, year), [month, year]);

  useEffect(() => {
    const hoy = new Date();
    const fechaHoyVisible =
      hoy.getFullYear() === year && hoy.getMonth() + 1 === month
        ? formatearFechaLocal(hoy)
        : null;

    if (fechaHoyVisible && eventsByDate[fechaHoyVisible]) {
      setSelectedDate(fechaHoyVisible);
      onSelectDate?.(fechaHoyVisible);
      return;
    }

    const primerDiaConEvento = dias.find((dia) => dia.esMesActual && eventsByDate[dia.fechaTexto]);
    const fechaInicial = primerDiaConEvento?.fechaTexto ?? null;
    setSelectedDate(fechaInicial);
    onSelectDate?.(fechaInicial);
  }, [month, year, eventsByDate, dias, onSelectDate]);

  return (
    <div>
      {/* Encabezado días de la semana */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {nombresDias.map((dia) => (
          <div key={dia} className="py-1">{dia}</div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((dia) => {
          const eventosDelDia  = eventsByDate[dia.fechaTexto] ?? [];
          const tieneEventos   = eventosDelDia.length > 0;
          const esSeleccionado = selectedDate === dia.fechaTexto;
          const esHoy =
            dia.fechaTexto === formatearFechaLocal(new Date()) && dia.esMesActual;

          // Calcular si tiene vacaciones para fondo especial
          const tieneVacacion = eventosDelDia.some((e) => e.type === "vacation");
          const dots = resolverDots(eventosDelDia, esSeleccionado);

          return (
            <button
              key={dia.fechaTexto}
              type="button"
              onClick={() => {
                setSelectedDate(dia.fechaTexto);
                onSelectDate?.(dia.fechaTexto);
              }}
              title={
                tieneEventos
                  ? eventosDelDia.map((e) => e.title).join(", ")
                  : undefined
              }
              className={[
                "group min-h-[40px] rounded-xl p-1 text-center transition-all",
                dia.esMesActual
                  ? "text-gray-800 dark:text-white"
                  : "text-gray-300 dark:text-gray-600",
                esSeleccionado
                  ? "bg-brand-500 text-white shadow-sm"
                  : tieneVacacion && dia.esMesActual
                  ? "bg-green-50 ring-1 ring-green-200 dark:bg-green-900/20 dark:ring-green-800"
                  : "hover:bg-gray-100 dark:hover:bg-white/5",
                esHoy && !esSeleccionado && !tieneVacacion
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  : "",
              ].join(" ")}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-medium">{dia.numero}</span>

                {/* Dots de colores según tipo de evento */}
                {tieneEventos && (
                  <div className="mt-1 flex items-center gap-0.5">
                    {dots.map((colorClass, idx) => (
                      <span
                        key={idx}
                        className={`h-1 w-1 rounded-full ${colorClass}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leyenda de colores */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
        {[
          { color: "bg-green-500",   label: "Vacaciones aprobadas" },
          { color: "bg-orange-400",  label: "Pend. aprobación RH" },
          { color: "bg-blue-500",    label: "Cumpleaños" },
          { color: "bg-yellow-500",  label: "Aniversario" },
          { color: "bg-brand-500",   label: "Otros eventos" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
            <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
