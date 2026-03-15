import { ModulePage } from "./Shared";
export default function ImportUsersPage() {
  return (
    <ModulePage title="Carga Excel" description="Carga masiva de usuarios con datos personales, laborales, departamento y puesto.">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.03]">
        <p className="text-base font-semibold text-gray-800 dark:text-white">Arrastra tu archivo Excel aquí</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Columnas sugeridas: nombre, correo, número de empleado, rol, departamento, puesto, dirección y horario.</p>
      </div>
    </ModulePage>
  );
}
