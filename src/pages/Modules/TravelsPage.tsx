import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/useAuthStore";
import type { TravelRequest } from "../../types/travels";
import {
  useAprobarViaje,
  useCancelarViaje,
  useTravelRequests,
  useTravelSummary,
} from "../../hooks/useTravels";
import TravelFormModal from "../../components/Travels/TravelFormModal";
import TravelReceiptsModal from "../../components/Travels/TravelReceiptsModal";
import TravelRejectModal from "../../components/Travels/TravelRejectModal";

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO o string de fecha a formato corto legible.
 * Ej: "2026-05-09T00:00:00.000000Z" → "09/May/26"
 *     "2026-05-09" → "09/May/26"
 */
function fmtFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  // Tomar solo la parte de fecha (YYYY-MM-DD) para evitar problemas de zona horaria
  const solo = valor.length > 10 ? valor.substring(0, 10) : valor;
  const [anio, mes, dia] = solo.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const numMes = parseInt(mes, 10) - 1;
  return `${dia}/${meses[numMes]}/${anio.slice(2)}`;
}

/**
 * Muestra el rango de fechas de forma compacta.
 * - Mismo día: "09/May/26"
 * - Rango: "09→12/May/26" si mismo mes/año
 * - Rango distinto mes: "09/May → 02/Jun/26"
 */
