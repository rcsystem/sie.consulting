/**
 * Componente PermissionRequestsPage
 *
 * Página principal para gestionar todas las solicitudes de permisos en el sistema.
 * Proporciona filtrado, búsqueda y acciones basadas en roles como aprobar, rechazar o cancelar solicitudes.
 * Accesible para usuarios RH, admin, super_admin con permisos variables.
 */
import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import PermissionRequestFormModal from "../../components/PermissionRequests/PermissionRequestFormModal";
import PermissionRequestsTable from "../../components/PermissionRequests/PermissionRequestsTable";
import RejectPermissionRequestModal from "../../components/PermissionRequests/RejectPermissionRequestModal";
import type { UsuarioSistema } from "../../types/users";
import type {
  RespuestaPaginadaSolicitudesPermiso,
  SolicitudPermiso,
} from "../../types/permissionRequests";

// Tipo para datos del usuario actual
type UsuarioActual = {
  id: number;
  role?: string | null;
  full_name?: string | null;
  email?: string | null;
};

// Tipo para resumen de solicitudes de permisos
type ResumenPermisos = {
  pendientes: number;
  aprobados_mes: number;
  rechazados_mes: number;
  cuatro_permisos_mes: number;
};

// Pestañas de estado para filtrar solicitudes
const tabsEstatus = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "cancelado", label: "Cancelados" },
  { value: "mis_permisos", label: "Mis permisos" },
];

