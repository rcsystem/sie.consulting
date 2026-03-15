import { ModulePage } from "./Shared";
export default function PositionsPage() {
  return <ModulePage title="Puestos" description="Catálogo de puestos y niveles de responsabilidad." columns={["Puesto","Área","Nivel","Estado"]} rows={[["Operador","Producción","Base","Activo"],["Analista RH","RH","Administrativo","Activo"],["Gerente de Operaciones","Operaciones","Gerencia","Activo"]]} />;
}
