import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  CalculoViaticoResponse,
  PaginadoViajes,
  ResumenViajes,
  TravelCatalogs,
  TravelReceiptPayload,
  TravelRequest,
  TravelRequestPayload,
} from "../types/travels";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const travelKeys = {
  all:      ["travel-requests"] as const,
  lists:    () => [...travelKeys.all, "list"] as const,
  list:     (f: object) => [...travelKeys.lists(), f] as const,
  mine:     () => [...travelKeys.all, "mine"] as const,
  detail:   (id: number) => [...travelKeys.all, "detail", id] as const,
  summary:  () => [...travelKeys.all, "summary"] as const,
  catalogs: () => [...travelKeys.all, "catalogs"] as const,
  receipts: (id: number) => [...travelKeys.all, "receipts", id] as const,
};

// ─── Filtros ──────────────────────────────────────────────────────────────────

export interface FiltrosViajes {
  search?: string;
  status?: string;
  request_type?: string;
  date_from?: string;
  date_to?: string;
  solo_mios?: boolean;
  page?: number;
  per_page?: number;
}

// ─── Listado ──────────────────────────────────────────────────────────────────

export function useTravelRequests(filtros: FiltrosViajes) {
  return useQuery({
    queryKey: travelKeys.list(filtros),
    queryFn: async () => {
      const { data } = await api.get<PaginadoViajes>("/travel-requests", {
        params: {
          page:         filtros.page      ?? 1,
          per_page:     filtros.per_page  ?? 10,
          search:       filtros.search       || undefined,
          status:       filtros.status       || undefined,
          request_type: filtros.request_type || undefined,
          date_from:    filtros.date_from    || undefined,
          date_to:      filtros.date_to      || undefined,
          solo_mios:    filtros.solo_mios    ? 1 : undefined,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 20_000,
  });
}

// ─── Catálogos (jerarquías + países) ─────────────────────────────────────────

export function useTravelCatalogs() {
  return useQuery({
    queryKey: travelKeys.catalogs(),
    queryFn: async () => {
      const { data } = await api.get<TravelCatalogs>("/travel-requests/catalogs");
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

export function useTravelSummary() {
  return useQuery({
    queryKey: travelKeys.summary(),
    queryFn: async () => {
      const { data } = await api.get<ResumenViajes>("/travel-requests/summary");
      return data;
    },
    staleTime: 30_000,
  });
}

// ─── Calcular presupuesto (on demand) ────────────────────────────────────────

export function useCalcularViatico() {
  return useMutation({
    mutationFn: async (params: {
      hierarchy_level_id: number;
      travel_country_id: number;
      start_date: string;
      end_date: string;
    }) => {
      const { data } = await api.post<CalculoViaticoResponse>(
        "/travel-requests/calculate",
        params
      );
      return data;
    },
  });
}

// ─── Comprobantes ─────────────────────────────────────────────────────────────

export function useTravelReceipts(travelRequestId: number | null) {
  return useQuery({
    queryKey: travelKeys.receipts(travelRequestId!),
    queryFn: async () => {
      const { data } = await api.get(
        `/travel-requests/${travelRequestId}/receipts`
      );
      return data.receipts ?? [];
    },
    enabled: travelRequestId !== null,
    staleTime: 30_000,
  });
}

// ─── Mutaciones solicitudes ───────────────────────────────────────────────────

export function useCrearViaje() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: TravelRequestPayload) =>
      api.post("/travel-requests", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.lists() });
      qc.invalidateQueries({ queryKey: travelKeys.summary() });
    },
  });
}

export function useAprobarViaje() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      approved_amount,
      advance_approved_amount,
    }: {
      id: number;
      approved_amount?: number;
      advance_approved_amount?: number;
    }) =>
      api.patch(`/travel-requests/${id}/approve`, {
        approved_amount,
        advance_approved_amount,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.lists() });
      qc.invalidateQueries({ queryKey: travelKeys.summary() });
    },
  });
}

export function useRechazarViaje() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejection_reason }: { id: number; rejection_reason: string }) =>
      api.patch(`/travel-requests/${id}/reject`, { rejection_reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.lists() });
      qc.invalidateQueries({ queryKey: travelKeys.summary() });
    },
  });
}

export function useCancelarViaje() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cancel_reason }: { id: number; cancel_reason: string }) =>
      api.patch(`/travel-requests/${id}/cancel`, { cancel_reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.lists() });
      qc.invalidateQueries({ queryKey: travelKeys.summary() });
    },
  });
}

// ─── Mutaciones comprobantes ──────────────────────────────────────────────────

export function useSubirComprobante(travelRequestId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: TravelReceiptPayload) => {
      const form = new FormData();
      form.append("expense_category", payload.expense_category);
      form.append("amount", String(payload.amount));
      form.append("receipt_date", payload.receipt_date);
      if (payload.provider)    form.append("provider", payload.provider);
      if (payload.observations) form.append("observations", payload.observations);
      if (payload.pdf)          form.append("pdf", payload.pdf);
      if (payload.xml)          form.append("xml", payload.xml);

      return api.post(
        `/travel-requests/${travelRequestId}/receipts`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      ).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.receipts(travelRequestId) });
      qc.invalidateQueries({ queryKey: travelKeys.lists() });
    },
  });
}

export function useRevisarComprobante(travelRequestId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      receiptId,
      accion,
      review_notes,
    }: {
      receiptId: number;
      accion: "approve" | "reject";
      review_notes?: string;
    }) =>
      api.patch(
        `/travel-requests/${travelRequestId}/receipts/${receiptId}/${accion}`,
        { review_notes }
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.receipts(travelRequestId) });
      qc.invalidateQueries({ queryKey: travelKeys.lists() });
      qc.invalidateQueries({ queryKey: travelKeys.summary() });
    },
  });
}
