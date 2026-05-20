import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import api from "../../lib/api";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type TipoNotificacion = "info" | "success" | "warning" | "error" | string;

type NotificacionSistema = {
  id: number;
  title: string;
  message: string;
  type: TipoNotificacion;
  url: string | null;
  data?: unknown;
  read_at: string | null;
  created_at: string | null;
};

type RespuestaNotificaciones = {
  data: NotificacionSistema[];
  unread_count: number;
};

/**
 * Dropdown de notificaciones de Zenda.
 *
 * Antes este componente tenía notificaciones demo/hardcodeadas de la plantilla.
 * Ahora consume exclusivamente el backend: GET /api/notifications.
 *
 * Flujo:
 * 1. Al montar el header, consulta las notificaciones reales del usuario autenticado.
 * 2. Al abrir la campana, vuelve a consultar para mostrar datos frescos.
 * 3. Cada 30 segundos refresca el contador y la lista.
 * 4. Al hacer clic en una notificación, la marca como leída y navega a su URL.
 */
export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionSistema[]>([]);
  const [sinLeer, setSinLeer] = useState(0);

  const tieneNoLeidas = sinLeer > 0;

  /**
   * Consulta las notificaciones reales del backend.
   * No hay fallback con datos demo para evitar que aparezcan notificaciones falsas.
   */
  const cargarNotificaciones = useCallback(async () => {
    try {
      setCargando(true);
      const { data } = await api.get<RespuestaNotificaciones>("/notifications", {
        params: { limit: 10 },
      });

      setNotificaciones(Array.isArray(data.data) ? data.data : []);
      setSinLeer(Number(data.unread_count ?? 0));
    } catch (error) {
      console.error("No se pudieron cargar las notificaciones.", error);
      setNotificaciones([]);
      setSinLeer(0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();

    const intervalo = window.setInterval(() => {
      cargarNotificaciones();
    }, 30000);

    const refrescarAlVolver = () => {
      if (document.visibilityState === "visible") {
        cargarNotificaciones();
      }
    };

    document.addEventListener("visibilitychange", refrescarAlVolver);

    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", refrescarAlVolver);
    };
  }, [cargarNotificaciones]);

  const toggleDropdown = () => {
    const nuevoEstado = !isOpen;
    setIsOpen(nuevoEstado);

    if (nuevoEstado) {
      cargarNotificaciones();
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  /**
   * Marca una notificación como leída y redirige al usuario al módulo relacionado.
   */
  const abrirNotificacion = async (notificacion: NotificacionSistema) => {
    try {
      if (!notificacion.read_at) {
        await api.patch(`/notifications/${notificacion.id}/read`);
      }
    } catch (error) {
      console.error("No se pudo marcar la notificación como leída.", error);
    } finally {
      closeDropdown();
      await cargarNotificaciones();

      if (notificacion.url) {
        navigate(notificacion.url);
      }
    }
  };

  /**
   * Marca todas las notificaciones como leídas.
   */
  const marcarTodasComoLeidas = async () => {
    try {
      await api.patch("/notifications/read-all");
      await cargarNotificaciones();
    } catch (error) {
      console.error("No se pudieron marcar todas las notificaciones como leídas.", error);
    }
  };

  const etiquetaContador = useMemo(() => {
    if (sinLeer <= 0) return "";
    return sinLeer > 9 ? "9+" : String(sinLeer);
  }, [sinLeer]);

  return (
    <div className="relative">
      <button
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Abrir notificaciones"
      >
        {tieneNoLeidas && (
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
            {etiquetaContador}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50"></span>
          </span>
        )}

        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notificaciones
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sinLeer > 0 ? `${sinLeer} sin leer` : "Sin pendientes"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sinLeer > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLeidas}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Leer todas
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Cerrar notificaciones"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        <ul className="flex h-auto flex-col overflow-y-auto custom-scrollbar">
          {cargando && notificaciones.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando notificaciones...
            </li>
          )}

          {!cargando && notificaciones.length === 0 && (
            <li className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                🔔
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                No tienes notificaciones
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Aquí aparecerán permisos, vacaciones y avisos reales de Zenda.
              </p>
            </li>
          )}

          {notificaciones.map((notificacion) => (
            <li key={notificacion.id}>
              <DropdownItem
                onItemClick={() => abrirNotificacion(notificacion)}
                className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                  !notificacion.read_at ? "bg-brand-50/50 dark:bg-white/[0.03]" : ""
                }`}
              >
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${resolverClasesTipo(notificacion.type)}`}>
                  {resolverIconoTipo(notificacion.type)}
                </span>

                <span className="block min-w-0 flex-1 text-left">
                  <span className="mb-1 block truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                    {notificacion.title}
                  </span>
                  <span className="line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400">
                    {notificacion.message}
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                    <span>{notificacion.read_at ? "Leída" : "Nueva"}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                    <span>{formatearTiempo(notificacion.created_at)}</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
      </Dropdown>
    </div>
  );
}

/**
 * Asigna un ícono simple por tipo de notificación.
 */
function resolverIconoTipo(tipo: TipoNotificacion): string {
  switch (tipo) {
    case "success":
      return "✓";
    case "warning":
      return "!";
    case "error":
      return "×";
    default:
      return "i";
  }
}

/**
 * Asigna colores visuales por tipo de notificación.
 */
function resolverClasesTipo(tipo: TipoNotificacion): string {
  switch (tipo) {
    case "success":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
    case "warning":
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
    case "error":
      return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
    default:
      return "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400";
  }
}

/**
 * Convierte una fecha ISO/string del backend a una etiqueta amigable.
 */
function formatearTiempo(fecha: string | null): string {
  if (!fecha) return "Sin fecha";

  const fechaCreacion = new Date(fecha.replace(" ", "T"));
  const diferenciaMs = Date.now() - fechaCreacion.getTime();

  if (Number.isNaN(diferenciaMs)) return fecha;

  const minutos = Math.max(0, Math.floor(diferenciaMs / 60000));

  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Hace ${dias} d`;

  return fechaCreacion.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
