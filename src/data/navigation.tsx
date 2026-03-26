import type { ReactNode } from "react";
import {
  CalenderIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";

export type RolSistema =
  | "super_admin"
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
        name: "Permisos",
        path: "/permisos",
      },
      {
        name: "Inasistencias",
        path: "/inasistencias",
        roles: ["super_admin", "rh", "director", "manager"],
      },
    ],
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