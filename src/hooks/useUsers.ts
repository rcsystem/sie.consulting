import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  CatalogoBase,
  RespuestaPaginadaUsuarios,
  RolSistema,
  UsuarioSistema,
} from "../types/users";

// ─── Parámetros de filtro/paginación ─────────────────────────────────────────

export interface FiltrosUsuarios {
  search?: string;
  is_active?: string;
  role?: string;
  department_id?: string;
  page?: number;
  per_page?: number;
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filtros: FiltrosUsuarios) => [...userKeys.lists(), filtros] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
  roles: () => ["roles"] as const,
  catalogDepts: () => ["catalogs", "departments"] as const,
};

// ─── Listado paginado (ligero) ────────────────────────────────────────────────

export function useUsuarios(filtros: FiltrosUsuarios) {
  return useQuery({
    queryKey: userKeys.list(filtros),
    queryFn: async () => {
      const { data } = await api.get<RespuestaPaginadaUsuarios>("/users", {
        params: {
          search:        filtros.search        || undefined,
          is_active:     filtros.is_active     || undefined,
          role:          filtros.role          || undefined,
          department_id: filtros.department_id || undefined,
          page:          filtros.page          ?? 1,
          per_page:      filtros.per_page      ?? 10,
        },
      });
      return data;
    },
    // Mantiene datos anteriores visibles mientras llega la nueva página
    placeholderData: (prev) => prev,
    staleTime: 30_000, // 30 s — evita re-fetches innecesarios al volver a la página
  });
}

// ─── Detalle completo — solo cuando se abre el modal de edición ───────────────

export function useUsuarioDetalle(id: number | null) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: async () => {
      const { data } = await api.get<{ user: UsuarioSistema }>(`/users/${id}`);
      return data.user;
    },
    enabled: id !== null, // solo ejecuta si hay un id seleccionado
    staleTime: 60_000,    // 1 min — el detalle cambia con poca frecuencia
  });
}

// ─── Catálogos para los filtros ───────────────────────────────────────────────

export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: async () => {
      const { data } = await api.get<RolSistema[]>("/roles");
      return data;
    },
    staleTime: 5 * 60_000, // 5 min — los roles rara vez cambian
  });
}

export function useDepartamentosCatalogo() {
  return useQuery({
    queryKey: userKeys.catalogDepts(),
    queryFn: async () => {
      const { data } = await api.get<CatalogoBase[]>("/catalogs/departments");
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export function useToggleEstatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (usuarioId: number) =>
      api.patch(`/users/${usuarioId}/toggle-status`),
    // Invalida el listado para que se refresque con el nuevo estatus
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
