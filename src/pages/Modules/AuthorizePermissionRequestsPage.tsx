/**
 * Componente AuthorizePermissionRequestsPage
 *
 * Página para usuarios autorizados (gerentes, directores, RH, admins) para revisar y gestionar solicitudes de permisos.
 * Proporciona capacidades de filtrado, aprobación, rechazo, cancelación y visualización de PDF.
 */
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import PermissionRequestsTable from "../../components/PermissionRequests/PermissionRequestsTable";
import RejectPermissionRequestModal from "../../components/PermissionRequests/RejectPermissionRequestModal";
import PermissionRequestPdfModal from "../../components/PermissionRequests/PermissionRequestPdfModal";
import type {
  RespuestaPaginadaSolicitudesPermiso,
  SolicitudPermiso,
} from "../../types/permissionRequests";

// Pestañas de estado para filtrar solicitudes
const tabsEstatus = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "cancelado", label: "Cancelados" },
];

export default function AuthorizePermissionRequestsPage() {
  // Estado para datos de solicitudes de permisos y UI
  const [solicitudes, setSolicitudes] = useState<SolicitudPermiso[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados de filtro para búsqueda y filtrado de solicitudes
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [requestKind, setRequestKind] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);

  // Estados de modal para visualización de PDF y rechazo
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [solicitudPdf, setSolicitudPdf] = useState<SolicitudPermiso | null>(
    null,
  );

  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudPermiso | null>(null);

  // Clases CSS para botones
  const claseBotonPrimario =
    "inline-flex h-10 items-center justify-center rounded-sm bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

  const claseBotonSecundario =
    "inline-flex h-10 items-center justify-center rounded-sm border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

  // Abrir modal de PDF para una solicitud específica
  const abrirPermiso = (solicitud: SolicitudPermiso) => {
    setSolicitudPdf(solicitud);
    setModalPdfAbierto(true);
  };

  // Cargar solicitudes de permisos con filtros y paginación
  const cargarSolicitudes = async (
    pagina = paginaActual,
    limite = porPagina,
    overrides?: {
      search?: string;
      status?: string;
      employeeType?: string;
      requestKind?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) => {
    setCargando(true);

    try {
      const searchFinal = overrides?.search ?? search;
      const statusFinal = overrides?.status ?? status;
      const employeeTypeFinal = overrides?.employeeType ?? employeeType;
      const requestKindFinal = overrides?.requestKind ?? requestKind;
      const dateFromFinal = overrides?.dateFrom ?? dateFrom;
      const dateToFinal = overrides?.dateTo ?? dateTo;

      const params: Record<string, unknown> = {
        search: searchFinal || undefined,
        status: statusFinal || undefined,
        employee_type: employeeTypeFinal || undefined,
        request_kind: requestKindFinal || undefined,
        date_from: dateFromFinal || undefined,
        date_to: dateToFinal || undefined,
        page: pagina,
        per_page: limite,
        is_active: true,
      };

      const { data } = await api.get<RespuestaPaginadaSolicitudesPermiso>(
        "/permission-requests",
        { params },
      );

      const filas = data.data ?? [];
      const meta = (data as any).meta ?? {};

      setSolicitudes(filas);
      setPaginaActual(meta.current_page ?? 1);
      setUltimaPagina(meta.last_page ?? 1);
      setTotal(meta.total ?? filas.length);
      setDesde(meta.from ?? (filas.length > 0 ? 1 : 0));
      setHasta(meta.to ?? filas.length);
    } catch (error) {
      console.error("No fue posible cargar las solicitudes.", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes(1, porPagina);
  }, []);

  const buscar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await cargarSolicitudes(1, porPagina, {
      search,
      status,
      employeeType,
      requestKind,
      dateFrom,
      dateTo,
    });
  };

  const limpiar = async () => {
    setSearch("");
    setStatus("");
    setEmployeeType("");
    setRequestKind("");
    setDateFrom("");
    setDateTo("");

    await cargarSolicitudes(1, porPagina, {
      search: "",
      status: "",
      employeeType: "",
      requestKind: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Aprobar una solicitud de permiso con diálogo de confirmación
  const aprobar = async (solicitud: SolicitudPermiso) => {
    const resultado = await Swal.fire({
      title: "¿Aprobar solicitud?",
      text: "La solicitud quedará autorizada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#bcbfc5",
    });

    if (!resultado.isConfirmed) return;

    try {
      await api.patch(`/permission-requests/${solicitud.id}/approve`);

      await Swal.fire({
        title: "Solicitud aprobada",
        text: "La solicitud fue aprobada correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#16a34a",
      });

      await cargarSolicitudes(paginaActual, porPagina);
    } catch (error) {
      console.error(error);

      await Swal.fire({
        title: "No fue posible aprobar",
        text: "Ocurrió un error al aprobar la solicitud.",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const abrirRechazo = (solicitud: SolicitudPermiso) => {
    setSolicitudSeleccionada(solicitud);
    setModalRechazoAbierto(true);
  };

  const confirmarRechazo = async (motivo: string) => {
    if (!solicitudSeleccionada) return;

    await api.patch(`/permission-requests/${solicitudSeleccionada.id}/reject`, {
      rejection_reason: motivo,
    });

    setModalRechazoAbierto(false);
    setSolicitudSeleccionada(null);
    await cargarSolicitudes(paginaActual, porPagina);
  };

  const cancelar = async (solicitud: SolicitudPermiso) => {
    const resultado = await Swal.fire({
      title: "¿Cancelar solicitud?",
      text: "La solicitud será ocultada y no se mostrará más en la lista.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#d90606",
      cancelButtonColor: "#d6dbe4",
    });

    if (!resultado.isConfirmed) return;

    try {
      await api.patch(`/permission-requests/${solicitud.id}`, {
        is_active: false
      });

      await Swal.fire({
        title: "Solicitud cancelada",
        text: "La solicitud fue cancelada correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#16a34a",
      });

      await cargarSolicitudes(paginaActual, porPagina);
    } catch (error) {
      console.error(error);

      await Swal.fire({
        title: "No fue posible cancelar",
        text: "Ocurrió un error al cancelar la solicitud.",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const eliminar = async (solicitud: SolicitudPermiso) => {
    const confirmado = window.confirm(
      "¿Deseas ocultar esta solicitud? No se eliminará la información.",
    );
    if (!confirmado) return;

    await api.delete(`/permission-requests/${solicitud.id}`);
    await cargarSolicitudes(paginaActual, porPagina);
  };

  return (
    <>
      <PageMeta
        title="Autorizar permisos | SIE"
        description="Administración y autorización de solicitudes de permiso"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Autorizar permisos
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Revisa, filtra y resuelve solicitudes de permiso.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
            {tabsEstatus.map((tab) => {
              const activo = status === tab.value;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={async () => {
                    const nuevoStatus = tab.value;
                    setStatus(nuevoStatus);
                    await cargarSolicitudes(1, porPagina, {
                      status: nuevoStatus,
                    });
                  }}
                  className={`rounded-sm px-4 py-2 text-sm font-medium transition ${
                    activo
                      ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-white"
                      : "text-gray-600 hover:bg-white/70 dark:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={buscar}
            className="mt-6 grid grid-cols-1 gap-3 xl:grid-cols-4"
          >
            <input
              type="text"
              placeholder="Buscar por empleado o motivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

            <select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Todos los tipos de empleado</option>
              <option value="administrativo">Administrativo</option>
              <option value="sindicalizado">Sindicalizado</option>
            </select>

            <select
              value={requestKind}
              onChange={(e) => setRequestKind(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Todos los tipos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="falta">Falta</option>
              <option value="inasistencia">Inasistencia</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

            <div className="flex items-center gap-3">
              <button type="submit" className={claseBotonPrimario}>
                Buscar
              </button>

              <button
                type="button"
                onClick={limpiar}
                className={claseBotonSecundario}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
            <PermissionRequestsTable
              solicitudes={solicitudes}
              cargando={cargando}
              mostrarEmpleado={true}
              onAprobar={aprobar}
              onRechazar={abrirRechazo}
              onCancelar={cancelar}
              onVerPermiso={abrirPermiso}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between dark:text-gray-400">
            <p>
              Mostrando {desde ?? 0} a {hasta ?? 0} de {total} registros
            </p>

            <div className="flex items-center gap-3">
              <select
                value={porPagina}
                onChange={async (e) => {
                  const nuevoLimite = Number(e.target.value);
                  setPorPagina(nuevoLimite);
                  await cargarSolicitudes(1, nuevoLimite);
                }}
                className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {[10, 15, 20, 50].map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion} por página
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={async () => {
                  if (paginaActual <= 1) return;
                  await cargarSolicitudes(paginaActual - 1, porPagina);
                }}
                disabled={paginaActual <= 1}
                className={claseBotonSecundario}
              >
                Anterior
              </button>

              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Página {paginaActual} de {ultimaPagina}
              </span>

              <button
                type="button"
                onClick={async () => {
                  if (paginaActual >= ultimaPagina) return;
                  await cargarSolicitudes(paginaActual + 1, porPagina);
                }}
                disabled={paginaActual >= ultimaPagina}
                className={claseBotonSecundario}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
      <PermissionRequestPdfModal
        abierto={modalPdfAbierto}
        solicitud={solicitudPdf}
        onClose={() => {
          setModalPdfAbierto(false);
          setSolicitudPdf(null);
        }}
      />

      <RejectPermissionRequestModal
        abierto={modalRechazoAbierto}
        onClose={() => {
          setModalRechazoAbierto(false);
          setSolicitudSeleccionada(null);
        }}
        onSubmit={confirmarRechazo}
      />
    </>
  );
}