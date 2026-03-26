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
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function obtenerIndiceLunesPrimero(fecha: Date) {
  const dia = fecha.getDay();
  return dia === 0 ? 6 : dia - 1;
}

function generarMatrizMes(month: number, year: number): DiaCalendario[] {
  const primerDiaMes = new Date(year, month - 1, 1);
  const ultimoDiaMes = new Date(year, month, 0);

  const primerIndice = obtenerIndiceLunesPrimero(primerDiaMes);
  const diasMesActual = ultimoDiaMes.getDate();

  const fechaMesAnterior = new Date(year, month - 2, 1);
  const ultimoDiaMesAnterior = new Date(year, month - 1, 0).getDate();

  const dias: DiaCalendario[] = [];

  for (let i = primerIndice - 1; i >= 0; i--) {
    const numeroDia = ultimoDiaMesAnterior - i;
    const fecha = new Date(
      fechaMesAnterior.getFullYear(),
      fechaMesAnterior.getMonth(),
      numeroDia,
    );

    dias.push({
      fecha,
      fechaTexto: formatearFechaLocal(fecha),
      numero: numeroDia,
      esMesActual: false,
    });
  }

  for (let dia = 1; dia <= diasMesActual; dia++) {
    const fecha = new Date(year, month - 1, dia);

    dias.push({
      fecha,
      fechaTexto: formatearFechaLocal(fecha),
      numero: dia,
      esMesActual: true,
    });
  }

  let siguienteDia = 1;
  while (dias.length < 42) {
    const fecha = new Date(year, month, siguienteDia);

    dias.push({
      fecha,
      fechaTexto: formatearFechaLocal(fecha),
      numero: siguienteDia,
      esMesActual: false,
    });

    siguienteDia++;
  }

  return dias;
}

export default function RhCalendar({
  month,
  year,
  events,
  onSelectDate,
}: Props) {
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

    const primerDiaConEvento = dias.find(
      (dia) => dia.esMesActual && eventsByDate[dia.fechaTexto],
    );

    const fechaInicial = primerDiaConEvento?.fechaTexto ?? null;
    setSelectedDate(fechaInicial);
    onSelectDate?.(fechaInicial);
  }, [month, year, eventsByDate, dias, onSelectDate]);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {nombresDias.map((dia) => (
          <div key={dia} className="py-1">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((dia) => {
          const tieneEventos = Boolean(eventsByDate[dia.fechaTexto]?.length);
          const esSeleccionado = selectedDate === dia.fechaTexto;
          const esHoy =
            dia.fechaTexto === formatearFechaLocal(new Date()) &&
            dia.esMesActual;

          return (
            <button
              key={dia.fechaTexto}
              type="button"
              onClick={() => {
                setSelectedDate(dia.fechaTexto);
                onSelectDate?.(dia.fechaTexto);
              }}
              className={[
                "group min-h-[40px] rounded-xl p-1 text-center transition-all",
                dia.esMesActual
                  ? "text-gray-800 dark:text-white"
                  : "text-gray-300 dark:text-gray-600",
                esSeleccionado
                  ? "bg-brand-500 text-white shadow-sm"
                  : "hover:bg-gray-100 dark:hover:bg-white/5",
                esHoy && !esSeleccionado
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  : "",
              ].join(" ")}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-medium">{dia.numero}</span>

                {tieneEventos && (
                  <span
                    className={[
                      "mt-1 h-1 w-1 rounded-full",
                      esSeleccionado ? "bg-white/90" : "bg-brand-500",
                    ].join(" ")}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}