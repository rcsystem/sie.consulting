import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/useAuthStore";
import { traducirRol } from "../../utils/roles";

export default function MyProfilePage() {
  const usuario = useAuthStore((state) => state.usuario);
  const rol = useAuthStore((state) => state.rol);

  const inicial = usuario?.full_name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <>
      <PageMeta
        title="Mi perfil | SIE RH"
        description="Perfil del usuario autenticado"
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
            {inicial}
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            {usuario?.full_name ?? "Usuario"}
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {usuario?.email ?? "Sin correo"}
          </p>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información laboral
          </h2>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Rol</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white capitalize">
                {traducirRol(rol)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Departamento
              </dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {usuario?.department?.name ?? "Sin departamento"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Puesto
              </dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {usuario?.position?.name ?? "Sin puesto"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Dirección
              </dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {usuario?.address ?? "Pendiente de captura"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Número de empleado
              </dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {usuario?.employee_number ?? "Sin número"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Horario
              </dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {usuario?.schedule?.name ?? "Sin horario"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}