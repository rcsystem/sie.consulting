export type Puesto = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  description: string | null;
  department_id: number;
  base_salary: number | null;
  is_active: boolean;
  department?: {
    id: number;
    name: string;
    code: string | null;
  } | null;
  users_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RespuestaPaginadaPuestos = {
  data: Puesto[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type FormularioPuesto = {
  name: string;
  code: string;
  description: string;
  department_id: string;
  base_salary: string;
  is_active: boolean;
};

export type ErrorImportacionPuesto = {
  fila?: number | string;
  campo?: string;
  mensaje: string;
};

export type RespuestaImportacionPuesto = {
  mensaje: string;
  resumen: {
    creados: number;
    actualizados: number;
    errores: number;
  };
  errores: ErrorImportacionPuesto[];
};