/**
 * PayrollPage
 *
 * Pantalla principal del módulo de nómina México.
 *
 * Decisión de diseño:
 * Se deja en una sola página con pestañas para que el MVP sea fácil de probar.
 * Más adelante se puede separar en páginas: Configuración, Empleados, Conceptos, Periodos y Corridas.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import {
  descargarPlantillaPayrollConcepts,
  descargarPlantillaPayrollEmployees,
  useActivarPayrollEmployee,
  useAprobarPayrollRun,
  useActualizarPayrollEmployee,
  useActualizarPayrollSettings,
  useCerrarPayrollRun,
  useCrearPayrollPeriod,
  useCrearPayrollRun,
  useGenerarPayrollPeriodsYear,
  useGenerarPayrollRun,
  useImportarPayrollConcepts,
  useImportarPayrollEmployees,
  useGuardarPayrollConcept,
  usePayrollConcepts,
  usePayrollEmployeeStats,
  usePayrollEmployees,
  usePayrollPeriods,
  usePayrollRun,
  usePayrollRuns,
  usePayrollSettings,
  usePrepararPayrollEmployees,
  useTogglePayrollConcept,
} from "../../hooks/usePayroll";
import type { PayrollConcept, PayrollConceptCalculationType, PayrollConceptPayload, PayrollConceptType, PayrollEmployeeRow, PayrollEmployeeSetting, PayrollEmployeeStatusFilter, PayrollFrequency, PayrollPeriod, PayrollPeriodGenerationRequest } from "../../types/payroll";

type Tab = "resumen" | "empleados" | "conceptos" | "periodos" | "corridas" | "config";

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value ?? 0));

/**
 * Escapa valores que se insertan dentro de HTML de SweetAlert.
 * Esto evita romper el modal si un nombre contiene comillas o caracteres especiales.
 */
const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


/** Etiquetas amigables para selects técnicos del módulo de nómina. */
const optionLabel = (value: string): string => ({
  semanal: "Semanal",
  catorcenal: "Catorcenal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  manual: "Manual",
  external: "Externo",
  future_internal: "Interno futuro",
  open: "Abierto",
  draft: "Borrador",
  period_end: "Al cierre del periodo",
  next_day: "Día siguiente al cierre",
  previous_business_day: "Mover al día hábil anterior",
  next_business_day: "Mover al día hábil siguiente",
  none: "No ajustar",
  perception: "Percepción",
  deduction: "Deducción",
  other_payment: "Otro pago",
  system_salary: "Sueldo automático",
  system_absence: "Falta automática",
  fixed_amount: "Monto fijo",
  percentage_of_salary: "% del salario",
}[value] ?? value);

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  open: "Abierto",
  generated: "Generado",
  calculated: "Calculado",
  approved: "Aprobado",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

/**
 * Estado local del drawer de edición de empleados de nómina.
 *
 * Por qué usamos strings en los inputs:
 * - Los inputs HTML entregan texto, incluso cuando type="number".
 * - Mantener texto evita que React convierta campos vacíos a 0 por accidente.
 * - Al guardar se normaliza a number|null antes de enviar al backend.
 */
type PayrollEmployeeFormState = {
  salary_monthly: string;
  salary_daily: string;
  integrated_daily_salary: string;
  payment_frequency: PayrollEmployeeSetting["payment_frequency"];
  bank_name: string;
  bank_account: string;
  clabe: string;
  imss_regime: string;
  contract_type_sat: string;
  workday_type_sat: string;
  risk_class: string;
  is_payroll_active: boolean;
};

const valorInput = (value: unknown): string => value === null || value === undefined ? "" : String(value);

const numeroONulo = (value: string): number | null => {
  const limpio = value.trim();
  if (limpio === "") return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
};

/**
 * Construye el estado inicial del drawer a partir de una fila de empleado.
 * Si el empleado todavía no tiene configuración, se propone el salario base del puesto.
 */
const formularioDesdeEmpleado = (empleado?: PayrollEmployeeRow | null): PayrollEmployeeFormState => ({
  salary_monthly: valorInput(empleado?.payroll_setting?.salary_monthly ?? empleado?.position_base_salary ?? ""),
  salary_daily: valorInput(empleado?.payroll_setting?.salary_daily ?? ""),
  integrated_daily_salary: valorInput(empleado?.payroll_setting?.integrated_daily_salary ?? ""),
  payment_frequency: empleado?.payroll_setting?.payment_frequency ?? "quincenal",
  bank_name: valorInput(empleado?.payroll_setting?.bank_name ?? ""),
  bank_account: valorInput(empleado?.payroll_setting?.bank_account ?? ""),
  clabe: valorInput(empleado?.payroll_setting?.clabe ?? ""),
  imss_regime: valorInput(empleado?.payroll_setting?.imss_regime ?? ""),
  contract_type_sat: valorInput(empleado?.payroll_setting?.contract_type_sat ?? ""),
  workday_type_sat: valorInput(empleado?.payroll_setting?.workday_type_sat ?? ""),
  risk_class: valorInput(empleado?.payroll_setting?.risk_class ?? ""),
  is_payroll_active: Boolean(empleado?.payroll_setting?.is_payroll_active),
});

