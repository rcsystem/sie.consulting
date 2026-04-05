import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import PermissionRequestFormModal from "../../components/PermissionRequests/PermissionRequestFormModal";
import PermissionRequestsTable from "../../components/PermissionRequests/PermissionRequestsTable";
import type {
  RespuestaPaginadaSolicitudesPermiso,
  SolicitudPermiso,
} from "../../types/permissionRequests";

export default function MyPermissionRequestsPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPermiso[]>([]);
  const [cargando, setCargando] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);

  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);

  const claseBotonPrimario =
    "inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

  const claseBotonSecundario =
    "inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

  const cargarMisSolicitudes = async (
    pagina = paginaActual,
    limite = porPagina,
  ) => {
    setCargando(true);

    try {
      const { data } = await api.get<RespuestaPaginadaSolicitudesPermiso>(
        "/permission-requests/mine",
        {
          params: {
            page: pagina,
            per_page: limite,
          },
        },
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
      console.error("No fue posible cargar mis permisos.", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMisSolicitudes(1, porPagina);
  }, []);

const guardarSolicitud = async (payload: Record<string, unknown>) => {
  console.log("Antes de guardar");

  try {
    const respuesta = await api.post("/permission-requests", payload);
    console.log("POST OK:", respuesta.data);
    setModalNuevoAbierto(false);
  } catch (error) {
    console.error("POST falló:", error);
    throw error;
  }

  console.log("Antes de recargar mis permisos");

  try {
    await cargarMisSolicitudes(1, porPagina);
    console.log("Recarga OK");
  } catch (error) {
    console.error("Recarga falló:", error);
  }
};


  const cancelar = async (solicitud: SolicitudPermiso) => {
  const resultado = await Swal.fire({
    title: "¿Cancelar solicitud?",
    text: "La solicitud cambiará a estatus cancelado.",
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
    await api.patch(`/permission-requests/${solicitud.id}/cancel`);

    await Swal.fire({
      title: "Solicitud cancelada",
      text: "La solicitud fue cancelada correctamente.",
      icon: "success",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#16a34a",
    });

    await cargarMisSolicitudes(paginaActual, porPagina);
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



function IconoRechazar() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
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


  return (
    <>
      <PageMeta
        title="Mis permisos | SIE"
        description="Consulta y gestión de mis solicitudes de permiso"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Mis permisos
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Consulta el historial de tus solicitudes y genera nuevos
                permisos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalNuevoAbierto(true)}
              className={claseBotonPrimario}
            >
              + Generar Nuevo Permiso
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
            <PermissionRequestsTable
              solicitudes={solicitudes}
              cargando={cargando}
              mostrarEmpleado={false}
              onCancelar={cancelar}
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
                  await cargarMisSolicitudes(1, nuevoLimite);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                  await cargarMisSolicitudes(paginaActual - 1, porPagina);
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
                  await cargarMisSolicitudes(paginaActual + 1, porPagina);
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

      <PermissionRequestFormModal
        abierto={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onSubmit={guardarSolicitud}
        puedeVerTodos={false}
      />
    </>
  );
}
