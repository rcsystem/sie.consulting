import { Link } from "react-router";
import { traducirRol } from "../../utils/roles";

type Props = {
  rol?: string | null;
};

type Shortcut = {
  title: string;
  path: string;
  roles: string[];
};

const accesos: Shortcut[] = [
  { title: "Mis permisos", path: "/permisos", roles: ["super_admin", "rh", "director", "manager", "administrative", "unionized"] },
  { title: "Autorizaciones", path: "/autorizaciones", roles: ["super_admin", "rh", "director", "manager"] },
  { title: "Inasistencias", path: "/inasistencias", roles: ["super_admin", "rh", "director", "manager"] },
  { title: "Usuarios", path: "/usuarios", roles: ["super_admin", "rh"] },
  { title: "Departamentos", path: "/departamentos", roles: ["super_admin", "rh"] },
  { title: "Puestos", path: "/puestos", roles: ["super_admin", "rh"] },
  { title: "Horarios", path: "/horarios", roles: ["super_admin", "rh"] },
  { title: "Importación usuarios", path: "/importar-usuarios", roles: ["super_admin", "rh"] },
  { title: "Mi perfil", path: "/mi-perfil", roles: ["super_admin", "rh", "director", "manager", "administrative", "unionized"] },
  { title: "Cambiar contraseña", path: "/cambiar-contrasena", roles: ["super_admin", "rh", "director", "manager", "administrative", "unionized"] },
];

export default function DashboardShortcuts({ rol }: Props) {
  const items = accesos.filter((item) => item.roles.includes(rol ?? ""));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Accesos rápidos
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Opciones disponibles para el rol {traducirRol(rol)}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-xl border border-gray-200 px-4 py-4 text-sm font-medium text-gray-700 transition hover:border-brand-400 hover:bg-brand-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  );
}