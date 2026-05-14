import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  CatalogOption,
  RespuestaPaginadaSolicitudesPermiso,
  ResumenPermisos,
  SolicitudPermiso,
  SolicitudPermisoPayload,
} from "../types/permissionRequests";

// ─── Parámetros de filtro ─────────────────────────────────────────────────────

export interface FiltrosPermisos {
  search?: string;
  status?: string;
  employee_type?: string;
  request_kind?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  solo_mios?: boolean;
  page?: number;
  per_page?: number;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const permissionKeys = {
  all:     ["permission-requests"] as const,
  lists:   () => [...permissionKeys.all, "list"] as const,
  list:    (f: FiltrosPermisos) => [...permissionKeys.lists(), f] as const,
  summary: () => [...permissionKeys.all, "summary"] as const,
  pending: () => [...permissionKeys.all, "pending"] as const,
  detail:  (id: number) => [...permissionKeys.all, "detail", id] as const,
  users:   () => [...permissionKeys.all, "users-catalog"] as const,
};

// ─── Listado paginado ─────────────────────────────────────────────────────────

export function useSolicitudesPermiso(filtros: FiltrosPermisos) {
  return useQuery({
    queryKey: permissionKeys.list(filtros),
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page:          filtros.page     ?? 1,
        per_page:      filtros.per_page ?? 10,
        search:        filtros.search        || undefined,
        employee_type: filtros.employee_type || undefined,
        request_kind:  filtros.request_kind  || undefined,
        user_id:       filtros.user_id       || undefined,
        date_from:     filtros.date_from     || undefined,
        date_to:       filtros.date_to       || undefined,
        is_active:     true,
      };

      // "mis_permisos" es un pseudo-estado manejado con solo_mios
      if (filtros.status === "mis_permisos") {
        params.solo_mios = 1;
      } else if (filtros.status) {
        params.status = filtros.status;
      }

      if (filtros.solo_mios) {
        params.solo_mios = 1;
      }

      const { data } = await api.get<RespuestaPaginadaSolicitudesPermiso>(
        "/permission-requests",
        { params }
      );
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 20_000,
  });
}

// ─── Resumen de métricas ──────────────────────────────────────────────────────

export function useResumenPermisos() {
  return useQuery({
    queryKey: permissionKeys.summary(),
    queryFn: async () => {
      const { data } = await api.get<ResumenPermisos>("/permission-requests/summary");
      return data;
    },
    staleTime: 30_000,
  });
}

// ─── Catálogo de usuarios (para RH capturando para otros) ────────────────────

export function useUsuariosParaPermiso(habilitado: boolean) {
  return useQuery({
    queryKey: permissionKeys.users(),
    queryFn: async () => {
      const { data } = await api.get<{ data: CatalogOption[] }>("/users", {
        params: { per_page: 200 },
      });
      return data.data ?? [];
    },
    enabled: habilitado,
    staleTime: 5 * 60_000,
  });
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export function useCrearSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SolicitudPermisoPayload) =>
      api.post("/permission-requests", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.lists() });
      qc.invalidateQueries({ queryKey: permissionKeys.summary() });
    },
  });
}

export function useAprobarSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comments }: { id: number; comments?: string }) =>
      api.patch(`/permission-requests/${id}/approve`, { comments }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.lists() });
      qc.invalidateQueries({ queryKey: permissionKeys.summary() });
    },
  });
}

export function useAprobarDirector() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comments }: { id: number; comments?: string }) =>
      api.patch(`/permission-requests/${id}/approve-director`, { comments }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.lists() });
      qc.invalidateQueries({ queryKey: permissionKeys.summary() });
    },
  });
}

export function useRechazarSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejection_reason }: { id: number; rejection_reason: string }) =>
      api.patch(`/permission-requests/${id}/reject`, { rejection_reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.lists() });
      qc.invalidateQueries({ queryKey: permissionKeys.summary() });
    },
  });
}

export function useCancelarSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cancel_reason }: { id: number; cancel_reason: string }) =>
      api.patch(`/permission-requests/${id}/cancel`, { cancel_reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.lists() });
      qc.invalidateQueries({ queryKey: permissionKeys.summary() });
    },
  });
}

export function useEliminarSolicitud() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/permission-requests/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.lists() });
      qc.invalidateQueries({ queryKey: permissionKeys.summary() });
    },
  });
}
