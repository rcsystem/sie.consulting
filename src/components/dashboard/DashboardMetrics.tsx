import type { DashboardMetric } from "../../types/dashboard";

type Props = {
  metrics: DashboardMetric[];
};

function obtenerEstiloMetric(title: string) {
  const titulo = title.toLowerCase();

  if (titulo.includes("usuario") || titulo.includes("colaborador") || titulo.includes("equipo")) {
    return {
      icono: "👥",
      fondo: "bg-blue-50 dark:bg-blue-500/10",
      colorIcono: "text-blue-600 dark:text-blue-300",
    };
  }

  if (titulo.includes("permiso")) {
    return {
      icono: "📝",
      fondo: "bg-amber-50 dark:bg-amber-500/10",
      colorIcono: "text-amber-600 dark:text-amber-300",
    };
  }

  if (titulo.includes("vacacion")) {
    return {
      icono: "🌴",
      fondo: "bg-emerald-50 dark:bg-emerald-500/10",
      colorIcono: "text-emerald-600 dark:text-emerald-300",
    };
  }

  return {
    icono: "📅",
    fondo: "bg-brand-50 dark:bg-brand-500/10",
    colorIcono: "text-brand-600 dark:text-brand-300",
  };
}

export default function DashboardMetrics({ metrics }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {metrics.map((item) => {
        const estilo = obtenerEstiloMetric(item.title);

        return (
          <div
            key={item.title}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${estilo.fondo} ${estilo.colorIcono}`}
              >
                <span className="text-xl">{estilo.icono}</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {item.description}
            </p>
          </div>
        );
      })}
    </section>
  );
}
