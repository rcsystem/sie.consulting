export type Departamento = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  parent?: {
    id: number;
    name: string;
    code: string | null;
  } | null;
  positions_count?: number;
  users_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RespuestaPaginadaDepartamentos = {
  data: Departamento[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type FormularioDepartamento = {
  name: string;
  code: string;
  description: string;
  parent_id: string;
  is_active: boolean;
};

export type ErrorImportacionDepartamento = {
  fila?: number | string;
  campo?: string;
  mensaje: string;
};

export type RespuestaImportacionDepartamento = {
  mensaje: string;
  resumen: {
    creados: number;
    actualizados: number;
    errores: number;
  };
  errores: ErrorImportacionDepartamento[];
};