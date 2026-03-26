type Props = {
  rol?: string | null;
};

type AccesoDirecto = {
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
};

export default function DashboardShortcuts({ rol }: Props) {
  const accesos = obtenerAccesosPorRol(rol);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Acciones rápidas
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Accesos más usados según tu perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accesos.map((acceso) => (
          <a
            key={acceso.ruta + acceso.titulo}
            href={acceso.ruta}
            className="group rounded-2xl border border-gray-200 bg-gray-50/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/30 dark:hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-xl dark:bg-brand-500/10">
                <span>{acceso.icono}</span>
              </div>

              <span className="text-sm text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-gray-600">
                →
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {acceso.titulo}
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                {acceso.descripcion}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function obtenerAccesosPorRol(rol?: string | null): AccesoDirecto[] {
  const rolNormalizado = (rol ?? "").toLowerCase();

  const porRol: Record<string, AccesoDirecto[]> = {
    super_admin: [
      { titulo: "Alta de usuario", descripcion: "Registrar nuevos usuarios en la plataforma.", ruta: "/usuarios", icono: "➕" },
      { titulo: "Importar usuarios", descripcion: "Cargar colaboradores desde archivo masivo.", ruta: "/importar-usuarios", icono: "📥" },
      { titulo: "Autorizar permisos", descripcion: "Revisar solicitudes pendientes de aprobación.", ruta: "/autorizaciones", icono: "✅" },
      { titulo: "Departamentos", descripcion: "Administrar áreas y estructura organizacional.", ruta: "/departamentos", icono: "🏢" },
      { titulo: "Puestos", descripcion: "Gestionar catálogo de puestos.", ruta: "/puestos", icono: "💼" },
      { titulo: "Configuración", descripcion: "Ajustar catálogos y parámetros generales.", ruta: "/configuracion", icono: "⚙️" },
    ],
    rh: [
      { titulo: "Alta de usuario", descripcion: "Registrar colaboradores nuevos.", ruta: "/usuarios", icono: "👤" },
      { titulo: "Autorizar permisos", descripcion: "Validar permisos e incidencias pendientes.", ruta: "/autorizaciones", icono: "✅" },
      { titulo: "Inasistencias", descripcion: "Revisar y gestionar inasistencias.", ruta: "/inasistencias", icono: "📌" },
      { titulo: "Horarios", descripcion: "Consultar y administrar horarios de trabajo.", ruta: "/horarios", icono: "🕒" },
      { titulo: "Calendario RH", descripcion: "Ver fechas clave, aniversarios y eventos.", ruta: "/calendar", icono: "📅" },
      { titulo: "Puestos", descripcion: "Mantener actualizado el catálogo de puestos.", ruta: "/puestos", icono: "💼" },
    ],
    director: [
      { titulo: "Autorizar permisos", descripcion: "Atender permisos pendientes de tu equipo.", ruta: "/autorizaciones", icono: "✅" },
      { titulo: "Permisos", descripcion: "Consultar solicitudes e historial del área.", ruta: "/permisos", icono: "📝" },
      { titulo: "Inasistencias", descripcion: "Dar seguimiento a incidencias del equipo.", ruta: "/inasistencias", icono: "📌" },
      { titulo: "Calendario", descripcion: "Ver eventos clave y fechas del mes.", ruta: "/calendar", icono: "📅" },
      { titulo: "Mi perfil", descripcion: "Actualizar tus datos personales.", ruta: "/mi-perfil", icono: "🙍" },
      { titulo: "Cambiar contraseña", descripcion: "Actualizar acceso de forma segura.", ruta: "/cambiar-contrasena", icono: "🔐" },
    ],
    manager: [
      { titulo: "Autorizar permisos", descripcion: "Resolver permisos pendientes del equipo.", ruta: "/autorizaciones", icono: "✅" },
      { titulo: "Permisos", descripcion: "Consultar solicitudes de colaboradores.", ruta: "/permisos", icono: "📝" },
      { titulo: "Inasistencias", descripcion: "Monitorear incidencias y ausencias.", ruta: "/inasistencias", icono: "📌" },
      { titulo: "Calendario", descripcion: "Revisar eventos y fechas relevantes.", ruta: "/calendar", icono: "📅" },
      { titulo: "Mi perfil", descripcion: "Gestionar información personal.", ruta: "/mi-perfil", icono: "🙍" },
      { titulo: "Cambiar contraseña", descripcion: "Mantener tu acceso actualizado.", ruta: "/cambiar-contrasena", icono: "🔐" },
    ],
    administrative: [
      { titulo: "Mis permisos", descripcion: "Crear y consultar permisos personales.", ruta: "/permisos", icono: "📝" },
      { titulo: "Mi calendario", descripcion: "Ver eventos y fechas relevantes.", ruta: "/calendar", icono: "📅" },
      { titulo: "Mi perfil", descripcion: "Consultar y actualizar mis datos.", ruta: "/mi-perfil", icono: "🙍" },
      { titulo: "Cambiar contraseña", descripcion: "Actualizar credenciales de acceso.", ruta: "/cambiar-contrasena", icono: "🔐" },
    ],
    unionized: [
      { titulo: "Mis permisos", descripcion: "Dar seguimiento a permisos y solicitudes.", ruta: "/permisos", icono: "📝" },
      { titulo: "Mi calendario", descripcion: "Consultar eventos importantes del mes.", ruta: "/calendar", icono: "📅" },
      { titulo: "Mi perfil", descripcion: "Ver información personal registrada.", ruta: "/mi-perfil", icono: "🙍" },
      { titulo: "Cambiar contraseña", descripcion: "Mantener protegida tu cuenta.", ruta: "/cambiar-contrasena", icono: "🔐" },
    ],
  };

  return porRol[rolNormalizado] ?? porRol.administrative;
}
