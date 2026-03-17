export interface CatalogoBase {
  id: number;
  name: string;
  code?: string | null;
}

export interface HorarioCatalogo {
  id: number;
  name: string;
  entry_time: string;
  exit_time: string;
}

export interface RolSistema {
  id: number;
  name: string;
}

export interface UsuarioSistema {
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
  role: string | null;
  roles: string[];
  department?: CatalogoBase | null;
  position?: CatalogoBase | null;
  schedule?: HorarioCatalogo | null;
  social_security_number: string;
social_security_number: string | null;
curp: string | null;
business_email: string | null;
personal_email: string | null;
operational_area: string | null;
cost_center: string | null;
contract_type: string | null;
hierarchy_level: string | null;
manager?: {
  id: number;
  full_name: string;
  email: string;
} | null;
director?: {
  id: number;
  full_name: string;
  email: string;
} | null;
}

export interface RespuestaPaginadaUsuarios {
  data: UsuarioSistema[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FormularioUsuario {
  employee_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  mobile_phone: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  hire_date: string;
  birth_date: string;
  department_id: string;
  position_id: string;
  schedule_id: string;
  is_active: boolean;
  role: string;
social_security_number: string;
curp: string;
business_email: string;
personal_email: string;
operational_area: string;
cost_center: string;
contract_type: string;
hierarchy_level: string;
manager_user_id: string;
director_user_id: string;
}
