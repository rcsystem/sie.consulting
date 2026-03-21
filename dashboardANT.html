import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/useAuthStore";
import { traducirRol } from "../../utils/roles";

const resumen = [
  { titulo: "Permisos pendientes", valor: "18", detalle: "Solicitudes por revisar hoy" },
  { titulo: "Inasistencias del día", valor: "4", detalle: "Incidencias registradas" },
  { titulo: "Usuarios activos", valor: "286", detalle: "Con acceso vigente al sistema" },
  { titulo: "Permisos excepcionales", valor: "3", detalle: "Sindicalizados sin pago previo" },
];

const solicitudes = [
  ["PER-2026-0012", "Rafael Cruz", "Entrada personal", "14/03/2026", "Pendiente"],
  ["PER-2026-0013", "María López", "Salida laboral", "14/03/2026", "Aprobado"],
  ["PER-2026-0014", "Carlos Medina", "Salida personal", "15/03/2026", "Pendiente"],
];

export default function Home() {
  const usuario = useAuthStore((state) => state.usuario);
  const rol = useAuthStore((state) => state.rol);

  return (
    <>
      <PageMeta
        title="Dashboard RH | SIE RH"
        description="Resumen principal del sistema RH"
      />

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Bienvenido de nuevo
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {usuario?.full_name ?? "Usuario"}
              </h1>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Rol:{" "}
                <span className="font-semibold capitalize">
                  {traducirRol(rol)}
                </span>{" "}
                · Departamento:{" "}
                {usuario?.department?.name ?? "Sin departamento"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <a
                href="/permisos"
                className="inline-flex items-center justify-center border border-brand-500 bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Nuevo permiso
              </a>

              <a
                href="/usuarios"
                className="inline-flex items-center justify-center border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
              >
                Ver usuarios
              </a>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {resumen.map((item) => (
            <div
              key={item.titulo}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.titulo}
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                {item.valor}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {item.detalle}
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Solicitudes recientes
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Resumen de permisos generados hoy.
                </p>
              </div>

              <span className="border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-500/10 dark:text-brand-300">
                Actualizado
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    {["Folio", "Empleado", "Tipo", "Fecha", "Estado"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {solicitudes.map((row) => (
                    <tr
                      key={row[0]}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800/60"
                    >
                      {row.map((cell, i) => (
                        <td
                          key={cell + i}
                          className="px-4 py-4 text-gray-700 dark:text-gray-300"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reglas activas
            </h2>

            <ul className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <li>
                Permisos personales de entrada con ventana máxima de 3 horas.
              </li>
              <li>
                Permisos personales de salida con ventana máxima de 3 horas
                antes del fin de jornada.
              </li>
              <li>Sindicalizados con máximo 15 días de anticipación.</li>
              <li>Un solo permiso excepcional sin pago previo por usuario.</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}