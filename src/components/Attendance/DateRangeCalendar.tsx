import { useState } from "react";

type DateRangeValue = {
  fechaInicio: string;
  fechaFin: string;
};

type Props = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

const diasSemana = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

function parsearFechaLocal(valor: string): Date | null {
  if (!valor) return null;

  const [anio, mes, dia] = valor.split("-").map(Number);

  if (!anio || !mes || !dia) return null;

  return new Date(anio, mes - 1, dia);
}

function formatearFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function agregarMeses(fecha: Date, meses: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);
}

function etiquetaMes(fecha: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function esMismaFecha(a: string, b: string): boolean {
  return Boolean(a && b && a === b);
}

function estaEnRango(fecha: string, inicio: string, fin: string): boolean {
  if (!inicio || !fin) return false;

  return fecha > inicio && fecha < fin;
}

function construirDiasMes(mesVisible: Date): Date[] {
  const primerDiaMes = new Date(
    mesVisible.getFullYear(),
    mesVisible.getMonth(),
    1,
  );

  const offsetLunes = (primerDiaMes.getDay() + 6) % 7;

  const inicioCalendario = new Date(primerDiaMes);
  inicioCalendario.setDate(primerDiaMes.getDate() - offsetLunes);

  return Array.from({ length: 42 }, (_, indice) => {
    const fecha = new Date(inicioCalendario);
    fecha.setDate(inicioCalendario.getDate() + indice);
    return fecha;
  });
}

function MesCalendario({
  mes,
  fechaInicio,
  fechaFin,
  seleccionarFecha,
}: {
  mes: Date;
  fechaInicio: string;
  fechaFin: string;
  seleccionarFecha: (fecha: string) => void;
}) {
  const dias = construirDiasMes(mes);
  const hoy = formatearFecha(new Date());

  return (
    <div className="min-w-0 flex-1">
      <h4 className="mb-4 text-center text-base font-bold capitalize text-slate-900 dark:text-white">
        {etiquetaMes(mes)}
      </h4>

      <div className="grid grid-cols-7 gap-2 text-center">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="py-1 text-xs font-semibold text-slate-500 dark:text-slate-400"
          >
            {dia}
          </div>
        ))}

        {dias.map((fecha) => {
          const valor = formatearFecha(fecha);
          const esMesActual = fecha.getMonth() === mes.getMonth();
          const esInicio = esMismaFecha(valor, fechaInicio);
          const esFin = esMismaFecha(valor, fechaFin);
          const enRango = estaEnRango(valor, fechaInicio, fechaFin);
          const esHoy = valor === hoy;

          const clasesBase =
            "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition";

          let clases =
            "text-slate-700 hover:bg-[#465fff]/10 hover:text-[#465fff] dark:text-slate-200";

          if (!esMesActual) {
            clases =
              "text-slate-300 hover:bg-[#465fff]/10 hover:text-[#465fff] dark:text-slate-600";
          }

          if (enRango) {
            clases =
              "bg-[#465fff]/15 text-[#465fff] dark:bg-[#465fff]/25 dark:text-white";
          }

          if (esInicio || esFin) {
            clases =
              "bg-[#465fff] text-white shadow-md shadow-[#465fff]/30 hover:bg-[#3548d4]";
          }

          return (
            <button
              key={`${mes.toISOString()}-${valor}`}
              type="button"
              onClick={() => seleccionarFecha(valor)}
              className={`${clasesBase} ${clases}`}
            >
              {fecha.getDate()}

              {esHoy && !esInicio && !esFin && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#465fff]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangeCalendar({ value, onChange }: Props) {
  const fechaBase =
    parsearFechaLocal(value.fechaInicio) ??
    parsearFechaLocal(value.fechaFin) ??
    new Date();

  const [mesVisible, setMesVisible] = useState(
    new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1),
  );

  const seleccionarFecha = (fecha: string) => {
    const { fechaInicio, fechaFin } = value;

    if (!fechaInicio || fechaFin) {
      onChange({
        fechaInicio: fecha,
        fechaFin: "",
      });
      return;
    }

    if (fecha < fechaInicio) {
      onChange({
        fechaInicio: fecha,
        fechaFin: "",
      });
      return;
    }

    onChange({
      fechaInicio,
      fechaFin: fecha,
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-100 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesVisible((actual) => agregarMeses(actual, -1))}
          className="rounded-full p-2 text-[#465fff] hover:bg-[#465fff]/10"
        >
          ‹
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Selecciona el rango
        </p>

        <button
          type="button"
          onClick={() => setMesVisible((actual) => agregarMeses(actual, 1))}
          className="rounded-full p-2 text-[#465fff] hover:bg-[#465fff]/10"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <MesCalendario
          mes={mesVisible}
          fechaInicio={value.fechaInicio}
          fechaFin={value.fechaFin}
          seleccionarFecha={seleccionarFecha}
        />

        <MesCalendario
          mes={agregarMeses(mesVisible, 1)}
          fechaInicio={value.fechaInicio}
          fechaFin={value.fechaFin}
          seleccionarFecha={seleccionarFecha}
        />
      </div>
    </div>
  );
}
