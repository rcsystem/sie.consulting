export type EstadoComandoZkteco =
  | "pending"
  | "sent"
  | "executed"
  | "failed"
  | "cancelled";

export type RelojZkteco = {
  id: number;
  company_id: number;
  name: string | null;
  serial_number: string;
  last_ip: string | null;
  last_seen_at: string | null;
  is_active: boolean;
  pending_commands_count: number;
  failed_commands_count: number;
  device_users_count: number;
  biometrics_count: number;
};

export type ComandoZkteco = {
  id: number;
  company_id: number;
  device_id: number;
  source_device_id?: number | null;
  employee_pin: string | null;
  sync_hash?: string | null;
  command_type: string;
  command_text: string;
  status: EstadoComandoZkteco;
  attempts: number;
  sent_at: string | null;
  executed_at: string | null;
  response_text: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  device_name?: string | null;
  device_serial?: string | null;
};

export type UsuarioRelojZkteco = {
  id: number;
  company_id: number;
  device_id: number;
  user_id: number | null;
  employee_pin: string;
  name_from_device: string | null;
  card_number: string | null;
  privilege: string | null;
  raw_payload: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  device_name?: string | null;
  device_serial?: string | null;
  user_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  employee_number?: string | null;
  email?: string | null;
};

export type BiometricoZkteco = {
  id: number;
  company_id: number;
  source_device_id: number | null;
  user_id: number | null;
  employee_pin: string;
  biometric_type: string;
  template_index: string | null;
  template_size: number | null;
  is_valid: boolean;
  template_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  source_device_name?: string | null;
  source_device_serial?: string | null;
  user_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  employee_number?: string | null;
  email?: string | null;
};

export type RespuestaPaginada<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};