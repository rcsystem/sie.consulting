import type { SolicitudPermiso } from "../../types/permissionRequests";
import {
  claseBadgeEstatusSolicitud,
  describirDetalleSolicitud,
  traducirEstatusSolicitud,
  traducirTipoEmpleado,
  traducirTipoSolicitud,
} from "../../utils/permissionRequests";

type Props = {
  solicitudes: SolicitudPermiso[];
  cargando?: boolean;
  onAprobar?: (solicitud: SolicitudPermiso) => void;
  onRechazar?: (solicitud: SolicitudPermiso) => void;
  onCancelar?: (solicitud: SolicitudPermiso) => void;
  mostrarEmpleado?: boolean;
};

function IconoAprobar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4.5 10.5l3.2 3.2L15.5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoRechazar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoCancelar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 14L14 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PermissionRequestsTable({
  solicitudes,
  cargando = false,
  onAprobar,
  onRechazar,
  onCancelar,
  mostrarEmpleado = true,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm text-gray-800 dark:text-gray-100">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {[
              ...(mostrarEmpleado ? ["Empleado"] : []),
              "Fecha",
              "Tipo",
              "Detalle",
              "Motivo",
              "Estatus",
              "Resolución",
              "Acciones",
            ].map((columna) => (
              <th
                key={columna}
                className="px-4 py-4 font-semibold text-gray-700 dark:text-gray-300"
              >
                {columna}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {cargando ? (
            <tr>
              <td
                colSpan={mostrarEmpleado ? 8 : 7}
                className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
              >
                Cargando solicitudes...
              </td>
            </tr>
          ) : solicitudes.length === 0 ? (
            <tr>
              <td
                colSpan={mostrarEmpleado ? 8 : 7}
                className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
              >
                No se encontraron solicitudes.
              </td>
            </tr>
          ) : (
            solicitudes.map((solicitud) => (
              <tr
                key={solicitud.id}
                className="border-b border-gray-100 last:border-b-0 dark:border-gray-800/60"
              >
                {mostrarEmpleado ? (
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {solicitud.user?.full_name || "-"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {solicitud.user?.employee_number ||
                          solicitud.user?.email ||
                          "-"}
                      </p>
                    </div>
                  </td>
                ) : null}

                <td className="px-4 py-4">{solicitud.date}</td>

                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p>{traducirTipoSolicitud(solicitud.request_kind)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {traducirTipoEmpleado(solicitud.employee_type)}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  {describirDetalleSolicitud(
                    solicitud.request_kind,
                    solicitud.entry_time,
                    solicitud.exit_time,
                    solicitud.days_count,
                  )}
                </td>

                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {solicitud.reason}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {solicitud.comments || "Sin comentarios"}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${claseBadgeEstatusSolicitud(
                      solicitud.status,
                    )}`}
                  >
                    {traducirEstatusSolicitud(solicitud.status)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {solicitud.status === "pendiente" ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      Pendiente
                    </span>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <p>
                        {solicitud.approver?.full_name ||
                          solicitud.canceller?.full_name ||
                          "-"}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {solicitud.approved_by_role || "-"}
                      </p>
                    </div>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {onAprobar && solicitud.status === "pendiente" ? (
                      <button
                        type="button"
                        onClick={() => onAprobar(solicitud)}
                        title="Aprobar"
                        aria-label="Aprobar solicitud"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                      >
                        <IconoAprobar />
                      </button>
                    ) : null}

                    {onRechazar && solicitud.status === "pendiente" ? (
                      <button
                        type="button"
                        onClick={() => onRechazar(solicitud)}
                        title="Rechazar"
                        aria-label="Rechazar solicitud"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <IconoRechazar />
                      </button>
                    ) : null}

                    {onCancelar && solicitud.status === "pendiente" ? (
                      <button
                        type="button"
                        onClick={() => onCancelar(solicitud)}
                        title="Cancelar"
                        aria-label="Cancelar solicitud"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                      >
                        <IconoCancelar />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
