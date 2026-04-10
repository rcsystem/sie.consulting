export type UsuarioPermiso = {
  id: number;
  full_name?: string | null;
  email?: string | null;
  employee_number?: string | null;
  role?: string | null;
};

export type SolicitudPermiso = {
  id: number;
  company_id: number;
  user_id: number;
  employee_type: "administrativo" | "sindicalizado";
  request_kind: "entrada" | "salida" | "inasistencia";
  date: string;
  entry_time: string | null;
  exit_time: string | null;
  days_count: string | number | null;
  reason: string;

  status: "pendiente" | "aprobado" | "rechazado" | "cancelado";
  is_active: boolean;
  approved_by_role: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  user?: UsuarioPermiso | null;
  requester?: UsuarioPermiso | null;
  approver?: UsuarioPermiso | null;
  canceller?: UsuarioPermiso | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SolicitudPermisoPayload = {
  user_id?: number;
  request_kind: "entrada" | "salida" | "inasistencia";
  date?: string;
  start_date?: string;
  end_date?: string;
  entry_time?: string;
  exit_time?: string;
  reason: string;
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

export type FormularioSolicitudPermiso = {
  user_id: string;
  request_kind: "entrada" | "salida" | "inasistencia";
  date: string;
  entry_time: string;
  exit_time: string;
  days_count: string;
  reason: string;
  comments: string;
};

export type RespuestaSolicitudPermiso = {
  message: string;
  permission_request: SolicitudPermiso;
};