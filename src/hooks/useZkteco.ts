import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  BiometricoZkteco,
  ComandoZkteco,
  EstadoComandoZkteco,
  RelojZkteco,
  RespuestaPaginada,
  UsuarioRelojZkteco,
} from "../types/zkteco";

type FiltrosComandos = {
  status?: EstadoComandoZkteco | "";
  device_id?: number | "";
  employee_pin?: string;
  page?: number;
};

type FiltrosUsuariosReloj = {
  search?: string;
  device_id?: number | "";
  employee_pin?: string;
  unlinked?: boolean;
  page?: number;
};

type FiltrosBiometricos = {
  employee_pin?: string;
  biometric_type?: string;
  page?: number;
};

function limpiarParametros(parametros: Record<string, unknown>) {
  const limpio: Record<string, string> = {};

  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === "") return;
    limpio[clave] = String(valor);
  });

  return limpio;
}

export function useRelojesZkteco() {
  return useQuery({
    queryKey: ["zkteco", "devices"],
    queryFn: async () => {
      const { data } = await api.get<{ data: RelojZkteco[] }>("/zkteco/devices");
      return data.data;
    },
  });
}

export function useComandosZkteco(filtros: FiltrosComandos) {
  return useQuery({
    queryKey: ["zkteco", "commands", filtros],
    queryFn: async () => {
      const { data } = await api.get<RespuestaPaginada<ComandoZkteco>>(
        "/zkteco/commands",
        {
          params: limpiarParametros({
            status: filtros.status,
            device_id: filtros.device_id,
            employee_pin: filtros.employee_pin,
            page: filtros.page ?? 1,
            per_page: 20,
          }),
        }
      );

      return data;
    },
  });
}

export function useUsuariosRelojZkteco(filtros: FiltrosUsuariosReloj) {
  return useQuery({
    queryKey: ["zkteco", "device-users", filtros],
    queryFn: async () => {
      const { data } = await api.get<RespuestaPaginada<UsuarioRelojZkteco>>(
        "/zkteco/device-users",
        {
          params: limpiarParametros({
            search: filtros.search,
            device_id: filtros.device_id,
            employee_pin: filtros.employee_pin,
            unlinked: filtros.unlinked ? 1 : undefined,
            page: filtros.page ?? 1,
            per_page: 20,
          }),
        }
      );

      return data;
    },
  });
}

export function useBiometricosZkteco(filtros: FiltrosBiometricos) {
  return useQuery({
    queryKey: ["zkteco", "biometrics", filtros],
    queryFn: async () => {
      const { data } = await api.get<RespuestaPaginada<BiometricoZkteco>>(
        "/zkteco/biometrics",
        {
          params: limpiarParametros({
            employee_pin: filtros.employee_pin,
            biometric_type: filtros.biometric_type,
            page: filtros.page ?? 1,
            per_page: 20,
          }),
        }
      );

      return data;
    },
  });
}

export function useConsultarUsuarioReloj() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deviceId,
      employeePin,
    }: {
      deviceId: number;
      employeePin: string;
    }) => {
      const { data } = await api.post(`/zkteco/devices/${deviceId}/query-user`, {
        employee_pin: employeePin,
      });

      return data;
    },
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ["zkteco"] });
    },
  });
}

export function useReintentarComandoZkteco() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: async (commandId: number) => {
      const { data } = await api.post(`/zkteco/commands/${commandId}/retry`);
      return data;
    },
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ["zkteco"] });
    },
  });
}

export function useCancelarComandoZkteco() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: async (commandId: number) => {
      const { data } = await api.post(`/zkteco/commands/${commandId}/cancel`);
      return data;
    },
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ["zkteco"] });
    },
  });
}

export function useEnviarUsuarioARelojesZkteco() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.post(`/zkteco/users/${userId}/send-to-devices`);
      return data;
    },
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ["zkteco"] });
    },
  });
}