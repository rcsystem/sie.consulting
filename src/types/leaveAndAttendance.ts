// ─── TIPOS VACACIONES ──────────────────────────────────────────────────────────

export type TipoPermiso =
  | 'vacaciones'
  | 'permiso_goce'
  | 'permiso_sin_goce'
  | 'incapacidad';

export type EstatusVacacion =
  | 'pending'
  | 'manager_approved'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface LeaveRequest {
  id: number;
  company_id: number;
  user_id: number;
  leave_type: TipoPermiso;
  leave_type_label: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  medical_reference?: string | null;
  status: EstatusVacacion;
  status_label: string;
  is_active: boolean;

  // Aprobaciones
  manager_approved_at?: string | null;
  manager_approved_role?: string | null;
  rh_approved_at?: string | null;

  // Rechazo
  rejection_reason?: string | null;
  rejected_at?: string | null;

  // Cancelación
  cancel_reason?: string | null;
  cancelled_at?: string | null;

  // Relaciones
  user?: {
    id: number;
    full_name: string;
    email: string;
    employee_number?: string | null;
    hire_date?: string | null;
    department?: { id?: number; name: string } | null;
    position?: { id?: number; name: string } | null;
  } | null;
  requester?: { id: number; full_name: string } | null;
  manager_approver?: { id: number; full_name: string } | null;
  rh_approver?: { id: number; full_name: string } | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface LeaveRequestPayload {
  user_id?: number;
  leave_type: TipoPermiso;
  start_date: string;
  end_date: string;
  reason: string;
  medical_reference?: string;
}

export interface VacationBalance {
  id: number;
  user_id: number;
  year: number;
  entitled_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  seniority_years: number;
  notes?: string | null;
}

export interface VacationBalanceResponse {
  balance: VacationBalance;
  entitled_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  seniority_years: number;
  year: number;
}

export interface ResumenVacaciones {
  pendientes: number;
  aprobadas_anio: number;
  rechazadas: number;
}

export interface PaginadoVacaciones {
  data: LeaveRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// ─── TIPOS ASISTENCIA ──────────────────────────────────────────────────────────

export type EstatusAsistencia =
  | 'present'
  | 'late'
  | 'absent'
  | 'justified_absence'
  | 'unjustified_absence'
  | 'weekend'
  | 'holiday'
  | 'early_leave';

export interface AttendanceRecord {
  id: number;
  user_id: number;
  work_date: string;

  // Horario
  scheduled_entry?: string | null;
  scheduled_exit?: string | null;
  tolerance_minutes: number;

  // Chequeos
  first_check_in?: string | null;
  last_check_out?: string | null;
  worked_minutes: number;
  worked_hours: number;

  // Estado
  attendance_status: EstatusAsistencia;
  attendance_status_label: string;

  // Retardo
  is_late: boolean;
  late_minutes: number;

  // Salida anticipada
  left_early: boolean;
  early_leave_minutes: number;

  // Horas extra
  has_overtime: boolean;
  overtime_minutes: number;
  overtime_hours: number;

  // Justificación
  is_justified: boolean;
  justified_by_type?: string | null;
  justified_by_id?: number | null;

  notes?: string | null;

  user?: {
    id: number;
    full_name: string;
    employee_number?: string | null;
  } | null;

  created_at?: string | null;
}

export interface ResumenAsistencia {
  total_presentes: number;
  total_retardos: number;
  total_faltas_just: number;
  total_faltas_injust: number;
  total_horas_extra: number;
  month: number;
  year: number;
}

export interface MiAsistenciaResponse {
  records: AttendanceRecord[];
  summary: {
    presentes: number;
    retardos: number;
    faltas_justificadas: number;
    faltas_injustificadas: number;
    horas_extra: number;
    minutos_retardo: number;
  };
  month: number;
  year: number;
}

export interface PaginadoAsistencia {
  data: AttendanceRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ZktecoDevice {
  id: number;
  serial_number: string;
  name: string;
  location?: string | null;
  ip_address?: string | null;
  last_seen_at?: string | null;
  is_active: boolean;
}

export interface FiltrosVacaciones {
  search?: string;
  status?: string;
  leave_type?: string;
  date_from?: string;
  date_to?: string;
  solo_mios?: boolean;
  page?: number;
  per_page?: number;
}

export interface FiltrosAsistencia {
  user_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
  month?: number;
  year?: number;
  page?: number;
  per_page?: number;
}
