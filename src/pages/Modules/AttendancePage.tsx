import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayRecord {
  work_date: string;
  first_check_in: string | null;
  last_check_out: string | null;
  worked_minutes: number;
  attendance_status: string;
  is_late: boolean;
  late_minutes: number;
  left_early: boolean;
  early_leave_minutes: number;
  has_overtime: boolean;
  overtime_minutes: number;
  is_justified: boolean;
}

interface EmployeeWeek {
  user_id: number;
  employee_number: string;
  full_name: string;
  position: string;
  department: string;
  avatar_initials: string;
  days: Record<string, DayRecord | null>;
  total_minutes: number;
  total_present: number;
  total_late: number;
  total_absent: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHora(val: string | null | undefined): string {
  if (!val) return "—";
  const t = val.includes("T") ? val.split("T")[1] : val;
  return t.substring(0, 5);
}

function fmtMinutos(min: number): string {
  if (!min) return "00:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getLunesDeUnaSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fechaStr(fecha: Date): string {
  return fecha.toISOString().split("T")[0];
}

function addDays(fecha: Date, n: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
}

const DIAS_SEMANA = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── Hook de datos ────────────────────────────────────────────────────────────

function useWeeklyAttendance(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["attendance", "weekly", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get("/attendance", {
        params: { date_from: dateFrom, date_to: dateTo, per_page: 100 },
      });
      return data;
    },
    staleTime: 30_000,
  });
}

// ─── Procesador de datos ──────────────────────────────────────────────────────

function procesarSemana(rawData: any[], diasSemana: string[]): EmployeeWeek[] {
  const mapa: Record<number, EmployeeWeek> = {};

  for (const r of rawData) {
    const uid = r.user_id;
    if (!mapa[uid]) {
      mapa[uid] = {
        user_id:         uid,
        employee_number: r.user?.employee_number ?? "—",
        full_name:       r.user?.full_name ?? "Sin nombre",
        position:        r.user?.position ?? "",
        department:      r.user?.department ?? "",
        avatar_initials: iniciales(r.user?.full_name ?? "?"),
        days:            Object.fromEntries(diasSemana.map((d) => [d, null])),
        total_minutes:   0,
        total_present:   0,
        total_late:      0,
        total_absent:    0,
      };
    }
    const emp = mapa[uid];
    const fecha = r.work_date;
    if (diasSemana.includes(fecha)) {
      emp.days[fecha] = r;
      emp.total_minutes += r.worked_minutes ?? 0;
      if (["present", "late"].includes(r.attendance_status)) emp.total_present++;
      if (r.is_late) emp.total_late++;
      if (["unjustified_absence", "justified_absence", "absent"].includes(r.attendance_status)) emp.total_absent++;
    }
  }

  return Object.values(mapa).sort((a, b) => a.full_name.localeCompare(b.full_name));
}

// ─── Sub-componente celda de día ──────────────────────────────────────────────

