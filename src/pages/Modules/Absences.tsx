import { ModulePage } from "./Shared";
export default function AbsencesPage() {
  return <ModulePage title="Inasistencias" description="Registro y consulta de incidencias, retardos y ausencias." columns={["Empleado","Fecha","Tipo","Minutos","Registrado por"]} rows={[["Rafael Cruz","14/03/2026","Retardo","35","RH"],["Sandra León","14/03/2026","Justificada","480","RH"],["Pedro Ruiz","13/03/2026","Injustificada","480","Gerencia"]]} />;
}
