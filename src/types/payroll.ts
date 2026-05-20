/**
 * Tipos TypeScript del módulo de Nómina México.
 * Mantener estos tipos sincronizados con los recursos JSON del backend.
 */

export type PayrollFrequency = "semanal" | "catorcenal" | "quincenal" | "mensual";
export type PayrollConceptType = "perception" | "deduction" | "other_payment";
export type PayrollConceptCalculationType = "manual" | "system_salary" | "system_absence" | "fixed_amount" | "percentage_of_salary";
export type PayrollRunStatus = "draft" | "generated" | "calculated" | "approved" | "closed" | "cancelled";

export interface PayrollSettings {
  id: number;
  uma_daily: string | number;
  minimum_wage_daily: string | number;
  minimum_wage_border_daily: string | number;
  default_frequency: PayrollFrequency;
  tax_calculation_mode: "manual" | "external" | "future_internal";
  discount_unjustified_absences: boolean;
  use_attendance_for_payroll: boolean;
  is_active: boolean;
}

/**
 * Concepto de nómina editable desde Zenda.
 *
 * Un concepto puede ser:
 * - Percepción: sueldo, bono, vales, prima, compensación.
 * - Deducción: falta, préstamo, ISR manual, IMSS manual.
 * - Otro pago: conceptos fiscales separados del salario.
 */
export interface PayrollConcept {
  id: number;
  code: string;
  name: string;
  type: PayrollConceptType;
  category?: string | null;
  sat_code?: string | null;
  sat_group?: string | null;
  taxable_isr: boolean;
  integrates_sbc: boolean;
  is_system: boolean;
  auto_apply: boolean;
  calculation_type: PayrollConceptCalculationType;
  default_amount?: string | number | null;
  default_percentage?: string | number | null;
  display_order: number;
  is_active: boolean;
}

/** Payload de alta/edición de conceptos. */
export type PayrollConceptPayload = Omit<PayrollConcept, "id" | "is_system"> & { id?: number };

export type PayrollEmployeeStatusFilter = "all" | "configured" | "unconfigured" | "active" | "incomplete";

export interface PayrollEmployeeStats {
  active_users: number;
  configured: number;
  unconfigured: number;
  active_payroll: number;
  missing_salary: number;
}

export interface PayrollEmployeeSetting {
  salary_monthly?: number | null;
  salary_daily?: number | null;
  integrated_daily_salary?: number | null;
  payment_frequency: PayrollFrequency;
  bank_name?: string | null;
  bank_account?: string | null;
  clabe?: string | null;
  imss_regime?: string | null;
  contract_type_sat?: string | null;
  workday_type_sat?: string | null;
  risk_class?: string | null;
  is_payroll_active: boolean;
}

export interface PayrollEmployeeRow {
  id: number;
  employee_number?: string | null;
  full_name: string;
  email?: string | null;
  department?: string | null;
  position?: string | null;
  position_base_salary?: number | null;
  payroll_setting?: PayrollEmployeeSetting | null;
}

export interface PayrollPeriod {
  id: number;
  name: string;
  frequency: PayrollFrequency;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: string;
  notes?: string | null;
}

export interface PayrollReceiptItem {
  id: number;
  concept_code: string;
  concept_name: string;
  type: PayrollConceptType;
  category?: string | null;
  quantity: number;
  unit_amount: number;
  amount: number;
  taxable_amount: number;
  exempt_amount: number;
}

export interface PayrollReceipt {
  id: number;
  user_id: number;
  employee_number?: string | null;
  employee_name: string;
  department_name?: string | null;
  position_name?: string | null;
  salary_daily: number;
  period_days: number;
  paid_days: number;
  absence_days: number;
  perceptions_total: number;
  deductions_total: number;
  other_payments_total: number;
  net_total: number;
  status: string;
  items?: PayrollReceiptItem[];
}

export interface PayrollRun {
  id: number;
  payroll_period_id: number;
  name: string;
  status: PayrollRunStatus;
  generated_at?: string | null;
  approved_at?: string | null;
  closed_at?: string | null;
  notes?: string | null;
  receipts_count?: number | null;
  period?: {
    id: number;
    name: string;
    period_start: string;
    period_end: string;
    payment_date: string;
  };
  totals?: {
    receipts: number;
    perceptions_total: number;
    deductions_total: number;
    other_payments_total: number;
    net_total: number;
  };
  receipts?: PayrollReceipt[];
}

export interface PayrollImportSummary {
  procesados: number;
  creados: number;
  actualizados: number;
  activados?: number;
  desactivados?: number;
  errores: number;
}

export interface PayrollImportError {
  fila: number;
  campo: string;
  mensaje: string;
}

export interface PayrollImportResult {
  message: string;
  summary: PayrollImportSummary;
  errors: PayrollImportError[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Solicitud para generar un calendario anual de periodos.
 * Se usa desde Nómina → Periodos para crear periodos normales sin capturarlos uno por uno.
 */
export interface PayrollPeriodGenerationRequest {
  year: number;
  frequency: PayrollFrequency;
  start_date?: string | null;
  status: "draft" | "open";
  payment_timing: "period_end" | "next_day";
  weekend_adjustment: "none" | "previous_business_day" | "next_business_day";
  overwrite: boolean;
}

/**
 * Respuesta del backend al generar periodos anuales.
 * El resumen permite mostrar a RH qué se creó y qué ya existía.
 */
export interface PayrollPeriodGenerationResult {
  message: string;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    blocked: number;
  };
  periods: PayrollPeriod[];
}
