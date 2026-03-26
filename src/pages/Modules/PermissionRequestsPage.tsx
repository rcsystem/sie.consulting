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

type UsuarioActual = {
  id: number;
  role?: string | null;
  full_name?: string | null;
  email?: string | null;
};

const tabsEstatus = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "cancelado", label: "Cancelados" },
];

export default function PermissionRequestsPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPermiso[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [requestKind, setRequestKind] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);

  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudPermiso | null>(null);

  const claseBotonSecundario =
    "inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  const claseBotonPrimario =
    "inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

  const puedeVerTodos =
    usuarioActual?.role === "rh" ||
    usuarioActual?.role === "admin" ||
    usuarioActual?.role === "super_admin";

  const puedeAutorizar =
    puedeVerTodos ||
    usuarioActual?.role === "manager" ||
    usuarioActual?.role === "director";

  const puedeCapturarParaOtros = puedeVerTodos;

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

  const cargarSolicitudes = async (pagina = paginaActual, limite = porPagina) => {
    setCargando(true);

    try {
      const { data } =
        await api.get<RespuestaPaginadaSolicitudesPermiso>("/permission-requests", {
          params: {
            search: search || undefined,
            status: status || undefined,
            employee_type: employeeType || undefined,
            request_kind: requestKind || undefined,
            user_id: puedeVerTodos ? userId || undefined : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page: pagina,
            per_page: limite,
          },
        });

      setSolicitudes(data.data);
      setPaginaActual(data.current_page);
      setUltimaPagina(data.last_page);
      setTotal(data.total);
      setDesde(data.from ?? null);
      setHasta(data.to ?? null);
    } catch (error) {
      console.error("No fue posible cargar solicitudes.", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarioActual();
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
    await cargarSolicitudes(1, porPagina);
  };

  const aprobar = async (solicitud: SolicitudPermiso) => {
    await api.patch(`/permission-requests/${solicitud.id}/approve`, {});
    await cargarSolicitudes(paginaActual, porPagina);
  };

  const cancelar = async (solicitud: SolicitudPermiso) => {
    await api.patch(`/permission-requests/${solicitud.id}/cancel`);
    await cargarSolicitudes(paginaActual, porPagina);
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

  const puedeAprobarSolicitud = (solicitud: SolicitudPermiso) => {
    return solicitud.status === "pendiente" && puedeAutorizar;
  };

  const onAprobarTabla = puedeAutorizar
    ? (solicitud: SolicitudPermiso) => aprobar(solicitud)
    : undefined;

  const onRechazarTabla = puedeAutorizar
    ? (solicitud: SolicitudPermiso) => abrirRechazo(solicitud)
    : undefined;

  const onCancelarTabla = (solicitud: SolicitudPermiso) =>
    puedeCancelarSolicitud(solicitud) ? cancelar(solicitud) : undefined;

  return (
    <>
      <PageMeta
        title="Permisos | SIE"
        description="Gestión unificada de solicitudes de permiso"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Permisos
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Consulta, registra y autoriza permisos desde una sola vista.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalNuevoAbierto(true)}
              className={claseBotonPrimario}
            >
              Nueva solicitud
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5">
            {tabsEstatus.map((tab) => {
              const activo = status === tab.value;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={async () => {
                    setStatus(tab.value);
                    await cargarSolicitudes(1, porPagina);
                  }}
                  className={`flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    activo
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={buscar} className="mt-6 grid grid-cols-1 gap-3 xl:grid-cols-4">
            <input
              className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Buscar por empleado o motivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
            >
              <option value="">Todos los tipos de empleado</option>
              <option value="administrativo">Administrativo</option>
              <option value="sindicalizado">Sindicalizado</option>
            </select>

            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={requestKind}
              onChange={(e) => setRequestKind(e.target.value)}
            >
              <option value="">Todos los tipos de solicitud</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="inasistencia">Inasistencia</option>
            </select>

            {puedeVerTodos ? (
              <select
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            )}

            {puedeVerTodos ? (
              <input
                type="date"
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            ) : (
              <input
                type="date"
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            )}

            {puedeVerTodos ? (
              <input
                type="date"
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            ) : (
              <div className="flex gap-3">
                <button type="submit" className={claseBotonSecundario}>
                  Buscar
                </button>
                <button type="button" onClick={limpiar} className={claseBotonSecundario}>
                  Limpiar
                </button>
              </div>
            )}

            {puedeVerTodos ? (
              <div className="flex gap-3 xl:col-span-1">
                <button type="submit" className={claseBotonSecundario}>
                  Buscar
                </button>
                <button type="button" onClick={limpiar} className={claseBotonSecundario}>
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
            onAprobar={onAprobarTabla}
            onRechazar={onRechazarTabla}
            onCancelar={(solicitud) => {
              if (puedeCancelarSolicitud(solicitud)) {
                cancelar(solicitud);
              }
            }}
          />

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {desde ?? 0} a {hasta ?? 0} de {total} registros
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={porPagina}
                onChange={async (e) => {
                  const nuevoLimite = Number(e.target.value);
                  setPorPagina(nuevoLimite);
                  await cargarSolicitudes(1, nuevoLimite);
                }}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {[10, 15, 20, 50].map((item) => (
                  <option key={item} value={item}>
                    {item} por página
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => cargarSolicitudes(paginaActual - 1, porPagina)}
                disabled={paginaActual <= 1}
                className={claseBotonSecundario}
              >
                Anterior
              </button>

              <span className="text-sm">
                Página {paginaActual} de {ultimaPagina}
              </span>

              <button
                type="button"
                onClick={() => cargarSolicitudes(paginaActual + 1, porPagina)}
                disabled={paginaActual >= ultimaPagina}
                className={claseBotonSecundario}
              >
                Siguiente
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
        }}
        solicitud={solicitudSeleccionada}
      />
    </>
  );
}