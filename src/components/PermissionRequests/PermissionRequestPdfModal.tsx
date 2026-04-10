/**
 * Componente PermissionRequestPdfModal
 *
 * Modal para ver detalles de solicitudes de permisos en dos vistas:
 * 1. Vista formateada: Visualización estructurada de toda la información de la solicitud
 * 2. Vista PDF: Vista previa de PDF embebida obtenida de la API
 * Incluye pestañas para cambiar entre vistas y muestra estatus de solicitud, información del empleado, fechas y detalles de aprobación.
 */
import { useEffect, useState } from "react";
import api from "../../lib/api";
import type { SolicitudPermiso } from "../../types/permissionRequests";

type Props = {
  abierto: boolean;
  solicitud?: SolicitudPermiso | null;
  onClose: () => void;
};

export default function PermissionRequestPdfModal({
  abierto,
  solicitud,
  onClose,
}: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<"formato" | "pdf">("formato");
  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible] = useState(false);

  // Manejar animación de apertura/cierre del modal
  useEffect(() => {
    if (abierto) {
      setRenderizar(true);

      const temporizador = window.setTimeout(() => {
        setVisible(true);
      }, 50);

      return () => window.clearTimeout(temporizador);
    }

    setVisible(false);

    const temporizador = window.setTimeout(() => {
      setRenderizar(false);
      setPdfUrl(null);
      setVista("formato");
      setError(null);
    }, 300);

    return () => window.clearTimeout(temporizador);
  }, [abierto]);

  // Obtener blob del PDF y crear URL de objeto cuando se abre el modal
  useEffect(() => {
    if (!abierto || !solicitud) return;

    let objectUrl: string | null = null;

    const cargarPdf = async () => {
      setCargando(true);
      setError(null);

      try {
        const respuesta = await api.get(
          `/permission-requests/${solicitud.id}/pdf`,
          {
            responseType: "blob",
          },
        );

        objectUrl = window.URL.createObjectURL(
          new Blob([respuesta.data], { type: "application/pdf" }),
        );

        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("No fue posible cargar el PDF del permiso:", err);
        setError("No fue posible cargar el PDF del permiso.");
      } finally {
        setCargando(false);
      }
    };

    cargarPdf();

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [abierto, solicitud]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatearHora = (hora: string | null) => {
    if (!hora) return "N/A";
    return hora;
  };

  const obtenerEstadoColor = (estado: string) => {
    switch (estado) {
      case "aprobado":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "rechazado":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "cancelado":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    }
  };

  const obtenerTipoPermiso = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "Permiso de Entrada";
      case "salida":
        return "Permiso de Salida";
      case "inasistencia":
        return "Permiso de Inasistencia";
      default:
        return tipo;
    }
  };

  if (!renderizar || !solicitud) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between px-6 py-4 text-white"
          style={{ backgroundColor: "#465fff" }}
        >
          <div>
            <h2 className="text-lg font-semibold">Ver permiso</h2>
            <p className="text-sm text-white/80">
              Detalles del permiso #{solicitud.id}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-sm bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setVista("formato")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  vista === "formato"
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white/15"
                }`}
              >
                Formato
              </button>
              <button
                type="button"
                onClick={() => setVista("pdf")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  vista === "pdf"
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white/15"
                }`}
              >
                PDF
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
          {vista === "formato" ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {obtenerTipoPermiso(solicitud.request_kind)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Solicitud #{solicitud.id}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${obtenerEstadoColor(
                      solicitud.status,
                    )}`}
                  >
                    {solicitud.status}
                  </span>
                </div>
              </div>

              {/* Employee Information */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Información del Empleado
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Nombre Completo
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {solicitud.user?.full_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Número de Empleado
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {solicitud.user?.employee_number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Correo Electrónico
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {solicitud.user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Tipo de Empleado
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white capitalize">
                      {solicitud.employee_type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permission Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Detalles del Permiso
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Fecha
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {formatearFecha(solicitud.date)}
                    </p>
                  </div>
                  {solicitud.request_kind !== "inasistencia" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                          Hora de Entrada
                        </label>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                          {formatearHora(solicitud.entry_time)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                          Hora de Salida
                        </label>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                          {formatearHora(solicitud.exit_time)}
                        </p>
                      </div>
                    </>
                  )}
                  {solicitud.days_count && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                        Días de Ausencia
                      </label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {solicitud.days_count} día{solicitud.days_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                    Motivo
                  </label>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {solicitud.reason}
                  </p>
                </div>
              </div>

              {/* Approval Information */}
              {(solicitud.status === "aprobado" || solicitud.status === "rechazado") && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                    Información de {solicitud.status === "aprobado" ? "Aprobación" : "Rechazo"}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                        {solicitud.status === "aprobado" ? "Aprobado por" : "Rechazado por"}
                      </label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {solicitud.approver?.full_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                        Rol del Aprobador
                      </label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {solicitud.approved_by_role || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                        Fecha de {solicitud.status === "aprobado" ? "Aprobación" : "Rechazo"}
                      </label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {solicitud.approved_at ? formatearFecha(solicitud.approved_at) : "N/A"}
                      </p>
                    </div>
                    {solicitud.status === "rechazado" && solicitud.rejection_reason && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                          Motivo del Rechazo
                        </label>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                          {solicitud.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Information */}
              {solicitud.status === "cancelado" && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                    Información de Cancelación
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                        Cancelado por
                      </label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {solicitud.canceller?.full_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                        Fecha de Cancelación
                      </label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {solicitud.cancelled_at ? formatearFecha(solicitud.cancelled_at) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Fechas del Sistema
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Fecha de Creación
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {solicitud.created_at ? formatearFecha(solicitud.created_at) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                      Última Actualización
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {solicitud.updated_at ? formatearFecha(solicitud.updated_at) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              {cargando ? (
                <div className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  Cargando PDF...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center px-6 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="h-full w-full rounded-xl"
                  title="Vista previa del permiso"
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}