import { ModulePage } from "./Shared";
export default function ApprovalsPage() {
  return <ModulePage title="Autorizaciones" description="Bandeja de revisión para gerentes, directores y RH." columns={["Solicitud","Solicitante","Departamento","Autorizador","Prioridad","Estado"]} rows={[["PER-0012","Rafael Cruz","Producción","Carlos Medina","Alta","Pendiente"],["PER-0017","Iván Pérez","Finanzas","María López","Media","Pendiente"],["PER-0019","Lucía Mora","RH","Ana Torres","Alta","Pendiente"]]} />;
}