function Badge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    calculated: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    closed: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls[status] ?? cls.draft}`}>{statusLabel[status] ?? status}</span>;
}

export default function PayrollPage() {
  const [tab, setTab] = useState<Tab>("resumen");

  return (
    <>
      <PageMeta title="Nómina | Zenda" description="Módulo de nómina México" />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">Zenda Nómina México</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Administración de nómina</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                MVP operativo para configurar empleados, conceptos, periodos y corridas. ISR/IMSS quedan preparados como conceptos manuales o integración futura.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              Flujo recomendado: Configuración → Empleados → Periodos → Corrida → Calcular → Aprobar → Cerrar
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ["resumen", "Resumen"],
              ["empleados", "Empleados"],
              ["conceptos", "Conceptos"],
              ["periodos", "Periodos"],
              ["corridas", "Corridas"],
              ["config", "Configuración"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key as Tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "resumen" && <ResumenNomina />}
        {tab === "empleados" && <EmpleadosNomina />}
        {tab === "conceptos" && <ConceptosNomina />}
        {tab === "periodos" && <PeriodosNomina />}
        {tab === "corridas" && <CorridasNomina />}
        {tab === "config" && <ConfiguracionNomina />}
      </div>
    </>
  );
}

function ResumenNomina() {
  const { data: settings } = usePayrollSettings();
  const { data: periods } = usePayrollPeriods();
  const { data: runs } = usePayrollRuns();
  const lastRun = runs?.data?.[0];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard title="UMA diaria" value={money(settings?.uma_daily)} note="Configurable por empresa" />
      <MetricCard title="Salario mínimo" value={money(settings?.minimum_wage_daily)} note="Zona general" />
      <MetricCard title="Periodos" value={periods?.total ?? 0} note="Creados en Zenda" />
      <MetricCard title="Última corrida" value={lastRun ? money(lastRun.totals?.net_total ?? 0) : "$0.00"} note={lastRun?.name ?? "Sin corridas"} />
    </div>
  );
}

function MetricCard({ title, value, note }: { title: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </div>
  );
}

function ConfiguracionNomina() {
  const { data: settings, isLoading } = usePayrollSettings();
  const actualizar = useActualizarPayrollSettings();
  const [form, setForm] = useState<Record<string, unknown>>({});

  if (isLoading) return <Panel>Cargando configuración...</Panel>;
  const data = { ...settings, ...form };

  const save = async () => {
    await actualizar.mutateAsync({
      uma_daily: Number(data.uma_daily ?? 0),
      minimum_wage_daily: Number(data.minimum_wage_daily ?? 0),
      minimum_wage_border_daily: Number(data.minimum_wage_border_daily ?? 0),
      default_frequency: String(data.default_frequency ?? "quincenal") as any,
      tax_calculation_mode: String(data.tax_calculation_mode ?? "manual") as any,
      discount_unjustified_absences: Boolean(data.discount_unjustified_absences),
      use_attendance_for_payroll: Boolean(data.use_attendance_for_payroll),
      is_active: Boolean(data.is_active ?? true),
    });
    Swal.fire({ icon: "success", title: "Configuración guardada", timer: 1600, showConfirmButton: false });
  };

  return (
    <Panel title="Configuración general">
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="UMA diaria" type="number" value={data.uma_daily ?? ""} onChange={(v) => setForm({ ...form, uma_daily: v })} />
        <Input label="Salario mínimo general" type="number" value={data.minimum_wage_daily ?? ""} onChange={(v) => setForm({ ...form, minimum_wage_daily: v })} />
        <Input label="Salario mínimo frontera" type="number" value={data.minimum_wage_border_daily ?? ""} onChange={(v) => setForm({ ...form, minimum_wage_border_daily: v })} />
        <Select label="Frecuencia default" value={String(data.default_frequency ?? "quincenal")} onChange={(v) => setForm({ ...form, default_frequency: v })} options={["semanal", "catorcenal", "quincenal", "mensual"]} />
        <Select label="Modo ISR/IMSS" value={String(data.tax_calculation_mode ?? "manual")} onChange={(v) => setForm({ ...form, tax_calculation_mode: v })} options={["manual", "external", "future_internal"]} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Check label="Descontar faltas injustificadas" checked={Boolean(data.discount_unjustified_absences)} onChange={(v) => setForm({ ...form, discount_unjustified_absences: v })} />
        <Check label="Usar asistencia para nómina" checked={Boolean(data.use_attendance_for_payroll)} onChange={(v) => setForm({ ...form, use_attendance_for_payroll: v })} />
      </div>
      <div className="mt-5">
        <button onClick={save} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Guardar configuración</button>
      </div>
    </Panel>
  );
}

/**
 * EmpleadosNomina
 *
 * Esta pestaña convierte usuarios activos de Zenda en empleados configurables para nómina.
 * No duplica usuarios: toma users como maestro de personas y guarda datos salariales en
 * payroll_employee_settings para mantener separada la identidad/RH de los datos de nómina.
 */
function EmpleadosNomina() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PayrollEmployeeStatusFilter>("all");
  const { data, isFetching } = usePayrollEmployees(search, status);
  const { data: stats } = usePayrollEmployeeStats();
  const actualizar = useActualizarPayrollEmployee();
  const activar = useActivarPayrollEmployee();
  const preparar = usePrepararPayrollEmployees();
  const importar = useImportarPayrollEmployees();
  const inputImportRef = useRef<HTMLInputElement | null>(null);
  const [empleadoEditando, setEmpleadoEditando] = useState<PayrollEmployeeRow | null>(null);

  /**
   * Prepara usuarios activos que todavía no tienen registro de nómina.
   * Si el puesto tiene salario base, se usa como salario mensual inicial.
   */
  const prepararUsuarios = async () => {
    const respuesta = await Swal.fire({
      icon: "question",
      title: "Preparar usuarios activos",
      html: "Se creará configuración de nómina para usuarios activos que aún no la tengan.<br/><br/>Si el puesto tiene salario base, se copiará como salario mensual inicial.",
      showCancelButton: true,
      confirmButtonText: "Preparar usuarios",
      cancelButtonText: "Cancelar",
    });

    if (!respuesta.isConfirmed) return;

    const resultado = await preparar.mutateAsync({ activate_with_salary: true });
    Swal.fire({
      icon: "success",
      title: "Usuarios preparados",
      text: `Creados: ${resultado.created ?? 0}. Ya existentes: ${resultado.skipped ?? 0}.`,
      timer: 2200,
      showConfirmButton: false,
    });
  };

  /**
   * Descarga la plantilla oficial con los usuarios activos de la empresa actual.
   * RH puede editarla en Excel y subirla de nuevo para actualizar salarios y datos bancarios.
   */
  const descargarPlantilla = async () => {
    try {
      await descargarPlantillaPayrollEmployees();
    } catch {
      Swal.fire("Error", "No se pudo descargar la plantilla de empleados de nómina.", "error");
    }
  };

  /**
   * Importa el archivo seleccionado desde el input oculto.
   * Se muestra un resumen para que RH sepa cuántas filas se procesaron y si hubo errores.
   */
  const importarPlantilla = async (archivo?: File) => {
    if (!archivo) return;

    try {
      const resultado = await importar.mutateAsync(archivo);
      const resumen = resultado.summary;
      const errores = resultado.errors ?? [];
      const htmlErrores = errores.slice(0, 10).map((error: any) => (
        `<li><strong>Fila ${escapeHtml(error.fila)}</strong> · ${escapeHtml(error.campo)}: ${escapeHtml(error.mensaje)}</li>`
      )).join("");

      await Swal.fire({
        icon: errores.length > 0 ? "warning" : "success",
        title: "Importación procesada",
        width: 720,
        html: `
          <div style="text-align:left;font-size:14px;line-height:1.7">
            <p><strong>Procesados:</strong> ${escapeHtml(resumen?.procesados ?? 0)}</p>
            <p><strong>Creados:</strong> ${escapeHtml(resumen?.creados ?? 0)} · <strong>Actualizados:</strong> ${escapeHtml(resumen?.actualizados ?? 0)}</p>
            <p><strong>Activados:</strong> ${escapeHtml(resumen?.activados ?? 0)} · <strong>Desactivados:</strong> ${escapeHtml(resumen?.desactivados ?? 0)}</p>
            <p><strong>Errores:</strong> ${escapeHtml(resumen?.errores ?? 0)}</p>
            ${htmlErrores ? `<hr style="margin:12px 0"><p><strong>Primeros errores:</strong></p><ul style="padding-left:18px">${htmlErrores}</ul>` : ""}
          </div>
        `,
        confirmButtonText: "Entendido",
      });
    } catch {
      Swal.fire("Error", "No se pudo importar la plantilla. Revisa que sea .xlsx, .xls o .csv.", "error");
    } finally {
      if (inputImportRef.current) inputImportRef.current.value = "";
    }
  };

  /**
   * Abre el drawer lateral de edición.
   *
   * Regla de UI de Zenda:
   * - Los formularios no se abren como modal centrado.
   * - Se abren como panel lateral desde la derecha para mantener contexto de la tabla.
   */
  const edit = (row: PayrollEmployeeRow) => {
    setEmpleadoEditando(row);
  };

  /**
   * Guarda la ficha de nómina del empleado editado desde el drawer.
   *
   * El backend decide:
   * - Crear payroll_employee_settings si no existe.
   * - Actualizarlo si ya existe.
   * - Recalcular salario diario si se manda salario mensual y salario diario vacío.
   */
  const guardarEmpleado = async (payload: PayrollEmployeeSetting) => {
    if (!empleadoEditando) return;

    await actualizar.mutateAsync({
      userId: empleadoEditando.id,
      payload: {
        ...(empleadoEditando.payroll_setting ?? {}),
        ...payload,
      } as PayrollEmployeeSetting,
    });

    setEmpleadoEditando(null);
    Swal.fire({ icon: "success", title: "Empleado actualizado", timer: 1500, showConfirmButton: false });
  };

  /**
   * Activa o desactiva el empleado sin borrar sus datos salariales.
   */
  const toggleEmpleado = async (row: PayrollEmployeeRow) => {
    const activoActual = Boolean(row.payroll_setting?.is_payroll_active);
    await activar.mutateAsync({ userId: row.id, isActive: !activoActual });
    Swal.fire({ icon: "success", title: activoActual ? "Empleado desactivado" : "Empleado activado", timer: 1200, showConfirmButton: false });
  };

  const filters: Array<[PayrollEmployeeStatusFilter, string]> = [
    ["all", "Todos"],
    ["configured", "Configurados"],
    ["unconfigured", "Sin configurar"],
    ["active", "Activos nómina"],
    ["incomplete", "Incompletos"],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Usuarios activos" value={stats?.active_users ?? 0} note="Base users de Zenda" />
        <MetricCard title="Configurados" value={stats?.configured ?? 0} note="Con payroll settings" />
        <MetricCard title="Sin configurar" value={stats?.unconfigured ?? 0} note="Pendientes de preparar" />
        <MetricCard title="Activos nómina" value={stats?.active_payroll ?? 0} note="Entrarán a corridas" />
        <MetricCard title="Sin salario" value={stats?.missing_salary ?? 0} note="Requieren revisión" />
      </div>

      <Panel title="Empleados de nómina">
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            <strong>1. Usuarios actuales</strong>
            <p className="mt-1">La tabla viene de <code>users</code>. Solo se muestran usuarios activos de tu empresa actual.</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
            <strong>2. Ficha de nómina</strong>
            <p className="mt-1">Cada usuario se complementa en <code>payroll_employee_settings</code> con salario, frecuencia, banco y estatus.</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
            <strong>3. Para calcular</strong>
            <p className="mt-1">Captura salario mensual o diario, marca “Activo para nómina” y después crea periodo/corrida.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white md:max-w-md"
              placeholder="Buscar por nómina, nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {filters.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <input
              ref={inputImportRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => importarPlantilla(event.target.files?.[0] ?? undefined)}
            />
            <button
              onClick={descargarPlantilla}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Descargar plantilla
            </button>
            <button
              onClick={() => inputImportRef.current?.click()}
              disabled={importar.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {importar.isPending ? "Importando..." : "Importar Excel"}
            </button>
            <button
              onClick={prepararUsuarios}
              disabled={preparar.isPending}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {preparar.isPending ? "Preparando..." : "Preparar usuarios activos"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-400">
              <tr>
                <th className="py-3">Empleado</th>
                <th>Departamento</th>
                <th>Puesto</th>
                <th>Salario mensual</th>
                <th>Salario diario</th>
                <th>Estado nómina</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((row) => {
                const configurado = Boolean(row.payroll_setting);
                const activo = Boolean(row.payroll_setting?.is_payroll_active);
                const sinSalario = !row.payroll_setting?.salary_monthly || Number(row.payroll_setting.salary_monthly) <= 0;

                return (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{row.employee_number ?? "S/N"} · {row.full_name}</div>
                      <div className="text-xs text-gray-400">{row.email ?? "Sin correo"}</div>
                    </td>
                    <td>{row.department ?? "—"}</td>
                    <td>{row.position ?? "—"}</td>
                    <td>{money(row.payroll_setting?.salary_monthly ?? row.position_base_salary ?? 0)}</td>
                    <td>{money(row.payroll_setting?.salary_daily ?? 0)}</td>
                    <td>
                      {!configurado ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">Sin configurar</span>
                      ) : sinSalario ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Sin salario</span>
                      ) : activo ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">Activo</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Inactivo</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => edit(row)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Editar</button>
                        {configurado && (
                          <button onClick={() => toggleEmpleado(row)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                            {activo ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.data?.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No se encontraron empleados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {isFetching && <p className="mt-3 text-xs text-gray-400">Actualizando...</p>}
      </Panel>

      <PayrollEmployeeDrawer
        abierto={Boolean(empleadoEditando)}
        empleado={empleadoEditando}
        guardando={actualizar.isPending}
        onClose={() => setEmpleadoEditando(null)}
        onSave={guardarEmpleado}
      />
    </div>
  );
}

/**
 * PayrollEmployeeDrawer
 *
 * Formulario lateral para editar los datos mínimos de nómina de un usuario existente.
 *
 * Por qué es un drawer:
 * - Cumple la regla visual de Zenda: formularios desde la derecha, no modales centrados.
 * - Permite que RH conserve contexto de la tabla mientras edita.
 * - Evita SweetAlert para formularios con muchos campos.
 */
function PayrollEmployeeDrawer({
  abierto,
  empleado,
  guardando,
  onClose,
  onSave,
}: {
  abierto: boolean;
  empleado: PayrollEmployeeRow | null;
  guardando: boolean;
  onClose: () => void;
  onSave: (payload: PayrollEmployeeSetting) => Promise<void>;
}) {
  const [form, setForm] = useState<PayrollEmployeeFormState>(formularioDesdeEmpleado(null));

  /**
   * Cada vez que se abre un empleado distinto, el drawer se llena con sus datos actuales.
   */
  useEffect(() => {
    setForm(formularioDesdeEmpleado(empleado));
  }, [empleado]);

  const actualizarCampo = <K extends keyof PayrollEmployeeFormState>(campo: K, valor: PayrollEmployeeFormState[K]) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSave({
      salary_monthly: numeroONulo(form.salary_monthly),
      salary_daily: numeroONulo(form.salary_daily),
      integrated_daily_salary: numeroONulo(form.integrated_daily_salary),
      payment_frequency: form.payment_frequency,
      bank_name: form.bank_name.trim() || null,
      bank_account: form.bank_account.trim() || null,
      clabe: form.clabe.trim() || null,
      imss_regime: form.imss_regime.trim() || null,
      contract_type_sat: form.contract_type_sat.trim() || null,
      workday_type_sat: form.workday_type_sat.trim() || null,
      risk_class: form.risk_class.trim() || null,
      is_payroll_active: form.is_payroll_active,
    });
  };

  return (
    <div className={`fixed inset-0 z-[100000] ${abierto ? "" : "pointer-events-none"}`} aria-hidden={!abierto}>
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] transition-opacity duration-300 ${abierto ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-950 ${abierto ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-950 to-brand-600 px-6 py-5 text-white dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-200">Nómina México</p>
              <h2 className="mt-1 text-xl font-bold">Editar empleado de nómina</h2>
              <p className="mt-1 text-sm text-white/75">
                {empleado ? `${empleado.employee_number ?? "S/N"} · ${empleado.full_name}` : "Selecciona un empleado"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>

        <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-slate-900 dark:text-gray-300">
              <strong>¿Cómo llenar esta ficha?</strong>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Confirma que el usuario corresponda al empleado correcto.</li>
                <li>Captura salario mensual o salario diario. Si dejas salario diario vacío, el backend puede calcularlo con base en 30 días.</li>
                <li>Agrega SDI/SBC si ya lo tienes definido para IMSS; si no, déjalo pendiente.</li>
                <li>Marca “Activo para nómina” solo cuando el salario esté validado.</li>
              </ol>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Datos salariales</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Salario mensual" type="number" value={form.salary_monthly} onChange={(v) => actualizarCampo("salary_monthly", v)} />
                <Input label="Salario diario" type="number" value={form.salary_daily} onChange={(v) => actualizarCampo("salary_daily", v)} />
                <Input label="SDI/SBC" type="number" value={form.integrated_daily_salary} onChange={(v) => actualizarCampo("integrated_daily_salary", v)} />
                <Select
                  label="Frecuencia de pago"
                  value={form.payment_frequency}
                  onChange={(v) => actualizarCampo("payment_frequency", v as PayrollEmployeeSetting["payment_frequency"])}
                  options={["semanal", "catorcenal", "quincenal", "mensual"]}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Datos bancarios</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Banco" value={form.bank_name} onChange={(v) => actualizarCampo("bank_name", v)} />
                <Input label="Cuenta bancaria" value={form.bank_account} onChange={(v) => actualizarCampo("bank_account", v)} />
                <Input label="CLABE" value={form.clabe} onChange={(v) => actualizarCampo("clabe", v)} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Datos IMSS/SAT preparados</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Régimen IMSS" value={form.imss_regime} onChange={(v) => actualizarCampo("imss_regime", v)} />
                <Input label="Tipo de contrato SAT" value={form.contract_type_sat} onChange={(v) => actualizarCampo("contract_type_sat", v)} />
                <Input label="Tipo de jornada SAT" value={form.workday_type_sat} onChange={(v) => actualizarCampo("workday_type_sat", v)} />
                <Input label="Clase de riesgo" value={form.risk_class} onChange={(v) => actualizarCampo("risk_class", v)} />
              </div>
            </section>

            <Check
              label="Activo para nómina: incluir este empleado en futuras corridas"
              checked={form.is_payroll_active}
              onChange={(v) => actualizarCampo("is_payroll_active", v)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar empleado"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

type PayrollConceptFormState = {
  code: string;
  name: string;
  type: PayrollConceptType;
  category: string;
  sat_code: string;
  sat_group: string;
  taxable_isr: boolean;
  integrates_sbc: boolean;
  auto_apply: boolean;
  calculation_type: PayrollConceptCalculationType;
  default_amount: string;
  default_percentage: string;
  display_order: string;
  is_active: boolean;
};

/**
 * Devuelve un formulario limpio para crear conceptos manualmente.
 * Se usa al abrir el drawer desde el botón "Nuevo concepto".
 */
const conceptoVacio = (): PayrollConceptFormState => ({
  code: "",
  name: "",
  type: "perception",
  category: "manual",
  sat_code: "",
  sat_group: "",
  taxable_isr: false,
  integrates_sbc: false,
  auto_apply: false,
  calculation_type: "manual",
  default_amount: "",
  default_percentage: "",
  display_order: "100",
  is_active: true,
});

/**
 * Convierte un concepto del backend en estado editable del drawer.
 */
const formularioDesdeConcepto = (concepto?: PayrollConcept | null): PayrollConceptFormState => ({
  code: valorInput(concepto?.code ?? ""),
  name: valorInput(concepto?.name ?? ""),
  type: concepto?.type ?? "perception",
  category: valorInput(concepto?.category ?? "manual"),
  sat_code: valorInput(concepto?.sat_code ?? ""),
  sat_group: valorInput(concepto?.sat_group ?? ""),
  taxable_isr: Boolean(concepto?.taxable_isr),
  integrates_sbc: Boolean(concepto?.integrates_sbc),
  auto_apply: Boolean(concepto?.auto_apply),
  calculation_type: concepto?.calculation_type ?? "manual",
  default_amount: valorInput(concepto?.default_amount ?? ""),
  default_percentage: valorInput(concepto?.default_percentage ?? ""),
  display_order: valorInput(concepto?.display_order ?? 100),
  is_active: concepto?.is_active ?? true,
});

/**
 * Normaliza el formulario del drawer al payload esperado por Laravel.
 */
const payloadDesdeConcepto = (form: PayrollConceptFormState, concepto?: PayrollConcept | null): PayrollConceptPayload => ({
  id: concepto?.id,
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  type: form.type,
  category: form.category.trim() || null,
  sat_code: form.sat_code.trim() || null,
  sat_group: form.sat_group.trim() || null,
  taxable_isr: form.taxable_isr,
  integrates_sbc: form.integrates_sbc,
  auto_apply: form.auto_apply,
  calculation_type: form.calculation_type,
  default_amount: numeroONulo(form.default_amount),
  default_percentage: numeroONulo(form.default_percentage),
  display_order: Number(form.display_order || 100),
  is_active: form.is_active,
});

const conceptTypeLabel: Record<PayrollConceptType, string> = {
  perception: "Percepción",
  deduction: "Deducción",
  other_payment: "Otro pago",
};

const calculationTypeLabel: Record<PayrollConceptCalculationType, string> = {
  manual: "Manual",
  system_salary: "Sueldo automático",
  system_absence: "Falta automática",
  fixed_amount: "Monto fijo",
  percentage_of_salary: "% del salario",
};

function ConceptosNomina() {
  const { data, isFetching } = usePayrollConcepts();
  const guardar = useGuardarPayrollConcept();
  const toggle = useTogglePayrollConcept();
  const importar = useImportarPayrollConcepts();
  const archivoRef = useRef<HTMLInputElement | null>(null);
  const [filtro, setFiltro] = useState<PayrollConceptType | "all">("all");
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [conceptoEditar, setConceptoEditar] = useState<PayrollConcept | null>(null);

  const conceptos = (data ?? []).filter((concepto) => filtro === "all" || concepto.type === filtro);

  /** Abre el drawer lateral para crear un concepto nuevo. */
  const abrirNuevo = () => {
    setConceptoEditar(null);
    setDrawerAbierto(true);
  };

  /** Abre el drawer lateral precargado con un concepto existente. */
  const abrirEdicion = (concepto: PayrollConcept) => {
    setConceptoEditar(concepto);
    setDrawerAbierto(true);
  };

  /** Descarga la plantilla Excel para edición masiva. */
  const descargarPlantilla = async () => {
    await descargarPlantillaPayrollConcepts();
  };

  /** Procesa el archivo seleccionado por el input oculto. */
  const importarArchivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    try {
      const resultado = await importar.mutateAsync(archivo);
      const resumen = resultado.summary;
      const errores = resultado.errors ?? [];
      const htmlErrores = errores.slice(0, 10).map((error: any) => (
        `<li><strong>Fila ${escapeHtml(error.fila)}</strong> · ${escapeHtml(error.campo)}: ${escapeHtml(error.mensaje)}</li>`
      )).join("");

      await Swal.fire({
        icon: errores.length > 0 ? "warning" : "success",
        title: "Conceptos importados",
        width: 720,
        html: `
          <div style="text-align:left;font-size:14px;line-height:1.7">
            <p><strong>Procesados:</strong> ${escapeHtml(resumen?.procesados ?? 0)}</p>
            <p><strong>Creados:</strong> ${escapeHtml(resumen?.creados ?? 0)} · <strong>Actualizados:</strong> ${escapeHtml(resumen?.actualizados ?? 0)}</p>
            <p><strong>Errores:</strong> ${escapeHtml(resumen?.errores ?? 0)}</p>
            ${errores.length > 0 ? `<hr style="margin:12px 0"/><ul>${htmlErrores}</ul>${errores.length > 10 ? `<p>Y ${errores.length - 10} errores más...</p>` : ""}` : ""}
          </div>
        `,
        confirmButtonText: "Entendido",
      });
    } finally {
      event.target.value = "";
    }
  };

  /** Cambia activo/inactivo sin borrar el concepto. */
  const cambiarEstado = async (concepto: PayrollConcept) => {
    const respuesta = await Swal.fire({
      icon: "question",
      title: concepto.is_active ? "Desactivar concepto" : "Activar concepto",
      text: `¿Quieres ${concepto.is_active ? "desactivar" : "activar"} ${concepto.code}?`,
      showCancelButton: true,
      confirmButtonText: concepto.is_active ? "Desactivar" : "Activar",
      cancelButtonText: "Cancelar",
    });

    if (!respuesta.isConfirmed) return;
    await toggle.mutateAsync(concepto.id);
  };

  return (
    <>
      <Panel title="Conceptos de nómina">
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.3fr_auto] lg:items-start">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
            <strong>¿Cómo se usan?</strong>
            <p className="mt-1">
              Los conceptos definen qué se paga o descuenta en una corrida. Puedes editarlos manualmente o cargarlos por Excel.
              Zenda actualiza por código: si el código existe, lo actualiza; si no existe, lo crea.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button onClick={descargarPlantilla} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              Descargar plantilla
            </button>
            <button onClick={() => archivoRef.current?.click()} className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-900/20 dark:text-brand-200">
              Importar Excel
            </button>
            <button onClick={abrirNuevo} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-600">
              Nuevo concepto
            </button>
            <input ref={archivoRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importarArchivo} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["all", "Todos"],
            ["perception", "Percepciones"],
            ["deduction", "Deducciones"],
            ["other_payment", "Otros pagos"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltro(key as PayrollConceptType | "all")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filtro === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-400">
              <tr>
                <th className="py-3">Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Cálculo</th>
                <th>SAT</th>
                <th>ISR</th>
                <th>SBC</th>
                <th>Auto</th>
                <th>Activo</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.map((concepto) => (
                <tr key={concepto.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                    {concepto.code}
                    {concepto.is_system && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">Sistema</span>}
                  </td>
                  <td>
                    <div className="font-medium text-gray-800 dark:text-gray-100">{concepto.name}</div>
                    <div className="text-xs text-gray-400">{concepto.category ?? "Sin categoría"}</div>
                  </td>
                  <td>{conceptTypeLabel[concepto.type]}</td>
                  <td>{calculationTypeLabel[concepto.calculation_type]}</td>
                  <td>{concepto.sat_code ? `${concepto.sat_group ?? "SAT"} · ${concepto.sat_code}` : "-"}</td>
                  <td>{concepto.taxable_isr ? "Sí" : "No"}</td>
                  <td>{concepto.integrates_sbc ? "Sí" : "No"}</td>
                  <td>{concepto.auto_apply ? "Sí" : "No"}</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${concepto.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {concepto.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirEdicion(concepto)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                        Editar
                      </button>
                      <button onClick={() => cambiarEstado(concepto)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                        {concepto.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isFetching && conceptos.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-gray-400">No hay conceptos para este filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <ConceptoNominaDrawer
        abierto={drawerAbierto}
        concepto={conceptoEditar}
        guardando={guardar.isPending}
        onClose={() => setDrawerAbierto(false)}
        onSave={async (payload) => {
          await guardar.mutateAsync(payload);
          setDrawerAbierto(false);
          Swal.fire({ icon: "success", title: conceptoEditar ? "Concepto actualizado" : "Concepto creado", timer: 1500, showConfirmButton: false });
        }}
      />
    </>
  );
}

function ConceptoNominaDrawer({
  abierto,
  concepto,
  guardando,
  onClose,
  onSave,
}: {
  abierto: boolean;
  concepto: PayrollConcept | null;
  guardando: boolean;
  onClose: () => void;
  onSave: (payload: PayrollConceptPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<PayrollConceptFormState>(conceptoVacio());

  useEffect(() => {
    if (abierto) setForm(formularioDesdeConcepto(concepto));
  }, [abierto, concepto]);

  const actualizarCampo = <K extends keyof PayrollConceptFormState>(campo: K, valor: PayrollConceptFormState[K]) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarConcepto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      await Swal.fire({ icon: "warning", title: "Faltan datos", text: "Captura código y nombre del concepto." });
      return;
    }

    await onSave(payloadDesdeConcepto(form, concepto));
  };

  return (
    <div className={`fixed inset-0 z-[100000] ${abierto ? "" : "pointer-events-none"}`} aria-hidden={!abierto}>
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] transition-opacity duration-300 ${abierto ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside className={`absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-950 ${abierto ? "translate-x-0" : "translate-x-full"}`}>
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-950 to-brand-600 px-6 py-5 text-white dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-200">Conceptos de nómina</p>
              <h2 className="mt-1 text-xl font-bold">{concepto ? "Editar concepto" : "Nuevo concepto"}</h2>
              <p className="mt-1 text-sm text-white/75">
                Define cómo se clasifica, calcula y presenta el concepto en los recibos.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Cerrar
            </button>
          </div>
        </div>

        <form onSubmit={guardarConcepto} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-slate-900 dark:text-gray-300">
              <strong>Regla práctica:</strong> usa códigos claros y estables, por ejemplo <code>BONO_PUNTUALIDAD</code>, <code>PRESTAMO_CAJA</code> o <code>VALES_DESPENSA</code>. El Excel también actualiza por código.
            </div>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Identificación</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Código" value={form.code} onChange={(v) => actualizarCampo("code", v.toUpperCase())} />
                <Input label="Nombre" value={form.name} onChange={(v) => actualizarCampo("name", v)} />
                <Select label="Tipo" value={form.type} onChange={(v) => actualizarCampo("type", v as PayrollConceptType)} options={["perception", "deduction", "other_payment"]} />
                <Input label="Categoría" value={form.category} onChange={(v) => actualizarCampo("category", v)} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">SAT / clasificación futura</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Código SAT" value={form.sat_code} onChange={(v) => actualizarCampo("sat_code", v)} />
                <Input label="Grupo SAT" value={form.sat_group} onChange={(v) => actualizarCampo("sat_group", v)} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cálculo</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Tipo de cálculo" value={form.calculation_type} onChange={(v) => actualizarCampo("calculation_type", v as PayrollConceptCalculationType)} options={["manual", "fixed_amount", "percentage_of_salary", "system_salary", "system_absence"]} />
                <Input label="Orden" type="number" value={form.display_order} onChange={(v) => actualizarCampo("display_order", v)} />
                <Input label="Monto default" type="number" value={form.default_amount} onChange={(v) => actualizarCampo("default_amount", v)} />
                <Input label="Porcentaje default" type="number" value={form.default_percentage} onChange={(v) => actualizarCampo("default_percentage", v)} />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tratamiento</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Check label="Grava ISR" checked={form.taxable_isr} onChange={(v) => actualizarCampo("taxable_isr", v)} />
                <Check label="Integra SBC/SDI" checked={form.integrates_sbc} onChange={(v) => actualizarCampo("integrates_sbc", v)} />
                <Check label="Aplicar automático cuando aplique" checked={form.auto_apply} onChange={(v) => actualizarCampo("auto_apply", v)} />
                <Check label="Concepto activo" checked={form.is_active} onChange={(v) => actualizarCampo("is_active", v)} />
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar concepto"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function PeriodosNomina() {
  const { data } = usePayrollPeriods();
  const crear = useCrearPayrollPeriod();
  const generarAnual = useGenerarPayrollPeriodsYear();
  const anioActual = new Date().getFullYear();

  /**
   * Formulario para periodo manual.
   * Se conserva porque existen nóminas especiales que no siguen el calendario normal:
   * aguinaldo, PTU, finiquito, bono extraordinario o correcciones.
   */
  const [form, setForm] = useState<Partial<PayrollPeriod>>({ frequency: "quincenal", status: "open" });

  /**
   * Formulario del generador anual.
   * Este es el flujo recomendado para la operación normal de nómina.
   */
  const [autoForm, setAutoForm] = useState<PayrollPeriodGenerationRequest>({
    year: anioActual,
    frequency: "quincenal",
    start_date: `${anioActual}-01-01`,
    status: "open",
    payment_timing: "period_end",
    weekend_adjustment: "previous_business_day",
    overwrite: false,
  });

  /**
   * Calcula una expectativa simple para que RH entienda qué va a pasar antes de generar.
   */
  const cantidadEsperada = (() => {
    if (autoForm.frequency === "quincenal") return 24;
    if (autoForm.frequency === "mensual") return 12;
    if (autoForm.frequency === "semanal") return 52;
    return 26;
  })();

  const textoFrecuencia: Record<PayrollFrequency, string> = {
    semanal: "Semanal: periodos de 7 días desde la fecha inicial.",
    catorcenal: "Catorcenal: periodos de 14 días desde la fecha inicial.",
    quincenal: "Quincenal: 1-15 y 16-fin de mes.",
    mensual: "Mensual: mes completo.",
  };

  const actualizarAuto = <K extends keyof PayrollPeriodGenerationRequest>(campo: K, valor: PayrollPeriodGenerationRequest[K]) => {
    setAutoForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const generarCalendario = async () => {
    const respuesta = await Swal.fire({
      icon: "question",
      title: "Generar calendario de nómina",
      html: `Se generarán aproximadamente <strong>${cantidadEsperada}</strong> periodos para <strong>${autoForm.year}</strong>.<br/><br/>Los periodos existentes no se borran. Si ya existen, se omiten salvo que actives reemplazar editables.`,
      showCancelButton: true,
      confirmButtonText: "Generar periodos",
      cancelButtonText: "Cancelar",
    });

    if (!respuesta.isConfirmed) return;

    const resultado = await generarAnual.mutateAsync(autoForm);
    Swal.fire({
      icon: "success",
      title: "Calendario generado",
      html: `
        <div style="text-align:left;line-height:1.7">
          <p><strong>Creados:</strong> ${escapeHtml(resultado.summary.created)}</p>
          <p><strong>Actualizados:</strong> ${escapeHtml(resultado.summary.updated)}</p>
          <p><strong>Ya existían:</strong> ${escapeHtml(resultado.summary.skipped)}</p>
          <p><strong>Bloqueados:</strong> ${escapeHtml(resultado.summary.blocked)}</p>
        </div>
      `,
      confirmButtonText: "Entendido",
    });
  };

  const save = async () => {
    await crear.mutateAsync(form);
    setForm({ frequency: "quincenal", status: "open" });
    Swal.fire({ icon: "success", title: "Periodo creado", timer: 1500, showConfirmButton: false });
  };

  return (
    <div className="space-y-5">
      <Panel title="Generar calendario anual">
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-brand-600 p-5 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-200">Recomendado</p>
            <h3 className="mt-2 text-xl font-bold">Crea todos los periodos del año en un solo paso</h3>
            <p className="mt-2 text-sm text-white/75">
              Configura frecuencia, año y fecha de pago. Zenda genera los periodos normales y deja el alta manual solo para casos especiales.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-xl bg-white/10 p-3"><strong>1.</strong> Elige frecuencia y año.</div>
              <div className="rounded-xl bg-white/10 p-3"><strong>2.</strong> Define cómo se paga si cae en sábado/domingo.</div>
              <div className="rounded-xl bg-white/10 p-3"><strong>3.</strong> Genera periodos y crea corridas cuando corresponda.</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-slate-900/70">
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Año" type="number" value={autoForm.year} onChange={(v) => actualizarAuto("year", Number(v) || anioActual)} />
              <Select
                label="Frecuencia"
                value={autoForm.frequency}
                onChange={(v) => actualizarAuto("frequency", v as PayrollFrequency)}
                options={["semanal", "catorcenal", "quincenal", "mensual"]}
              />
              <Select
                label="Estado inicial"
                value={autoForm.status}
                onChange={(v) => actualizarAuto("status", v as PayrollPeriodGenerationRequest["status"])}
                options={["open", "draft"]}
              />
              <Input
                label="Fecha inicial"
                type="date"
                value={autoForm.start_date ?? ""}
                onChange={(v) => actualizarAuto("start_date", v || null)}
              />
              <Select
                label="Fecha de pago"
                value={autoForm.payment_timing}
                onChange={(v) => actualizarAuto("payment_timing", v as PayrollPeriodGenerationRequest["payment_timing"])}
                options={["period_end", "next_day"]}
              />
              <Select
                label="Si pago cae fin de semana"
                value={autoForm.weekend_adjustment}
                onChange={(v) => actualizarAuto("weekend_adjustment", v as PayrollPeriodGenerationRequest["weekend_adjustment"])}
                options={["previous_business_day", "next_business_day", "none"]}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
                <strong>Vista previa:</strong> {textoFrecuencia[autoForm.frequency]} Se crearán aprox. <strong>{cantidadEsperada}</strong> periodos.
              </div>
              <button
                onClick={generarCalendario}
                disabled={generarAnual.isPending}
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
              >
                {generarAnual.isPending ? "Generando..." : "Generar calendario"}
              </button>
            </div>

            <div className="mt-3">
              <Check
                label="Reemplazar periodos editables si ya existen"
                checked={autoForm.overwrite}
                onChange={(v) => actualizarAuto("overwrite", v)}
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Crear periodo manual">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Usa esta opción para nóminas extraordinarias como aguinaldo, PTU, finiquito, bono especial o corrección.
        </p>
        <div className="grid gap-3 md:grid-cols-5">
          <Input label="Nombre" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Inicio" type="date" value={form.period_start ?? ""} onChange={(v) => setForm({ ...form, period_start: v })} />
          <Input label="Fin" type="date" value={form.period_end ?? ""} onChange={(v) => setForm({ ...form, period_end: v })} />
          <Input label="Pago" type="date" value={form.payment_date ?? ""} onChange={(v) => setForm({ ...form, payment_date: v })} />
          <button onClick={save} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">Crear manual</button>
        </div>
      </Panel>

      <Panel title="Periodos creados">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-400">
              <tr><th className="py-3">Periodo</th><th>Frecuencia</th><th>Rango</th><th>Pago</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {data?.data?.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="capitalize">{p.frequency}</td>
                  <td>{p.period_start} → {p.period_end}</td>
                  <td>{p.payment_date}</td>
                  <td><Badge status={p.status} /></td>
                </tr>
              ))}
              {data?.data?.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">Todavía no hay periodos. Genera el calendario anual o crea un periodo manual.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function CorridasNomina() {
  const { data: periods } = usePayrollPeriods();
  const { data: runs } = usePayrollRuns();
  const crear = useCrearPayrollRun();
  const generar = useGenerarPayrollRun();
  const aprobar = useAprobarPayrollRun();
  const cerrar = useCerrarPayrollRun();
  const [selectedRun, setSelectedRun] = useState<number | undefined>();
  const { data: detail } = usePayrollRun(selectedRun);
  const [periodId, setPeriodId] = useState("");

  const createRun = async () => {
    if (!periodId) return;
    await crear.mutateAsync({ payroll_period_id: Number(periodId) });
    setPeriodId("");
    Swal.fire({ icon: "success", title: "Corrida creada", timer: 1500, showConfirmButton: false });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <Panel title="Corridas">
        <div className="mb-4 flex gap-2">
          <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">Seleccionar periodo...</option>
            {periods?.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={createRun} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Crear</button>
        </div>
        <div className="space-y-3">
          {runs?.data?.map((run) => (
            <button key={run.id} onClick={() => setSelectedRun(run.id)} className="w-full rounded-xl border border-gray-200 p-4 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
              <div className="flex items-center justify-between"><strong>{run.name}</strong><Badge status={run.status} /></div>
              <p className="mt-1 text-xs text-gray-500">{run.period?.period_start} → {run.period?.period_end} · {run.receipts_count ?? 0} recibos</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Detalle de corrida">
        {!detail ? <p className="text-sm text-gray-500">Selecciona una corrida.</p> : <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => generar.mutateAsync(detail.id)} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white">Calcular</button>
            <button onClick={() => aprobar.mutateAsync(detail.id)} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white">Aprobar</button>
            <button onClick={() => cerrar.mutateAsync(detail.id)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white">Cerrar</button>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <MetricMini title="Recibos" value={detail.totals?.receipts ?? 0} />
            <MetricMini title="Percepciones" value={money(detail.totals?.perceptions_total ?? 0)} />
            <MetricMini title="Deducciones" value={money(detail.totals?.deductions_total ?? 0)} />
            <MetricMini title="Neto" value={money(detail.totals?.net_total ?? 0)} />
          </div>
          <div className="max-h-[520px] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-white text-xs uppercase text-gray-400 dark:bg-gray-950"><tr><th className="py-3">Empleado</th><th>Días pagados</th><th>Faltas</th><th>Neto</th></tr></thead><tbody>
            {detail.receipts?.map((r) => <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800"><td className="py-3"><strong>{r.employee_name}</strong><br/><span className="text-xs text-gray-400">{r.employee_number} · {r.department_name ?? "—"}</span></td><td>{r.paid_days}</td><td>{r.absence_days}</td><td className="font-semibold">{money(r.net_total)}</td></tr>)}
          </tbody></table></div>
        </>}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">{title && <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}{children}</div>;
}

function MetricMini({ title, value }: { title: string; value: string | number }) {
  return <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-400">{title}</p><p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p></div>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: unknown; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-gray-500">{label}</span><input type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-gray-500">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">{options.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}</select></label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
}
