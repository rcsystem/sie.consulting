import { ModulePage } from "./Shared";
export default function PermissionsPage() {
  return <ModulePage title="Permisos" description="Gestión de permisos de entrada, salida, personales y laborales." columns={["Folio","Empleado","Tipo","Motivo","Fecha","Estado"]} rows={[["PER-0012","Rafael Cruz","Entrada","Personal","14/03/2026","Pendiente"],["PER-0013","María López","Salida","Laboral","14/03/2026","Aprobado"],["PER-0014","Carlos Medina","Salida","Personal","15/03/2026","Pendiente"]]} />;
}
