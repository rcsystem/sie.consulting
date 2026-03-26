import type { DashboardEvent } from "../../types/dashboard";

type Props = {
  events: DashboardEvent[];
  titulo?: string;
};

function getBorderClass(event: DashboardEvent) {
  if (event.color) {
    switch (event.color) {
      case "green":
        return "border-l-green-500";
      case "blue":
        return "border-l-blue-500";
      case "orange":
        return "border-l-orange-500";
      case "red":
        return "border-l-red-500";
      case "purple":
        return "border-l-purple-500";
      case "indigo":
        return "border-l-indigo-500";
      case "yellow":
        return "border-l-yellow-500";
      default:
        break;
    }
  }

  switch (event.type) {
    case "payday":
      return "border-l-green-500";
    case "birthday":
      return "border-l-blue-500";
    case "work_anniversary":
      return "border-l-orange-500";
    default:
      return "border-l-gray-400";
  }
}

function formatearFecha(fecha: string) {
  const fechaConvertida = new Date(`${fecha}T00:00:00`);

  return fechaConvertida.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UpcomingEventsCard({
  events,
  titulo = "Próximos eventos",
}: Props) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {titulo}
        </h2>

        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          {events.length}
        </span>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay eventos para mostrar.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`rounded-2xl border border-gray-200 border-l-4 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-white/[0.02] ${getBorderClass(event)}`}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {event.title}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatearFecha(event.date)}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {event.department ?? "General"}
              </p>

              {event.description ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {event.description}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}