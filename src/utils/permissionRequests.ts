import type { SolicitudPermiso } from "../types/permissionRequests";

export function traducirTipoEmpleado(valor?: string | null) {
  switch (valor) {
    case "administrativo":
      return "Administrativo";
    case "sindicalizado":
      return "Sindicalizado";
    default:
      return valor ?? "-";
  }
}

export function traducirTipoSolicitud(valor?: string | null) {
  switch (valor) {
    case "entrada":
      return "Permiso de entrada";
    case "salida":
      return "Permiso de salida";
    case "inasistencia":
      return "Inasistencia";
    default:
      return valor ?? "-";
  }
}

export function traducirEstatusSolicitud(valor?: string | null) {
  switch (valor) {
    case "pendiente":
      return "Pendiente";
    case "aprobado":
      return "Aprobado";
    case "rechazado":
      return "Rechazado";
    case "cancelado":
      return "Cancelado";
    default:
      return valor ?? "-";
  }
}

export function claseBadgeEstatusSolicitud(valor?: string | null) {
  const baseClasses = "rounded-full px-3 py-1 text-xs font-medium";

  switch (valor) {
    case "aprobado":
      return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300`;
    case "rechazado":
      return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300`;
    case "cancelado":
      return `${baseClasses} bg-gray-200 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300`;
    case "pendiente":
    default:
      return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300`;
  }
}

export function describirDetalleSolicitud(solicitud: SolicitudPermiso) {
  if (solicitud.request_kind === "entrada") {
    return solicitud.entry_time ? `Entrada: ${solicitud.entry_time}` : "-";
  }

  if (solicitud.request_kind === "salida") {
    return solicitud.exit_time ? `Salida: ${solicitud.exit_time}` : "-";
  }

  if (solicitud.request_kind === "inasistencia") {
    const inicio = solicitud.date ?? "-";
    const fin = solicitud.end_date ?? solicitud.date ?? "-";
    const dias = solicitud.days_count ?? 1;

    return `${dias} día(s) · ${inicio} al ${fin}`;
  }

  return "-";
}
