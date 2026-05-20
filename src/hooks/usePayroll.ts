import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  Paginated,
  PayrollConcept,
  PayrollConceptPayload,
  PayrollEmployeeRow,
  PayrollEmployeeSetting,
  PayrollEmployeeStats,
  PayrollEmployeeStatusFilter,
  PayrollImportResult,
  PayrollPeriod,
  PayrollPeriodGenerationRequest,
  PayrollPeriodGenerationResult,
  PayrollRun,
  PayrollSettings,
} from "../types/payroll";

/** Query keys centralizadas para invalidar el módulo sin equivocarnos. */
export const payrollKeys = {
  all: ["payroll"] as const,
  settings: () => [...payrollKeys.all, "settings"] as const,
  concepts: () => [...payrollKeys.all, "concepts"] as const,
  employees: (search: string, status: PayrollEmployeeStatusFilter) => [...payrollKeys.all, "employees", search, status] as const,
  employeeStats: () => [...payrollKeys.all, "employee-stats"] as const,
  periods: () => [...payrollKeys.all, "periods"] as const,
  runs: () => [...payrollKeys.all, "runs"] as const,
  run: (id: number) => [...payrollKeys.all, "run", id] as const,
};

export function usePayrollSettings() {
  return useQuery({
    queryKey: payrollKeys.settings(),
    queryFn: async () => {
      const { data } = await api.get<{ settings: PayrollSettings }>("/payroll/settings");
      return data.settings;
    },
  });
}

export function useActualizarPayrollSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PayrollSettings>) => api.put("/payroll/settings", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.settings() }),
  });
}

export function usePayrollConcepts() {
  return useQuery({
    queryKey: payrollKeys.concepts(),
    queryFn: async () => {
      const { data } = await api.get<{ data: PayrollConcept[] }>("/payroll/concepts");
      return data.data;
    },
  });
}

/**
 * Crea o actualiza un concepto de nómina.
 *
 * Si el payload trae id, actualiza. Si no trae id, crea un concepto nuevo.
 * El backend valida que el código sea único dentro de la empresa actual.
 */
export function useGuardarPayrollConcept() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayrollConceptPayload) => {
      if (payload.id) {
        return api.put(`/payroll/concepts/${payload.id}`, payload).then((r) => r.data);
      }
      return api.post("/payroll/concepts", payload).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.concepts() }),
  });
}

/**
 * Activa o desactiva un concepto.
 * Los conceptos automáticos críticos no se pueden desactivar en backend.
 */
export function useTogglePayrollConcept() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/payroll/concepts/${id}/toggle-status`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.concepts() }),
  });
}

/**
 * Descarga la plantilla Excel para edición/carga masiva de conceptos de nómina.
 * La plantilla incluye conceptos existentes para poder editarlos y nuevas filas para agregar más.
 */
export async function descargarPlantillaPayrollConcepts() {
  const response = await api.get('/payroll/concepts/import/template', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'plantilla_conceptos_nomina.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Importa conceptos desde Excel.
 * El backend actualiza por código y crea conceptos nuevos si el código no existe.
 */
export function useImportarPayrollConcepts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (archivo: File) => {
      const formData = new FormData();
      formData.append('archivo', archivo);
      return api.post('/payroll/concepts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.concepts() }),
  });
}

/**
 * Obtiene empleados activos de Zenda con su configuración de nómina.
 * El filtro status permite distinguir configurados, sin configurar, activos o incompletos.
 */
export function usePayrollEmployees(search: string, status: PayrollEmployeeStatusFilter = "all") {
  return useQuery({
    queryKey: payrollKeys.employees(search, status),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PayrollEmployeeRow>>("/payroll/employee-settings", {
        params: { search: search || undefined, payroll_status: status, per_page: 200 },
      });
      return data;
    },
  });
}

/**
 * Obtiene métricas rápidas para saber qué tan lista está la nómina de la empresa actual.
 */
export function usePayrollEmployeeStats() {
  return useQuery({
    queryKey: payrollKeys.employeeStats(),
    queryFn: async () => {
      const { data } = await api.get<{ stats: PayrollEmployeeStats }>("/payroll/employee-settings/stats");
      return data.stats;
    },
  });
}

/**
 * Crea registros de nómina para usuarios activos que todavía no están preparados.
 */
export function usePrepararPayrollEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { activate_with_salary: boolean }) =>
      api.post("/payroll/employee-settings/sync-active-users", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.all }),
  });
}



/**
 * Descarga la plantilla oficial para carga masiva de empleados de nómina.
 *
 * La respuesta se pide como blob porque Laravel devuelve un archivo XLSX.
 * El navegador crea un enlace temporal para descargarlo sin cambiar de página.
 */
export async function descargarPlantillaPayrollEmployees() {
  const response = await api.get('/payroll/employee-settings/import/template', {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'plantilla_empleados_nomina.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Sube un archivo Excel para crear/actualizar configuración de nómina por empleado.
 *
 * El backend no crea usuarios nuevos; solo relaciona por numero_empleado de usuarios existentes.
 */
export function useImportarPayrollEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (archivo: File) => {
      const formData = new FormData();
      formData.append('archivo', archivo);
      return api.post<PayrollImportResult>('/payroll/employee-settings/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.all }),
  });
}

export function useActualizarPayrollEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: PayrollEmployeeSetting }) =>
      api.put(`/payroll/employee-settings/${userId}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.all }),
  });
}

/**
 * Activa o desactiva un empleado para que entre o salga de futuras corridas.
 */
export function useActivarPayrollEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      api.patch(`/payroll/employee-settings/${userId}/toggle-active`, { is_payroll_active: isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.all }),
  });
}

export function usePayrollPeriods() {
  return useQuery({
    queryKey: payrollKeys.periods(),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PayrollPeriod>>("/payroll/periods", { params: { per_page: 50 } });
      return data;
    },
  });
}

export function useCrearPayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PayrollPeriod>) => api.post("/payroll/periods", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.periods() }),
  });
}

/**
 * Genera periodos de nómina de todo un año con reglas sencillas.
 *
 * La operación es segura: el backend no borra periodos existentes.
 * Si encuentra rangos ya creados, los omite o los actualiza solo si overwrite=true.
 */
export function useGenerarPayrollPeriodsYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayrollPeriodGenerationRequest) =>
      api.post<PayrollPeriodGenerationResult>("/payroll/periods/generate-year", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.periods() }),
  });
}

export function usePayrollRuns() {
  return useQuery({
    queryKey: payrollKeys.runs(),
    queryFn: async () => {
      const { data } = await api.get<Paginated<PayrollRun>>("/payroll/runs", { params: { per_page: 50 } });
      return data;
    },
  });
}

export function usePayrollRun(id?: number) {
  return useQuery({
    queryKey: payrollKeys.run(id ?? 0),
    queryFn: async () => {
      const { data } = await api.get<{ run: PayrollRun }>(`/payroll/runs/${id}`);
      return data.run;
    },
    enabled: Boolean(id),
  });
}

export function useCrearPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { payroll_period_id: number; name?: string; notes?: string }) =>
      api.post("/payroll/runs", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.runs() }),
  });
}

export function useGenerarPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/payroll/runs/${id}/generate`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.runs() });
      qc.invalidateQueries({ queryKey: payrollKeys.run(id) });
    },
  });
}

export function useAprobarPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/payroll/runs/${id}/approve`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.runs() });
      qc.invalidateQueries({ queryKey: payrollKeys.run(id) });
    },
  });
}

export function useCerrarPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/payroll/runs/${id}/close`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.runs() });
      qc.invalidateQueries({ queryKey: payrollKeys.run(id) });
    },
  });
}
