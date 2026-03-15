import { ModulePage } from "./Shared";
export default function SchedulesPage() {
  return <ModulePage title="Horarios" description="Configuración de entradas, salidas y ventanas de tolerancia." columns={["Horario","Entrada","Salida","Ventana entrada","Ventana salida"]} rows={[["General A","08:00","17:30","3 horas","3 horas"],["Administrativo","09:00","18:00","2 horas","2 horas"],["Nocturno","22:00","06:00","1 hora","1 hora"]]} />;
}