function DayCell({ day }: { day: DayRecord | null }) {
  if (!day) {
    return (
      <td className="px-2 py-2 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="w-full rounded text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 px-1 py-0.5">—</span>
          <span className="w-full rounded text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 px-1 py-0.5">—</span>
          <span className="w-full rounded text-xs font-bold bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 px-1 py-0.5">—</span>
        </div>
      </td>
    );
  }

  const { attendance_status, first_check_in, last_check_out, worked_minutes, is_late, late_minutes, has_overtime, overtime_minutes, left_early, is_justified } = day;

  const esFalta = ["unjustified_absence", "absent"].includes(attendance_status);
  const esFaltaJust = attendance_status === "justified_absence";
  const esDescanso = ["weekend", "holiday"].includes(attendance_status);

  if (esDescanso) {
    return (
      <td className="px-2 py-2 text-center">
        <div className="flex flex-col items-center justify-center gap-1 h-full">
          <span className="w-full rounded px-2 py-2 text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
            Descanso
          </span>
        </div>
      </td>
    );
  }

  if (esFalta) {
    return (
      <td className="px-2 py-2 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="w-full rounded px-2 py-1.5 text-xs font-bold bg-red-500 text-white tracking-wide">
            FALTA
          </span>
        </div>
      </td>
    );
  }

  if (esFaltaJust) {
    return (
      <td className="px-2 py-2 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="w-full rounded px-2 py-1.5 text-xs font-bold bg-blue-400 text-white tracking-wide">
            JUSTIF.
          </span>
        </div>
      </td>
    );
  }

  const entradaColor = is_late ? "bg-amber-500 text-white" : "bg-emerald-500 text-white";
  const salidaColor  = last_check_out
    ? left_early
      ? "bg-orange-400 text-white"
      : "bg-emerald-600 text-white"
    : "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  const horasColor   = has_overtime
    ? "bg-purple-500 text-white"
    : "bg-sky-500 text-white";

  return (
    <td className="px-2 py-2">
      <div className="flex flex-col gap-1 min-w-[80px]">
        {/* Entrada */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 w-5">ENT</span>
          <span className={`flex-1 rounded text-[11px] font-semibold text-center py-0.5 ${entradaColor}`}>
            {fmtHora(first_check_in)}
            {is_late && (
              <span className="ml-1 text-[9px] opacity-80">+{late_minutes}m</span>
            )}
          </span>
        </div>

        {/* Salida */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 w-5">SAL</span>
          <span className={`flex-1 rounded text-[11px] font-semibold text-center py-0.5 ${salidaColor}`}>
            {last_check_out ? fmtHora(last_check_out) : "SIN SALIDA"}
          </span>
        </div>

        {/* Horas trabajadas */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 w-5">HRS</span>
          <span className={`flex-1 rounded text-[11px] font-bold text-center py-0.5 ${horasColor}`}>
            {fmtMinutos(worked_minutes)}
            {has_overtime && (
              <span className="ml-1 text-[9px] opacity-80">+{fmtMinutos(overtime_minutes)}</span>
            )}
          </span>
        </div>
      </div>
    </td>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AttendancePage() {
  const { roles = [] } = useAuthStore();
  const esRh = roles.some((r) => ["rh", "admin", "super_admin"].includes(r));

  // Semana actual por defecto
  const [lunesSemana, setLunesSemana] = useState(() => getLunesDeUnaSemana(new Date()));
  const [busqueda,    setBusqueda]    = useState("");
  const [filtroDept,  setFiltroDept]  = useState("");
  const [perPage,     setPerPage]     = useState(10);
  const [pagina,      setPagina]      = useState(1);

  // Calcular días de la semana
  const diasSemana = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => fechaStr(addDays(lunesSemana, i))),
    [lunesSemana]
  );

  const dateFrom = diasSemana[0];
  const dateTo   = diasSemana[6];

  const { data: rawData, isFetching } = useWeeklyAttendance(dateFrom, dateTo);

  // Procesar y filtrar
  const empleados = useMemo(() => {
    const lista = procesarSemana(rawData?.data ?? [], diasSemana);
    return lista.filter((e) => {
      const matchBusq = !busqueda || e.full_name.toLowerCase().includes(busqueda.toLowerCase()) || e.employee_number.includes(busqueda);
      const matchDept = !filtroDept || e.department.toLowerCase().includes(filtroDept.toLowerCase());
      return matchBusq && matchDept;
    });
  }, [rawData, diasSemana, busqueda, filtroDept]);

  const totalPaginas = Math.ceil(empleados.length / perPage);
  const empleadosPag = empleados.slice((pagina - 1) * perPage, pagina * perPage);

  // Navegación de semanas
  const irSemanaAnterior  = () => { setLunesSemana((d) => addDays(d, -7)); setPagina(1); };
  const irSemanaSiguiente = () => { setLunesSemana((d) => addDays(d, 7));  setPagina(1); };
  const irSemanaActual    = () => { setLunesSemana(getLunesDeUnaSemana(new Date())); setPagina(1); };

  const labelSemana = () => {
    const fin = addDays(lunesSemana, 6);
    const f = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
    return `${f(lunesSemana)} — ${f(fin)}`;
  };

  // Totales globales semana
  const totales = useMemo(() => ({
    presentes: empleados.reduce((s, e) => s + e.total_present, 0),
    retardos:  empleados.reduce((s, e) => s + e.total_late, 0),
    faltas:    empleados.reduce((s, e) => s + e.total_absent, 0),
  }), [empleados]);

  const btnNav = "h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-bold";

  return (
    <>
      <PageMeta title="Asistencia" description="Control semanal de asistencia" />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-4">

        {/* ── Encabezado ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Control de Asistencia
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Registros de entrada y salida — ZKTeco
            </p>
          </div>

          {/* Navegador de semana */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
            <button onClick={irSemanaAnterior} className={btnNav}>‹</button>
            <div className="text-center px-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Semana</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">{labelSemana()}</p>
            </div>
            <button onClick={irSemanaSiguiente} className={btnNav}>›</button>
            <button onClick={irSemanaActual} className="ml-1 h-8 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600 transition">
              Hoy
            </button>
          </div>
        </div>

        {/* ── Métricas rápidas ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Empleados", val: empleados.length, color: "text-slate-800 dark:text-white", bg: "bg-white dark:bg-slate-900" },
            { label: "Asistencias", val: totales.presentes, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Retardos", val: totales.retardos, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Faltas", val: totales.faltas, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm`}>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* ── Filtros ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
          {/* Busqueda */}
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar empleado o número..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Depto */}
          <input
            type="text"
            value={filtroDept}
            onChange={(e) => { setFiltroDept(e.target.value); setPagina(1); }}
            placeholder="Departamento..."
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-36"
          />

          {/* Registros por página */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-xs">Ver</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPagina(1); }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-xs whitespace-nowrap">registros / página</span>
          </div>

          <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
            {empleados.length} empleado{empleados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Tabla semanal ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[200px]">
                    Empleado
                  </th>
                  {diasSemana.map((fecha, i) => {
                    const d = new Date(fecha + "T12:00:00");
                    const esHoy = fecha === fechaStr(new Date());
                    const esFinde = i >= 5;
                    return (
                      <th
                        key={fecha}
                        className={`px-2 py-3 text-center text-xs font-bold uppercase tracking-wider min-w-[100px] ${
                          esHoy
                            ? "text-brand-600 dark:text-brand-400"
                            : esFinde
                            ? "text-slate-400 dark:text-slate-600"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <div>{DIAS_SEMANA[i]}</div>
                        <div className={`text-[10px] font-normal mt-0.5 ${esHoy ? "text-brand-500" : "text-slate-400"}`}>
                          {String(d.getDate()).padStart(2,"0")}/{MESES[d.getMonth()]}
                          {esHoy && <span className="ml-1 rounded-full bg-brand-500 px-1 text-white text-[9px]">HOY</span>}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[80px]">
                    Total<br/>
                    <span className="text-[10px] font-normal">Horas</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isFetching && empleadosPag.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        Cargando registros...
                      </div>
                    </td>
                  </tr>
                ) : empleadosPag.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-sm text-slate-400">
                      No hay registros para esta semana.
                    </td>
                  </tr>
                ) : (
                  empleadosPag.map((emp, idx) => (
                    <tr
                      key={emp.user_id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        idx % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/20"
                      }`}
                    >
                      {/* Info empleado */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                              {emp.avatar_initials}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                              {emp.full_name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                              {emp.position || emp.department || "—"}
                            </p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600">
                              Núm. {emp.employee_number}
                            </p>
                          </div>
                        </div>

                        {/* Mini badges de resumen */}
                        <div className="mt-1.5 flex gap-1">
                          {emp.total_present > 0 && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              ✓ {emp.total_present}
                            </span>
                          )}
                          {emp.total_late > 0 && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              ⚡ {emp.total_late}
                            </span>
                          )}
                          {emp.total_absent > 0 && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              ✗ {emp.total_absent}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Días */}
                      {diasSemana.map((fecha) => (
                        <DayCell key={fecha} day={emp.days[fecha]} />
                      ))}

                      {/* Total horas semana */}
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-base font-bold text-slate-800 dark:text-white tabular-nums">
                            {fmtMinutos(emp.total_minutes)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">horas</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {((pagina - 1) * perPage) + 1}–{Math.min(pagina * perPage, empleados.length)} de {empleados.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  ‹ Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                      pagina === n
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 dark:text-slate-500">
          {[
            { color: "bg-emerald-500", label: "Entrada puntual" },
            { color: "bg-amber-500",   label: "Retardo" },
            { color: "bg-sky-500",     label: "Horas trabajadas" },
            { color: "bg-purple-500",  label: "Horas extra" },
            { color: "bg-orange-400",  label: "Salida anticipada" },
            { color: "bg-red-500",     label: "Falta injustificada" },
            { color: "bg-blue-400",    label: "Falta justificada" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
              {label}
            </span>
          ))}
        </div>

      </div>
    </>
  );
}
