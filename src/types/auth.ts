export interface DepartamentoUsuario {
  id: number;
  name: string;
  code: string | null;
}

export interface PuestoUsuario {
  id: number;
  name: string;
  code: string | null;
}

export interface HorarioUsuario {
  id: number;
  name: string;
  entry_time: string;
  exit_time: string;
  entry_tolerance_minutes: number;
  exit_tolerance_minutes: number;
}

export interface UsuarioAutenticado {
  id: number;
  employee_number: string | null;
  name: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  mobile_phone: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  hire_date: string | null;
  birth_date: string | null;
  is_active: boolean;
  department?: DepartamentoUsuario | null;
  position?: PuestoUsuario | null;
  schedule?: HorarioUsuario | null;
}

export interface RespuestaLogin {
  message: string;
  token: string;
  user: UsuarioAutenticado;
  role: string | null;
  roles: string[];
  permissions: string[];
}

export interface RespuestaMe {
  user: UsuarioAutenticado;
  role: string | null;
  roles: string[];
  permissions: string[];
}