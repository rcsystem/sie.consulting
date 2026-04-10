/**
 * Componente PermissionRequestsTable
 *
 * Tabla que muestra solicitudes de permisos con columnas para empleado, fecha, tipo, detalles, estatus, aprobador y acciones.
 * Soporta columnas opcionales y botones de acción (aprobar, rechazar, cancelar, ver PDF) basados en props.
 * Muestra condicionalmente botones de acción para solicitudes pendientes.
 */
import type { SolicitudPermiso } from "../../types/permissionRequests";
import {
  claseBadgeEstatusSolicitud,
  describirDetalleSolicitud,
  traducirEstatusSolicitud,
  traducirTipoSolicitud,
} from "../../utils/permissionRequests";

type Props = {
  solicitudes: SolicitudPermiso[];
  cargando?: boolean;
  onAprobar?: (solicitud: SolicitudPermiso) => void;
  onRechazar?: (solicitud: SolicitudPermiso) => void;
  onCancelar?: (solicitud: SolicitudPermiso) => void;
  onVerPermiso?: (solicitud: SolicitudPermiso) => void;
  mostrarEmpleado?: boolean;
};

// Componentes de iconos para botones de acción
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

function IconoVerPermiso() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10 3.5l5.5 3v6L10 15.5l-5.5-3v-6L10 3.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 7v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="12.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export default function PermissionRequestsTable({
  solicitudes,
  cargando = false,
  onAprobar,
  onRechazar,
  onCancelar,
  onVerPermiso,
  mostrarEmpleado = true,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {[
              ...(mostrarEmpleado ? ["Empleado"] : []),
              "Fecha",
              "Tipo",
              "Detalle",
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
                colSpan={mostrarEmpleado ? 7 : 6}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                Cargando solicitudes...
              </td>
            </tr>
          ) : solicitudes.length === 0 ? (
            <tr>
              <td
                colSpan={mostrarEmpleado ? 7 : 6}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                No se encontraron solicitudes.
              </td>
            </tr>
          ) : (
            solicitudes.map((solicitud) => (
              <tr
                key={solicitud.id}
                className="border-b border-gray-100 align-top dark:border-gray-800"
              >
                {mostrarEmpleado ? (
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {solicitud.user?.full_name ?? "Sin usuario"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {solicitud.user?.employee_number ?? "Sin nómina"}
                      </p>
                    </div>
                  </td>
                ) : null}

                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {solicitud.date}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Folio #{solicitud.id}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {traducirTipoSolicitud(solicitud.request_kind)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {describirDetalleSolicitud(solicitud)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={claseBadgeEstatusSolicitud(solicitud.status)}
                  >
                    {traducirEstatusSolicitud(solicitud.status)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {solicitud.approver ? (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {solicitud.approver.full_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {solicitud.approved_by_role ?? "Sin rol"}
                      </p>
                    </div>
                  ) : solicitud.canceller ? (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {solicitud.canceller.full_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Cancelado
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500">
                      Pendiente
                    </p>
                  )}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {onVerPermiso ? (
                      <button
                        type="button"
                        onClick={() => onVerPermiso(solicitud)}
                        title="Ver permiso"
                        aria-label="Ver permiso"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <IconoVerPermiso />
                      </button>
                    ) : null}

                    {onAprobar && solicitud.status === "pendiente" ? (
                      <button
                        type="button"
                        onClick={() => onAprobar(solicitud)}
                        title="Aprobar"
                        aria-label="Aprobar solicitud"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
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