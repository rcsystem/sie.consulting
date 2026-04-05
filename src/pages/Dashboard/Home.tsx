import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import DashboardMetrics from "../../components/dashboard/DashboardMetrics";
import DashboardShortcuts from "../../components/dashboard/DashboardShortcuts";
import RhCalendar from "../../components/dashboard/RhCalendar";
import UpcomingEventsCard from "../../components/dashboard/UpcomingEventsCard";
import type { DashboardEvent, DashboardResponse } from "../../types/dashboard";
import { traducirRol } from "../../utils/roles";

type CalendarioRespuesta = {
  month: number;
  year: number;
  events: DashboardEvent[];
};

function obtenerMesActual() {
  const hoy = new Date();
  return {
    month: hoy.getMonth() + 1,
    year: hoy.getFullYear(),
  };
}

function obtenerNombreMes(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

function formatearFechaLarga(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function obtenerSaludoPorRol(rol?: string | null) {
  switch ((rol ?? "").toLowerCase()) {
    case "super_admin":
      return {
        saludo: "Panel ejecutivo del sistema",
        descripcion: "Monitorea usuarios, autorizaciones y operación general desde un solo lugar.",
      };
    case "rh":
      return {
        saludo: "Centro de operación de Recursos Humanos",
        descripcion: "Da seguimiento a colaboradores, autorizaciones y eventos del área.",
      };
    case "director":
      return {
        saludo: "Vista general de tu dirección",
        descripcion: "Supervisa aprobaciones, actividad y eventos importantes de tu equipo.",
      };
    case "manager":
      return {
        saludo: "Panel de control de tu gerencia",
        descripcion: "Gestiona solicitudes y seguimiento diario de tu equipo.",
      };
    case "unionized":
      return {
        saludo: "Resumen de tu cuenta",
        descripcion: "Consulta tus solicitudes, eventos y accesos personales.",
      };
    default:
      return {
        saludo: "Bienvenido de nuevo",
        descripcion: "Consulta tu actividad, eventos y accesos principales.",
      };
  }
}

export default function Home() {
  const actual = obtenerMesActual();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [cargando, setCargando] = useState(true);

  const [calendarMonth, setCalendarMonth] = useState(actual.month);
  const [calendarYear, setCalendarYear] = useState(actual.year);
  const [calendarEvents, setCalendarEvents] = useState<DashboardEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [cargandoCalendario, setCargandoCalendario] = useState(false);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const { data } = await api.get<DashboardResponse>("/dashboard", {
          params: {
            month: calendarMonth,
            year: calendarYear,
          },
        });

        setDashboard(data);
        setCalendarEvents(data.calendar.events);
        setCalendarMonth(data.calendar.month);
        setCalendarYear(data.calendar.year);
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  const cargarCalendario = async (month: number, year: number) => {
    setCargandoCalendario(true);

    try {
      const { data } = await api.get<CalendarioRespuesta>("/dashboard/calendar", {
        params: { month, year },
      });

      setCalendarMonth(data.month);
      setCalendarYear(data.year);
      setCalendarEvents(data.events);
      setSelectedDate(null);
    } finally {
      setCargandoCalendario(false);
    }
  };

  const irMesAnterior = async () => {
    let nuevoMes = calendarMonth - 1;
    let nuevoAnio = calendarYear;

    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio -= 1;
    }

    await cargarCalendario(nuevoMes, nuevoAnio);
  };

  const irMesSiguiente = async () => {
    let nuevoMes = calendarMonth + 1;
    let nuevoAnio = calendarYear;

    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio += 1;
    }

    await cargarCalendario(nuevoMes, nuevoAnio);
  };

  const eventosDelDiaSeleccionado = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEvents.filter((evento) => evento.date === selectedDate);
  }, [calendarEvents, selectedDate]);

  const proximosEventos = useMemo(() => {
    return [...calendarEvents]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [calendarEvents]);

  const eventosParaMostrar =
    selectedDate && eventosDelDiaSeleccionado.length > 0
      ? eventosDelDiaSeleccionado
      : proximosEventos;

  const tituloEventos =
    selectedDate && eventosDelDiaSeleccionado.length > 0
      ? `Eventos del ${formatearFechaLarga(selectedDate)}`
      : "Próximos eventos";

  const saludo = obtenerSaludoPorRol(dashboard?.user.role);

  return (
    <>
      <PageMeta
        title="Dashboard | SIE"
        description="Resumen principal del sistema SIE para Recursos Humanos, con métricas clave, accesos rápidos y calendario de eventos."
      />

      {cargando ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          Cargando dashboard...
        </div>
      ) : !dashboard ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
          No fue posible cargar la información del dashboard.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {saludo.saludo}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {dashboard.user.full_name}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {saludo.descripcion}
            </p>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Rol:{" "}
              <span className="font-semibold">
                {traducirRol(dashboard.user.role)}
              </span>
              {" · "}
              Departamento: {dashboard.user.department ?? "Sin departamento"}
              {" · "}
              Puesto: {dashboard.user.position ?? "Sin puesto"}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <DashboardMetrics metrics={dashboard.metrics} />
              <DashboardShortcuts rol={dashboard.user.role} />
            </div>

            <div className="space-y-6 xl:col-span-4">
              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Periodo del calendario
                    </p>
                    <h2 className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
                      {obtenerNombreMes(calendarMonth, calendarYear)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={irMesAnterior}
                      disabled={cargandoCalendario}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={irMesSiguiente}
                      disabled={cargandoCalendario}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <RhCalendar
                  month={calendarMonth}
                  year={calendarYear}
                  events={calendarEvents}
                  onSelectDate={setSelectedDate}
                />
              </div>

              <UpcomingEventsCard
                events={eventosParaMostrar}
                titulo={tituloEventos}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