export default function PermissionRequestsPage() {
  // Estado para datos de solicitudes de permisos y UI
  const [solicitudes, setSolicitudes] = useState<SolicitudPermiso[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(
    null,
  );
  const [resumen, setResumen] = useState<ResumenPermisos | null>(null);
  const [cargando, setCargando] = useState(false);

  // Estados de filtro para búsqueda y filtrado de solicitudes
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [requestKind, setRequestKind] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);

  // Estados de modal para crear y rechazar solicitudes
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudPermiso | null>(null);

  // Clases CSS para botones
  const claseBotonSecundario =
    "inline-flex h-11 items-center justify-center rounded-sm border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  const claseBotonPrimario =
    "inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

  // Banderas de permisos basadas en el rol del usuario
  const puedeVerTodos =
    usuarioActual?.role === "rh" ||
    usuarioActual?.role === "admin" ||
    usuarioActual?.role === "super_admin";

  const puedeAutorizar =
    puedeVerTodos ||
    usuarioActual?.role === "manager" ||
    usuarioActual?.role === "director";

  const puedeCapturarParaOtros = puedeVerTodos;

  // Cargar estadísticas de resumen para solicitudes de permisos
  const cargarResumen = async () => {
    try {
      const { data } = await api.get("/permission-requests/summary");
      setResumen(data);
    } catch (error) {
      console.error("No fue posible cargar el resumen.", error);
    }
  };

  // Cargar datos del usuario autenticado actual
  const cargarUsuarioActual = async () => {
    try {
      const response = await api.get("/auth/me");
      const user = response.data?.user ?? response.data;

      setUsuarioActual({
        id: user?.id,
        role: user?.role ?? null,
        full_name: user?.full_name ?? null,
        email: user?.email ?? null,
      });
    } catch (error) {
      console.error("No fue posible cargar el usuario autenticado.", error);
    }
  };

  // Cargar lista de usuarios para selección (solo si el usuario tiene permiso para ver todos)
  const cargarUsuarios = async () => {
    if (!puedeVerTodos) return;

    try {
      const response = await api.get("/users", {
        params: {
          per_page: 100,
        },
      });

      setUsuarios(response.data.data ?? []);
    } catch (error) {
      console.error("No fue posible cargar usuarios.", error);
    }
  };

  // Cargar solicitudes de permisos con filtros opcionales y paginación
  const cargarSolicitudes = async (
    pagina = paginaActual,
    limite = porPagina,
    overrides?: {
      search?: string;
      status?: string;
      employeeType?: string;
      requestKind?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) => {
    const searchFinal = overrides?.search ?? search;
    const statusFinal = overrides?.status ?? status;
    const employeeTypeFinal = overrides?.employeeType ?? employeeType;
    const requestKindFinal = overrides?.requestKind ?? requestKind;
    const userIdFinal = overrides?.userId ?? userId;
    const dateFromFinal = overrides?.dateFrom ?? dateFrom;
    const dateToFinal = overrides?.dateTo ?? dateTo;

    setCargando(true);

    try {
      const params: Record<string, unknown> = {
        search: searchFinal || undefined,
        employee_type: employeeTypeFinal || undefined,
        request_kind: requestKindFinal || undefined,
        user_id: puedeVerTodos ? userIdFinal || undefined : undefined,
        date_from: dateFromFinal || undefined,
        date_to: dateToFinal || undefined,
        page: pagina,
        per_page: limite,
        is_active: true,
      };

      if (statusFinal === "mis_permisos") {
        params.solo_mios = 1;
      } else {
        params.status = statusFinal || undefined;
      }

      const { data } = await api.get("/permission-requests", { params });

      const filas = data.data ?? [];
      const meta = data.meta ?? {};

      setSolicitudes(filas);
      setPaginaActual(meta.current_page ?? 1);
      setUltimaPagina(meta.last_page ?? 1);
      setTotal(meta.total ?? filas.length);
      setDesde(meta.from ?? (filas.length ? 1 : 0));
      setHasta(meta.to ?? filas.length);
      console.log("respuesta permission-requests:", data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarioActual();
    cargarResumen();
  }, []);

  useEffect(() => {
    if (!usuarioActual) return;

    if (puedeVerTodos) {
      cargarUsuarios();
    }

    cargarSolicitudes(1, porPagina);
  }, [usuarioActual]);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    await cargarSolicitudes(1, porPagina);
  };

  const limpiar = async () => {
    setSearch("");
    setStatus("");
    setEmployeeType("");
    setRequestKind("");
    setUserId("");
    setDateFrom("");
    setDateTo("");

    await cargarSolicitudes(1, porPagina, {
      search: "",
      status: "",
      employeeType: "",
      requestKind: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
    });

    await cargarResumen();
  };

  // Aprobar una solicitud de permiso
  const aprobar = async (solicitud: SolicitudPermiso) => {
    await api.patch(`/permission-requests/${solicitud.id}/approve`, {});
    await cargarSolicitudes(paginaActual, porPagina);
    await cargarResumen();
  };

  // Cancelar una solicitud de permiso
  const cancelar = async (solicitud: SolicitudPermiso) => {
    await api.patch(`/permission-requests/${solicitud.id}`, {
      is_active: false
    });
    await cargarSolicitudes(paginaActual, porPagina);
    await cargarResumen();
  };

  const abrirRechazo = (solicitud: SolicitudPermiso) => {
    setSolicitudSeleccionada(solicitud);
    setModalRechazoAbierto(true);
  };

  const puedeCancelarSolicitud = (solicitud: SolicitudPermiso) => {
    return (
      solicitud.status === "pendiente" &&
      (solicitud.user_id === usuarioActual?.id || puedeVerTodos)
    );
  };

  return (
    <>
      <PageMeta
        title="Gestión de Permisos | SIE"
        description="Gestión unificada de solicitudes de permiso"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Gestión de Permisos
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setModalNuevoAbierto(true)}
              className={claseBotonPrimario}
            >
              + Generar Nuevo Permiso
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2 rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
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
          </div>

          <form
            onSubmit={buscar}
            className="mt-6 grid grid-cols-1 gap-3 xl:grid-cols-4"
          >
            <input
              className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Buscar por empleado o motivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
            >
              <option value="">Todos los tipos de empleado</option>
              <option value="administrativo">Administrativo</option>
              <option value="sindicalizado">Sindicalizado</option>
            </select>

            <select
              className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={requestKind}
              onChange={(e) => setRequestKind(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="inasistencia">Inasistencia</option>
            </select>

            {puedeVerTodos ? (
              <select
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Todos los empleados</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            )}

            {puedeVerTodos ? (
              <input
                type="date"
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            ) : (
              <input
                type="date"
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            )}

            {puedeVerTodos ? (
              <input
                type="date"
                className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            ) : (
              <div className="flex gap-3">
                <button type="submit" className={claseBotonSecundario}>
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
            )}

            {puedeVerTodos ? (
              <div className="flex gap-3 xl:col-span-1">
                <button type="submit" className={claseBotonSecundario}>
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
            ) : null}
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <PermissionRequestsTable
            solicitudes={solicitudes}
            cargando={cargando}
            mostrarEmpleado
            onAprobar={
              puedeAutorizar
                ? async (solicitud) => {
                    await aprobar(solicitud);
                  }
                : undefined
            }
            onRechazar={
              puedeAutorizar
                ? (solicitud) => {
                    abrirRechazo(solicitud);
                  }
                : undefined
            }
            onCancelar={async (solicitud) => {
              if (
                solicitud.status === "pendiente" &&
                (solicitud.user_id === usuarioActual?.id || puedeVerTodos)
              ) {
                await cancelar(solicitud);
              }
            }}
          />

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {desde ?? 0} a {hasta ?? 0} de {total} registros
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => cargarSolicitudes(paginaActual - 1, porPagina)}
                disabled={paginaActual <= 1}
                className={claseBotonSecundario}
              >
                &lt;
              </button>

              <span className="text-sm">
                {paginaActual} de {ultimaPagina}
              </span>

              <button
                type="button"
                onClick={() => cargarSolicitudes(paginaActual + 1, porPagina)}
                disabled={paginaActual >= ultimaPagina}
                className={claseBotonSecundario}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      <PermissionRequestFormModal
        abierto={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onGuardado={async () => {
          await cargarSolicitudes(1, porPagina);
          await cargarResumen();
        }}
        permitirCapturarParaOtros={puedeCapturarParaOtros}
        usuarios={usuarios}
      />

      <RejectPermissionRequestModal
        abierto={modalRechazoAbierto}
        onClose={() => {
          setModalRechazoAbierto(false);
          setSolicitudSeleccionada(null);
        }}
        onGuardado={async () => {
          await cargarSolicitudes(paginaActual, porPagina);
          await cargarResumen();
        }}
        solicitud={solicitudSeleccionada}
      />
    </>
  );
}
