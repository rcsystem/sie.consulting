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

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {solicitud.status === "pendiente" && onAprobar ? (
                      <button
                        type="button"
                        onClick={() => onAprobar(solicitud)}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-medium text-white hover:bg-green-600"
                      >
                        Aprobar
                      </button>
                    ) : null}

                    {solicitud.status === "pendiente" && onRechazar ? (
                      <button
                        type="button"
                        onClick={() => onRechazar(solicitud)}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600"
                      >
                        Rechazar
                      </button>
                    ) : null}

                    {solicitud.status === "pendiente" && onCancelar ? (
                      <button
                        type="button"
                        onClick={() => onCancelar(solicitud)}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
                      >
                        Cancelar
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