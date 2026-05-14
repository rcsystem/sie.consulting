// ─── Catálogos ────────────────────────────────────────────────────────────────

export type HierarchyLevel = {
  id: number;
  name: string;
  code?: string | null;
  daily_amount?: number | null;
};

export type TravelCountry = {
  id: number;
  name: string;
  currency_code: string;
  daily_amount?: number | null;
  is_active: boolean;
};

export type TravelCatalogs = {
  hierarchy_levels: HierarchyLevel[];
  countries: TravelCountry[];
};

// ─── Solicitud ────────────────────────────────────────────────────────────────

export type TipoSolicitudViaje = "viatico" | "gasto";
export type EstatusViaje = "pending" | "approved" | "rejected" | "cancelled";
export type EstatusVerificacion = "pending" | "partial" | "completed";

export type UsuarioViaje = {
  id: number;
  full_name?: string | null;
  employee_number?: string | null;
  email?: string | null;
};

export type TravelRequest = {
  id: number;
  company_id: number;
  user_id: number;
  request_type: TipoSolicitudViaje;

  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  days_count: number;

  hierarchy_level?: HierarchyLevel | null;
  country?: TravelCountry | null;

  estimated_amount: number;
  currency_code: string;
  approved_amount?: number | null;

  reason: string;
  observations?: string | null;
  ncr_number?: string | null;

  needs_flight: boolean;
  departure_time?: string | null;
  return_time?: string | null;

  needs_advance: boolean;
  advance_type?: "efectivo" | "tarjeta" | null;
  advance_amount?: number | null;
  advance_approved_amount?: number | null;

  status: EstatusViaje;
  is_active: boolean;

  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;

  cancelled_at?: string | null;
  cancel_reason?: string | null;

  verification_status: EstatusVerificacion;
  verified_amount: number;

  // Relaciones
  user?: UsuarioViaje | null;
  approver?: UsuarioViaje | null;
  canceller?: UsuarioViaje | null;
  active_receipts?: TravelReceipt[];

  created_at?: string;
  updated_at?: string;
};

export type TravelRequestPayload = {
  request_type: TipoSolicitudViaje;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  reason: string;
  observations?: string;
  ncr_number?: string;
  // Viáticos
  hierarchy_level_id?: number;
  travel_country_id?: number;
  needs_flight?: boolean;
  departure_time?: string;
  return_time?: string;
  needs_advance?: boolean;
  advance_type?: "efectivo" | "tarjeta";
  advance_amount?: number;
  // Gastos
  estimated_amount?: number;
};

export type CalculoViaticoResponse = {
  days: number;
  amount: number;
  currency: string;
  daily: number;
};

// ─── Comprobantes ─────────────────────────────────────────────────────────────

export type EstatusComprobante = "pending" | "approved" | "rejected";

export type TravelReceipt = {
  id: number;
  travel_request_id: number;
  user_id: number;
  expense_category: string;
  provider?: string | null;
  amount: number;
  receipt_date: string;
  observations?: string | null;
  pdf_path?: string | null;
  xml_path?: string | null;
  status: EstatusComprobante;
  reviewed_at?: string | null;
  review_notes?: string | null;
  user?: UsuarioViaje | null;
  reviewer?: UsuarioViaje | null;
  created_at?: string;
};

export type TravelReceiptPayload = {
  expense_category: string;
  provider?: string;
  amount: number;
  receipt_date: string;
  observations?: string;
  pdf?: File;
  xml?: File;
};

// ─── Resumen dashboard ────────────────────────────────────────────────────────

export type ResumenViajes = {
  pendientes: number;
  aprobados_mes: number;
  por_comprobar: number;
  total_monto_mes: number;
};

// ─── Paginación ───────────────────────────────────────────────────────────────

export type PaginadoViajes = {
  data: TravelRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
