export type Horario = {
  id: number;
  company_id: number;
  name: string;
  entry_time: string;
  exit_time: string;
  entry_tolerance_minutes: number | null;
  exit_tolerance_minutes: number | null;
  working_days: string[];
  description: string | null;
  is_active: boolean;
  users_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RespuestaPaginadaHorarios = {
  data: Horario[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type FormularioHorario = {
  name: string;
  entry_time: string;
  exit_time: string;
  entry_tolerance_minutes: string;
  exit_tolerance_minutes: string;
  working_days: string[];
  description: string;
  is_active: boolean;
};

export type ErrorImportacionHorario = {
  fila?: number | string;
  campo?: string;
  mensaje: string;
};

export type RespuestaImportacionHorario = {
  mensaje: string;
  resumen: {
    creados: number;
    actualizados: number;
    errores: number;
  };
  errores: ErrorImportacionHorario[];
};