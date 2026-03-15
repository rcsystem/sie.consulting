import { ModulePage } from "./Shared";
export default function SettingsPage() {
  return <ModulePage title="Reglas del sistema" description="Configuración global de permisos, anticipación y validaciones especiales." columns={["Parámetro","Valor actual","Descripción"]} rows={[["Horas máximas entrada personal","3","Ventana posterior a la hora de entrada"],["Horas máximas salida personal","3","Ventana previa a la hora de salida"],["Máximo anticipación sindicalizado","15 días","No permite exceder el límite"],["Permiso excepcional sin pago","1","Un permiso pendiente por usuario"]]} />;
}
