import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PermissionRequestFormModal from "../../components/PermissionRequests/PermissionRequestFormModal";
import PermissionRequestsTable from "../../components/PermissionRequests/PermissionRequestsTable";
import RejectPermissionRequestModal from "../../components/PermissionRequests/RejectPermissionRequestModal";
import { useAuthStore } from "../../store/useAuthStore";
import type { SolicitudPermiso, SolicitudPermisoPayload } from "../../types/permissionRequests";
import {
  useAprobarDirector,
  useAprobarSolicitud,
  useCancelarSolicitud,
  useCrearSolicitud,
  useEliminarSolicitud,
  useResumenPermisos,
  useSolicitudesPermiso,
  useUsuariosParaPermiso,
} from "../../hooks/usePermissionRequests";

// ─── Constantes de UI ─────────────────────────────────────────────────────────

const TABS_ESTATUS = [
  { value: "",             label: "Todos" },
  { value: "pendiente",   label: "Pendientes" },
  { value: "aprobado",    label: "Aprobados" },
  { value: "rechazado",   label: "Rechazados" },
  { value: "cancelado",   label: "Cancelados" },
  { value: "mis_permisos",label: "Mis permisos" },
];

const BTN_SECUNDARIO =
  "inline-flex h-11 items-center justify-center rounded-sm border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const BTN_PRIMARIO =
  "inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PermissionRequestsPage() {
  const { usuario, roles } = useAuthStore();

  // ── Permisos del usuario ────────────────────────────────────────────────────
  const puedeVerTodos     = roles.some((r) => ["rh", "admin", "super_admin"].includes(r));
  const esDirector        = roles.includes("director");
  const puedeAutorizar    = puedeVerTodos || roles.includes("manager") || esDirector;

  // ── Filtros (los "activos" son los confirmados, los otros son el borrador del form) ──
  const [busqueda, setBusqueda]               = useState("");
  const [tipoEmpleado, setTipoEmpleado]       = useState("");
  const [tipoSolicitud, setTipoSolicitud]     = useState("");
  const [usuarioId, setUsuarioId]             = useState("");
  const [dateFrom, setDateFrom]               = useState("");
  const [dateTo, setDateTo]                   = useState("");
  const [status, setStatus]                   = useState("");
  const [paginaActual, setPaginaActual]       = useState(1);
  const [porPagina]                           = useState(10);

  // Filtros "confirmados" — solo se actualizan al presionar Buscar
  const [filtrosActivos, setFiltrosActivos] = useState({
    search: "", employee_type: "", request_kind: "",
    user_id: "", date_from: "", date_to: "", status: "",
  });

  // ── Modales ─────────────────────────────────────────────────────────────────
  const [modalNuevoAbierto, setModalNuevoAbierto]   = useState(false);
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudPermiso | null>(null);

  // ── React Query ─────────────────────────────────────────────────────────────
  const { data: paginacion, isFetching: cargando } = useSolicitudesPermiso({
    ...filtrosActivos,
    page:     paginaActual,
    per_page: porPagina,
  });

  const { data: resumen }    = useResumenPermisos();
  const { data: usuarios = [] } = useUsuariosParaPermiso(puedeVerTodos);

  const crearSolicitud    = useCrearSolicitud();
  const aprobarSolicitud  = useAprobarSolicitud();
  const aprobarDirector   = useAprobarDirector();
  const cancelarSolicitud = useCancelarSolicitud();
  const eliminarSolicitud = useEliminarSolicitud();

  const solicitudes   = paginacion?.data       ?? [];
  const total         = paginacion?.total      ?? 0;
  const ultimaPag     = paginacion?.last_page  ?? 1;
  const desde         = paginacion?.from       ?? null;
  const hasta         = paginacion?.to         ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaActual(1);
    setFiltrosActivos({
      search:        busqueda,
      employee_type: tipoEmpleado,
      request_kind:  tipoSolicitud,
      user_id:       usuarioId,
      date_from:     dateFrom,
      date_to:       dateTo,
      status,
    });
  };

  const limpiar = () => {
    setBusqueda(""); setTipoEmpleado(""); setTipoSolicitud("");
    setUsuarioId(""); setDateFrom(""); setDateTo(""); setStatus("");
    setPaginaActual(1);
    setFiltrosActivos({ search:"", employee_type:"", request_kind:"",
      user_id:"", date_from:"", date_to:"", status:"" });
  };

  const cambiarTab = (nuevoStatus: string) => {
    setStatus(nuevoStatus);
    setPaginaActual(1);
    setFiltrosActivos((prev) => ({ ...prev, status: nuevoStatus }));
  };

  const handleCrear = async (payload: SolicitudPermisoPayload) => {
    await crearSolicitud.mutateAsync(payload);
    setModalNuevoAbierto(false);
  };

  const handleAprobar = async (solicitud: SolicitudPermiso) => {
    // Si el usuario es director y la solicitud tiene aprobación de director pendiente
    if (esDirector && solicitud.director_approval_status === "pendiente") {
      await aprobarDirector.mutateAsync({ id: solicitud.id });
    } else {
      await aprobarSolicitud.mutateAsync({ id: solicitud.id });
    }
  };

  const handleCancelar = async (solicitud: SolicitudPermiso) => {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: "Cancelar solicitud",
      input: "textarea",
      inputLabel: "Motivo de cancelación",
      inputPlaceholder: "Escribe el motivo",
      showCancelButton: true,
      confirmButtonText: "Cancelar solicitud",
      cancelButtonText: "Volver",
      reverseButtons: true,
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#6b7280",
      inputValidator: (v) => (!v?.trim() ? "Debes capturar el motivo." : null),
    });

    if (!isConfirmed || !motivo) return;

    await cancelarSolicitud.mutateAsync({ id: solicitud.id, cancel_reason: motivo.trim() });
  };

  const handleEliminar = async (solicitud: SolicitudPermiso) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Ocultar solicitud?",
      text: "La solicitud dejará de aparecer en la tabla.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, ocultar",
      cancelButtonText: "Volver",
      reverseButtons: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });
    if (!isConfirmed) return;
    await eliminarSolicitud.mutateAsync(solicitud.id);
  };

  const abrirRechazo = (solicitud: SolicitudPermiso) => {
    setSolicitudSeleccionada(solicitud);
    setModalRechazoAbierto(true);
  };

  const abrirPdf = (solicitud: SolicitudPermiso) => {
    window.open(`${import.meta.env.VITE_API_URL}/permission-requests/${solicitud.id}/pdf`, "_blank");
  };

  const puedeCancelar = (s: SolicitudPermiso) =>
    s.status === "pendiente" && (s.user_id === usuario?.id || puedeVerTodos);

  // ── Tarjetas de métricas ─────────────────────────────────────────────────────

  const tarjetas = resumen
    ? [
        { label: "Pendientes",        valor: resumen.pendientes,          color: "text-yellow-600" },
        { label: "Aprobados este mes", valor: resumen.aprobados_mes,       color: "text-green-600"  },
        { label: "Rechazados este mes",valor: resumen.rechazados_mes,      color: "text-red-600"    },
        { label: "Con 4+ este mes",    valor: resumen.cuatro_permisos_mes, color: "text-orange-600" },
      ]
    : [];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta
        title="Gestión de Permisos | SIE"
        description="Solicitudes de permiso de entrada, salida e inasistencia"
      />

      <div className="space-y-6">
        {/* Encabezado + métricas */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Gestión de Permisos
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Solicitudes de entrada, salida e inasistencia
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalNuevoAbierto(true)}
              className={BTN_PRIMARIO}
            >
              + Generar permiso
            </button>
          </div>

          {/* Métricas */}
          {tarjetas.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {tarjetas.map((t) => (
                <div
                  key={t.label}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${t.color}`}>{t.valor}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs de estatus */}
          <div className="mt-6 flex flex-wrap gap-2 rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
            {TABS_ESTATUS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => cambiarTab(tab.value)}
                className={`rounded-sm px-4 py-2 text-sm font-medium transition ${
                  filtrosActivos.status === tab.value
                    ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-600 hover:bg-white/70 dark:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtros */}
          <form onSubmit={buscar} className="mt-6 grid grid-cols-1 gap-3 xl:grid-cols-6">
            <input
              className="xl:col-span-2 h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Buscar por empleado o motivo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={tipoEmpleado}
              onChange={(e) => setTipoEmpleado(e.target.value)}
            >
              <option value="">Tipo de empleado</option>
              <option value="administrativo">Administrativo</option>
              <option value="sindicalizado">Sindicalizado</option>
            </select>

            <select
              className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={tipoSolicitud}
              onChange={(e) => setTipoSolicitud(e.target.value)}
            >
              <option value="">Tipo de permiso</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="entrada_salida">Entrada y salida</option>
              <option value="inasistencia">Inasistencia</option>
            </select>

            {puedeVerTodos ? (
              <select
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
              >
                <option value="">Todos los empleados</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name ?? u.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            )}

            <div className="flex gap-3">
              <button type="submit" className={BTN_SECUNDARIO}>Buscar</button>
              <button type="button" onClick={limpiar} className={BTN_SECUNDARIO}>Limpiar</button>
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <PermissionRequestsTable
            solicitudes={solicitudes}
            cargando={cargando}
            mostrarEmpleado={puedeVerTodos || puedeAutorizar}
            onAprobar={puedeAutorizar ? handleAprobar : undefined}
            onRechazar={puedeAutorizar ? abrirRechazo : undefined}
            onCancelar={(s) => (puedeCancelar(s) ? handleCancelar(s) : undefined)}
            onEliminar={puedeVerTodos ? handleEliminar : undefined}
            onVerPermiso={abrirPdf}
          />

          {/* Paginación */}
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <p>
              {total > 0
                ? `Mostrando ${desde ?? 0} a ${hasta ?? 0} de ${total} registros`
                : "Sin registros"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => p - 1)}
                disabled={paginaActual <= 1 || cargando}
                className={BTN_SECUNDARIO}
              >
                &lt;
              </button>
              <span className="px-2">
                {paginaActual} de {ultimaPag}
              </span>
              <button
                type="button"
                onClick={() => setPaginaActual((p) => p + 1)}
                disabled={paginaActual >= ultimaPag || cargando}
                className={BTN_SECUNDARIO}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: nueva solicitud */}
      <PermissionRequestFormModal
        abierto={modalNuevoAbierto}
        enviando={crearSolicitud.isPending}
        puedeVerTodos={puedeVerTodos}
        usuarios={usuarios}
        onClose={() => setModalNuevoAbierto(false)}
        onSubmit={handleCrear}
      />

      {/* Modal: rechazar */}
      <RejectPermissionRequestModal
        abierto={modalRechazoAbierto}
        onClose={() => {
          setModalRechazoAbierto(false);
          setSolicitudSeleccionada(null);
        }}
        onGuardado={async () => {
          setModalRechazoAbierto(false);
          setSolicitudSeleccionada(null);
        }}
        solicitud={solicitudSeleccionada}
      />
    </>
  );
}