function fmtRango(inicio: string | null | undefined, fin: string | null | undefined, dias: number): string {
  if (!inicio) return "—";

  const soloInicio = (inicio.length > 10 ? inicio.substring(0, 10) : inicio);
  const soloFin    = fin ? (fin.length > 10 ? fin.substring(0, 10) : fin) : soloInicio;

  if (soloInicio === soloFin) return fmtFecha(soloInicio);

  const [aI, mI, dI] = soloInicio.split("-");
  const [aF, mF, dF] = soloFin.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Mismo mes y año → "09→12/May/26"
  if (mI === mF && aI === aF) {
    return `${dI}→${dF}/${meses[parseInt(mF,10)-1]}/${aF.slice(2)}`;
  }

  // Distinto mes → "09/May→02/Jun/26"
  return `${dI}/${meses[parseInt(mI,10)-1]}→${dF}/${meses[parseInt(mF,10)-1]}/${aF.slice(2)}`;
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function badgeEstatus(status: string) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  switch (status) {
    case "approved":  return `${base} bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300`;
    case "rejected":  return `${base} bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300`;
    case "cancelled": return `${base} bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300`;
    default:          return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300`;
  }
}

function etiquetaEstatus(s: string) {
  return { pending:"Pendiente", approved:"Aprobado", rejected:"Rechazado", cancelled:"Cancelado" }[s] ?? s;
}

function badgeVerificacion(s: string) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  return s === "completed" ? `${base} bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300`
    : s === "partial"      ? `${base} bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300`
    : `${base} bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`;
}

function etiquetaVerificacion(s: string) {
  return { pending:"Sin comprobar", partial:"Parcial", completed:"Completa" }[s] ?? s;
}

function formatMonto(monto: number | null | undefined, moneda = "MXN") {
  if (monto === null || monto === undefined) return "—";
  return new Intl.NumberFormat("es-MX", { style:"currency", currency: moneda }).format(monto);
}

// ─── Constantes UI ────────────────────────────────────────────────────────────

const TABS = [
  { value:"",          label:"Todos"      },
  { value:"pending",   label:"Pendientes" },
  { value:"approved",  label:"Aprobados"  },
  { value:"rejected",  label:"Rechazados" },
  { value:"cancelled", label:"Cancelados" },
];

const BTN_SEC = "inline-flex h-10 items-center justify-center rounded-sm border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const BTN_PRI = "inline-flex h-10 items-center justify-center rounded-sm bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TravelsPage() {
  const { roles, usuario } = useAuthStore();
  const puedeVerTodos  = roles.some((r) => ["rh","admin","super_admin"].includes(r));
  const puedeAutorizar = puedeVerTodos || roles.includes("manager");

  // Filtros borrador
  const [busqueda, setBusqueda]           = useState("");
  const [tipoSolicitud, setTipoSolicitud] = useState("");
  const [dateFrom, setDateFrom]           = useState("");
  const [soloMios, setSoloMios]           = useState(false);
  const [paginaActual, setPaginaActual]   = useState(1);

  // Filtros confirmados
  const [filtros, setFiltros] = useState({
    search:"", request_type:"", date_from:"", status:"", solo_mios:false,
  });

  // Modales
  const [modalNuevo, setModalNuevo]     = useState(false);
  const [modalRecibos, setModalRecibos] = useState<TravelRequest | null>(null);
  const [modalRechazo, setModalRechazo] = useState<TravelRequest | null>(null);

  // Queries
  const { data: paginado, isFetching } = useTravelRequests({
    ...filtros, page: paginaActual, per_page: 10,
  });
  const { data: resumen } = useTravelSummary();
  const aprobar           = useAprobarViaje();
  const cancelar          = useCancelarViaje();

  const solicitudes = paginado?.data      ?? [];
  const total       = paginado?.total     ?? 0;
  const ultimaPag   = paginado?.last_page ?? 1;
  const desde       = paginado?.from      ?? null;
  const hasta       = paginado?.to        ?? null;

  // Handlers
  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaActual(1);
    setFiltros({ search:busqueda, request_type:tipoSolicitud,
      date_from:dateFrom, status:filtros.status, solo_mios:soloMios });
  };

  const limpiar = () => {
    setBusqueda(""); setTipoSolicitud(""); setDateFrom(""); setSoloMios(false);
    setPaginaActual(1);
    setFiltros({ search:"", request_type:"", date_from:"", status:filtros.status, solo_mios:false });
  };

  const cambiarTab = (status: string) => {
    setPaginaActual(1);
    setFiltros((p) => ({ ...p, status }));
  };

  const handleAprobar = async (s: TravelRequest) => {
    await aprobar.mutateAsync({ id: s.id });
  };

  const handleCancelar = async (s: TravelRequest) => {
    const { value: motivo, isConfirmed } = await (window as any).Swal?.fire({
      title: "Cancelar solicitud",
      input: "textarea",
      inputLabel: "Motivo de cancelación",
      showCancelButton: true,
      confirmButtonText: "Cancelar solicitud",
      cancelButtonText: "Volver",
      reverseButtons: true,
      inputValidator: (v: string) => (!v?.trim() ? "Escribe el motivo." : null),
    }) ?? {};
    if (!isConfirmed || !motivo) return;
    await cancelar.mutateAsync({ id: s.id, cancel_reason: motivo.trim() });
  };

  // Métricas
  const tarjetas = resumen ? [
    { label:"Pendientes",         valor: resumen.pendientes,                                       color:"text-yellow-600 dark:text-yellow-400" },
    { label:"Aprobados este mes", valor: resumen.aprobados_mes,                                    color:"text-green-600 dark:text-green-400"  },
    { label:"Por comprobar",      valor: resumen.por_comprobar,                                    color:"text-orange-600 dark:text-orange-400"},
    { label:"Monto aprobado mes", valor: formatMonto(resumen.total_monto_mes),                     color:"text-blue-600 dark:text-blue-400"    },
  ] : [];

  return (
    <>
      <PageMeta title="Viáticos y Gastos | SIE" description="Solicitudes de viaje y reembolso de gastos" />

      <div className="space-y-6">

        {/* ── Encabezado ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Viáticos y Gastos</h1>
              <p className="mt-1 text-sm text-slate-500">Solicitudes de viaje y reembolso de gastos</p>
            </div>
            <button type="button" onClick={() => setModalNuevo(true)} className={BTN_PRI}>
              + Nueva solicitud
            </button>
          </div>

          {/* Métricas */}
          {tarjetas.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {tarjetas.map((t) => (
                <div key={t.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.label}</p>
                  <p className={`mt-1 text-xl font-bold ${t.color}`}>{t.valor}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
            {TABS.map((tab) => (
              <button key={tab.value} type="button" onClick={() => cambiarTab(tab.value)}
                className={`rounded-sm px-4 py-2 text-sm font-medium transition ${
                  filtros.status === tab.value
                    ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-600 hover:bg-white/70 dark:text-gray-300"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtros */}
          <form onSubmit={buscar} className="mt-6 grid grid-cols-1 gap-3 xl:grid-cols-5">
            <input
              className="xl:col-span-2 h-10 rounded-sm border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Buscar por destino, motivo o empleado"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              className="h-10 rounded-sm border border-slate-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={tipoSolicitud} onChange={(e) => setTipoSolicitud(e.target.value)}>
              <option value="">Viáticos y gastos</option>
              <option value="viatico">Solo viáticos</option>
              <option value="gasto">Solo gastos</option>
            </select>
            <input type="date"
              className="h-10 rounded-sm border border-slate-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <div className="flex gap-3">
              <button type="submit" className={BTN_SEC}>Buscar</button>
              <button type="button" onClick={limpiar} className={BTN_SEC}>Limpiar</button>
            </div>
          </form>

          {!puedeVerTodos && (
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={soloMios}
                onChange={(e) => {
                  setSoloMios(e.target.checked);
                  setPaginaActual(1);
                  setFiltros((p) => ({ ...p, solo_mios: e.target.checked }));
                }} />
              Ver solo mis solicitudes
            </label>
          )}
        </div>

        {/* ── Tabla ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-800 dark:text-gray-100">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {[
                    { label:"Tipo",          w:"w-20"    },
                    { label:"Solicitante",   w:"w-36"    },
                    { label:"Destino",       w:"w-32"    },
                    { label:"Fechas",        w:"w-36"    },  // columna compacta
                    { label:"Monto",         w:"w-28"    },
                    { label:"Estatus",       w:"w-24"    },
                    { label:"Comprobación",  w:"w-24"    },
                    { label:"Acciones",      w:""        },
                  ].map(({ label, w }) => (
                    <th key={label}
                      className={`${w} px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {isFetching && solicitudes.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">Cargando...</td></tr>
                ) : solicitudes.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">Sin solicitudes.</td></tr>
                ) : solicitudes.map((s) => (
                  <tr key={s.id} className={`transition hover:bg-slate-50 dark:hover:bg-white/[0.02] ${isFetching ? "opacity-60" : ""}`}>

                    {/* Tipo */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.request_type === "viatico"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                          : "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
                      }`}>
                        {s.request_type === "viatico" ? "Viático" : "Gasto"}
                      </span>
                    </td>

                    {/* Solicitante */}
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight">
                        {s.user?.full_name ?? `Usuario ${s.user_id}`}
                      </p>
                      {s.user?.employee_number && (
                        <p className="text-xs text-gray-400">{s.user.employee_number}</p>
                      )}
                    </td>

                    {/* Destino */}
                    <td className="max-w-[130px] truncate px-4 py-3 text-slate-700 dark:text-slate-300">
                      {s.request_type === "gasto"
                        ? (s.destination && s.destination !== "N/A" ? s.destination : "—")
                        : (s.destination ?? "—")}
                    </td>

                    {/* Fechas — compactas */}
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                        {fmtRango(s.start_date, s.end_date, s.days_count)}
                      </p>
                      {s.days_count > 1 && (
                        <p className="text-xs text-gray-400">{s.days_count} días</p>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap font-semibold text-slate-800 dark:text-white">
                        {formatMonto(s.approved_amount ?? s.estimated_amount, s.currency_code)}
                      </p>
                      {s.approved_amount !== null &&
                       s.approved_amount !== undefined &&
                       s.approved_amount !== s.estimated_amount && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatMonto(s.estimated_amount, s.currency_code)}
                        </p>
                      )}
                    </td>

                    {/* Estatus */}
                    <td className="px-4 py-3">
                      <span className={badgeEstatus(s.status)}>
                        {etiquetaEstatus(s.status)}
                      </span>
                    </td>

                    {/* Comprobación */}
                    <td className="px-4 py-3">
                      {s.status === "approved" ? (
                        <span className={badgeVerificacion(s.verification_status)}>
                          {etiquetaVerificacion(s.verification_status)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {/* Comprobar — dueño + aprobado */}
                        {s.status === "approved" && s.user_id === usuario?.id && (
                          <button type="button" onClick={() => setModalRecibos(s)}
                            className="rounded-sm border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400">
                            Comprobar
                          </button>
                        )}
                        {/* Ver comprobantes — manager/admin */}
                        {s.status === "approved" && puedeAutorizar && s.user_id !== usuario?.id && (
                          <button type="button" onClick={() => setModalRecibos(s)}
                            className="rounded-sm border border-slate-300 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50 dark:border-slate-700">
                            Comprobantes
                          </button>
                        )}
                        {/* Aprobar */}
                        {s.status === "pending" && puedeAutorizar && s.user_id !== usuario?.id && (
                          <button type="button" onClick={() => handleAprobar(s)}
                            disabled={aprobar.isPending}
                            className="rounded-sm border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:border-green-700 dark:text-green-400">
                            Aprobar
                          </button>
                        )}
                        {/* Rechazar */}
                        {s.status === "pending" && puedeAutorizar && s.user_id !== usuario?.id && (
                          <button type="button" onClick={() => setModalRechazo(s)}
                            className="rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400">
                            Rechazar
                          </button>
                        )}
                        {/* Cancelar — dueño + pendiente */}
                        {s.status === "pending" && s.user_id === usuario?.id && (
                          <button type="button" onClick={() => handleCancelar(s)}
                            disabled={cancelar.isPending}
                            className="rounded-sm border border-slate-300 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <p>
              {total > 0
                ? `Mostrando ${desde ?? 0} a ${hasta ?? 0} de ${total} solicitud${total !== 1 ? "es" : ""}`
                : "Sin registros"}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPaginaActual((p) => p - 1)}
                disabled={paginaActual <= 1 || isFetching} className={BTN_SEC}>‹</button>
              <span className="min-w-[80px] text-center">
                Pág. {paginaActual} de {ultimaPag}
              </span>
              <button type="button" onClick={() => setPaginaActual((p) => p + 1)}
                disabled={paginaActual >= ultimaPag || isFetching} className={BTN_SEC}>›</button>
            </div>
          </div>
        </div>

      </div>

      {/* Modales */}
      <TravelFormModal
        abierto={modalNuevo}
        onClose={() => setModalNuevo(false)}
      />
      <TravelReceiptsModal
        solicitud={modalRecibos}
        onClose={() => setModalRecibos(null)}
      />
      <TravelRejectModal
        solicitud={modalRechazo}
        onClose={() => setModalRechazo(null)}
        onGuardado={() => setModalRechazo(null)}
      />
    </>
  );
}
