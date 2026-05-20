import type { ReactNode } from "react";
import {
  CalenderIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  DollarLineIcon,
  TableIcon,
  TimeIcon,
  UserCircleIcon,
} from "../icons";

export type RolSistema =
  | "super_admin"
  | "admin"
  | "rh"
  | "director"
  | "manager"
  | "administrative"
  | "unionized";

export type SubItemNavegacion = {
  name: string;
  path: string;
  roles?: RolSistema[];
};

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  roles?: RolSistema[];
  subItems?: SubItemNavegacion[];
};

export const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Resumen RH", path: "/" }],
  },
  {
    icon: <PageIcon />,
    name: "Permisos",
    subItems: [
      {
        name: "Mis permisos",
        path: "/mis-permisos",
      },
      {
        name: "Autorizar permisos",
        path: "/autorizar-permisos",
        roles: ["super_admin", "admin", "rh", "manager", "director"],
      },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Vacaciones",
    subItems: [
      {
        name: "Mis vacaciones",
        path: "/vacaciones",
      },
      {
        name: "Autorizar vacaciones",
        path: "/vacaciones",
        roles: ["super_admin", "admin", "rh", "manager", "director"],
      },
    ],
  },
  {
    icon: <TimeIcon />,
    name: "Asistencia",
    path: "/asistencia",
    roles: ["super_admin", "admin", "rh", "manager", "director"],
  },
  {
    icon: <UserCircleIcon />,
    name: "Personal",
    subItems: [
      { name: "Usuarios", path: "/usuarios", roles: ["super_admin", "rh"] },
      {
        name: "Departamentos",
        path: "/departamentos",
        roles: ["super_admin", "rh"],
      },
      { name: "Puestos", path: "/puestos", roles: ["super_admin", "rh"] },
      { name: "Horarios", path: "/horarios", roles: ["super_admin", "rh"] },
      {
        name: "Carga Excel",
        path: "/importar-usuarios",
        roles: ["super_admin", "rh"],
      },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Viaticos & Gastos",
    path: "/travels",
    roles: ["super_admin", "rh", "director", "manager"],
  },

  {
    icon: <DollarLineIcon />,
    name: "Nómina",
    path: "/nomina",
    roles: ["super_admin", "admin", "rh"],
  },
  {
    icon: <TableIcon />,
    name: "Mi cuenta",
    subItems: [
      { name: "Mi perfil", path: "/mi-perfil" },
      { name: "Cambiar contraseña", path: "/cambiar-contrasena" },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Configuración",
    subItems: [
      {
        name: "Reglas del sistema",
        path: "/configuracion",
        roles: ["super_admin", "rh"],
      },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendario",
    path: "/calendar",
    roles: ["super_admin", "rh", "director", "manager"],
  },
  {
    icon: <CalenderIcon />,
    name: "Política de vacaciones",
    path: "/politica-vacaciones",
    roles: ["super_admin", "rh"],
  },
];

export const filtrarMenuPorRol = (
  items: NavItem[],
  rol: RolSistema,
): NavItem[] =>
  items
    .filter((item) => !item.roles || item.roles.includes(rol))
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter(
        (subItem) => !subItem.roles || subItem.roles.includes(rol),
      ),
    }))
    .filter((item) => (item.subItems ? item.subItems.length > 0 : true));
