import { ModulePage } from "./Shared";

export default function UsersPage() {
  return (
    <ModulePage
      title="Usuarios"
      description="Alta, baja, edición, cambio de departamento, puesto y datos laborales del personal."
      columns={["Empleado", "Correo", "Rol", "Departamento", "Puesto", "Estado"]}
      rows={[
        ["Rafael Cruz", "rcruz@sie.com.mx", "Sindicalizado", "Producción", "Operador", "Activo"],
        ["María López", "mlopez@sie.com.mx", "Administrativo", "Finanzas", "Analista", "Activo"],
        ["Ana Torres", "atorres@sie.com.mx", "RH", "Recursos Humanos", "Coordinadora RH", "Activo"],
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Datos personales y dirección del usuario",
          "Cambio de departamento, puesto y horario",
          "Importación masiva por Excel en siguiente fase",
        ].map((item) => (
          <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">{item}</div>
        ))}
      </div>
    </ModulePage>
  );
}
