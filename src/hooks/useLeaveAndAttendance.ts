import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  FiltrosAsistencia,
  FiltrosVacaciones,
  LeaveRequest,
  LeaveRequestPayload,
  MiAsistenciaResponse,
  PaginadoAsistencia,
  PaginadoVacaciones,
  ResumenAsistencia,
  ResumenVacaciones,
  VacationBalanceResponse,
} from "../types/leaveAndAttendance";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const leaveKeys = {
  all:     ["leave-requests"] as const,
  lists:   () => [...leaveKeys.all, "list"] as const,
  list:    (f: FiltrosVacaciones) => [...leaveKeys.lists(), f] as const,
  mine:    () => [...leaveKeys.all, "mine"] as const,
  summary: () => [...leaveKeys.all, "summary"] as const,
  balance: (userId?: number, year?: number) => [...leaveKeys.all, "balance", userId, year] as const,
};

export const attendanceKeys = {
  all:     ["attendance"] as const,
  lists:   () => [...attendanceKeys.all, "list"] as const,
  list:    (f: FiltrosAsistencia) => [...attendanceKeys.lists(), f] as const,
  mine:    (month: number, year: number) => [...attendanceKeys.all, "mine", month, year] as const,
  summary: (month: number, year: number) => [...attendanceKeys.all, "summary", month, year] as const,
  devices: () => [...attendanceKeys.all, "devices"] as const,
};

// ─── VACACIONES ───────────────────────────────────────────────────────────────

export function useLeaveRequests(filtros: FiltrosVacaciones) {
  return useQuery({
    queryKey: leaveKeys.list(filtros),
    queryFn: async () => {
      const { data } = await api.get<PaginadoVacaciones>("/leave-requests", {
        params: {
          page:       filtros.page      ?? 1,
          per_page:   filtros.per_page  ?? 10,
          search:     filtros.search       || undefined,
          status:     filtros.status       || undefined,
          leave_type: filtros.leave_type   || undefined,
          date_from:  filtros.date_from    || undefined,
          date_to:    filtros.date_to      || undefined,
          solo_mios:  filtros.solo_mios ? 1 : undefined,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 20_000,
  });
}

export function useMisVacaciones(filtros: { page?: number; per_page?: number } = {}) {
  return useQuery({
    queryKey: leaveKeys.mine(),
    queryFn: async () => {
      const { data } = await api.get<PaginadoVacaciones>("/leave-requests/mine", {
        params: { page: filtros.page ?? 1, per_page: filtros.per_page ?? 20 },
      });
      return data;
    },
    staleTime: 20_000,
  });
}

export function useResumenVacaciones() {
  return useQuery({
    queryKey: leaveKeys.summary(),
    queryFn: async () => {
      const { data } = await api.get<ResumenVacaciones>("/leave-requests/summary");
      return data;
    },
    staleTime: 30_000,
  });
}

export function useSaldoVacaciones(userId?: number, year?: number) {
  const yearActual = year ?? new Date().getFullYear();

  return useQuery({
    queryKey: leaveKeys.balance(userId, yearActual),
    queryFn: async () => {
      const { data } = await api.get<VacationBalanceResponse>("/leave-requests/balance", {
        params: {
          year:    yearActual,
          user_id: userId || undefined,
        },
      });
      return data;
    },
    staleTime: 60_000,
  });
}

// ── Mutaciones vacaciones ──────────────────────────────────────────────────────

export function useCrearVacacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveRequestPayload) =>
      api.post<{ message: string; leave_request: LeaveRequest }>("/leave-requests", payload)
         .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.lists() });
      qc.invalidateQueries({ queryKey: leaveKeys.mine() });
      qc.invalidateQueries({ queryKey: leaveKeys.summary() });
      qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useAprobarVacacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.patch(`/leave-requests/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.lists() });
      qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useRechazarVacacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejection_reason }: { id: number; rejection_reason: string }) =>
      api.patch(`/leave-requests/${id}/reject`, { rejection_reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.lists() }),
  });
}

export function useCancelarVacacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancel_reason }: { id: number; cancel_reason: string }) =>
      api.patch(`/leave-requests/${id}/cancel`, { cancel_reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.lists() });
      qc.invalidateQueries({ queryKey: leaveKeys.mine() });
    },
  });
}

// ─── ASISTENCIA ────────────────────────────────────────────────────────────────

export function useAttendanceRecords(filtros: FiltrosAsistencia) {
  return useQuery({
    queryKey: attendanceKeys.list(filtros),
    queryFn: async () => {
      const { data } = await api.get<PaginadoAsistencia>("/attendance", {
        params: {
          page:      filtros.page      ?? 1,
          per_page:  filtros.per_page  ?? 30,
          user_id:   filtros.user_id   || undefined,
          date_from: filtros.date_from || undefined,
          date_to:   filtros.date_to   || undefined,
          status:    filtros.status    || undefined,
          month:     filtros.month     || undefined,
          year:      filtros.year      || undefined,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useMiAsistencia(month: number, year: number) {
  return useQuery({
    queryKey: attendanceKeys.mine(month, year),
    queryFn: async () => {
      const { data } = await api.get<MiAsistenciaResponse>("/attendance/mine", {
        params: { month, year },
      });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useResumenAsistencia(month: number, year: number) {
  return useQuery({
    queryKey: attendanceKeys.summary(month, year),
    queryFn: async () => {
      const { data } = await api.get<ResumenAsistencia>("/attendance/summary", {
        params: { month, year },
      });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useZktecoDevices() {
  return useQuery({
    queryKey: attendanceKeys.devices(),
    queryFn: async () => {
      const { data } = await api.get<{ data: import("../types/leaveAndAttendance").ZktecoDevice[] }>(
        "/attendance/devices"
      );
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}
