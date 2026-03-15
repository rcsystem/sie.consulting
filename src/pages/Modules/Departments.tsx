import { ModulePage } from "./Shared";
export default function DepartmentsPage() {
  return <ModulePage title="Departamentos" description="Catálogo de departamentos para asignación de personal y autorizadores." columns={["Clave","Nombre","Director","Gerente","Estado"]} rows={[["RH","Recursos Humanos","Laura Díaz","Ana Torres","Activo"],["FIN","Finanzas","Jorge Núñez","María López","Activo"],["OPE","Operaciones","Carlos Medina","Luis Ponce","Activo"]]} />;
}
