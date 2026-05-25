export type UsuarioPermiso = {
  id: number;
  full_name?: string | null;
  email?: string | null;
  employee_number?: string | null;
  role?: string | null;
};

export type TipoSolicitud = "entrada" | "salida" | "entrada_salida" | "inasistencia";
export type EstatusSolicitud = "pendiente" | "aprobado" | "rechazado" | "cancelado";
export type TipoEmpleado = "administrativo" | "sindicalizado";
export type EstatusDirector = "pendiente" | "aprobado" | "rechazado" | "no_requerido";

export type SolicitudPermiso = {
  id: number;
  company_id: number;
  user_id: number;
  employee_type: TipoEmpleado;
  request_kind: TipoSolicitud;
  date: string;
  end_date?: string | null;
  entry_time: string | null;
  exit_time: string | null;
  days_count: string | number | null;
  reason: string;
  comments?: string | null;
  status: EstatusSolicitud;
  is_active: boolean;

  // Primer nivel de aprobación
  approved_by_role: string | null;
  approved_at: string | null;
  rejection_reason: string | null;

  // Segundo nivel (director)
  director_approval_status: EstatusDirector | null;
  director_approved_at: string | null;
  director_rejection_reason: string | null;

  // Cancelación
  cancel_reason?: string | null;
  cancelled_at: string | null;

  // Relaciones
  user?: UsuarioPermiso | null;
  requester?: UsuarioPermiso | null;
  approver?: UsuarioPermiso | null;
  director_approver?: UsuarioPermiso | null;
  canceller?: UsuarioPermiso | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type SolicitudPermisoPayload = {
  user_id?: number;
  request_kind: TipoSolicitud;
  date?: string;
  start_date?: string;
  end_date?: string;
  entry_time?: string;
  exit_time?: string;
  days_count?: number;
  reason: string;
  comments?: string;
};

export type RespuestaPaginadaSolicitudesPermiso = {
  data: SolicitudPermiso[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type ResumenPermisos = {
  pendientes: number;
  aprobados_mes: number;
  rechazados_mes: number;
  cuatro_permisos_mes: number;
};

export type CatalogOption = {
  id: number;
  full_name?: string;
  name?: string;
  employee_number?: string | null;
};

export type RespuestaSolicitudPermiso = {
  message?: string;
  data?: SolicitudPermiso;
};
