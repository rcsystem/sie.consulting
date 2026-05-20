import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/useAuthStore";
import type { LeaveRequest } from "../../types/leaveAndAttendance";
import {
  useAprobarVacacion,
  useLeaveRequests,
  useRechazarVacacion,
} from "../../hooks/useLeaveAndAttendance";

function fmtFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const fecha = valor.length > 10 ? valor.substring(0, 10) : valor;
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function BadgeEstatus({ status }: { status: string }) {
  const clases: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    manager_approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };

  const etiquetas: Record<string, string> = {
    pending: "Pendiente",
    approved: "Autorizada",
    rejected: "Rechazada",
    cancelled: "Cancelada",
    manager_approved: "Aprobada por jefe",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${clases[status] ?? "bg-gray-100 text-gray-700"}`}>
      {etiquetas[status] ?? status}
    </span>
  );
}

function BadgeTipo({ tipo }: { tipo: string }) {
  const etiquetas: Record<string, string> = {
    vacaciones: "Vacaciones",
    permiso_goce: "Permiso con goce",
    permiso_sin_goce: "Permiso sin goce",
    incapacidad: "Incapacidad",
  };

  return (
    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
      {etiquetas[tipo] ?? tipo}
    </span>
  );
}

export default function AuthorizeVacationRequestsPage() {
  const { roles = [] } = useAuthStore();
  const puedeAutorizarGlobal = roles.some((rol) => ["super_admin", "admin", "rh"].includes(rol));

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("pending");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [rechazoId, setRechazoId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const filtros = useMemo(
    () => ({
      page: pagina,
      per_page: 15,
      solo_mios: false,
      search: busqueda.trim() || undefined,
      status: filtroStatus || undefined,
      leave_type: filtroTipo || undefined,
      date_from: fechaDesde || undefined,
      date_to: fechaHasta || undefined,
    }),
    [busqueda, fechaDesde, fechaHasta, filtroStatus, filtroTipo, pagina],
  );

  const { data, isFetching } = useLeaveRequests(filtros);
  const aprobar = useAprobarVacacion();
  const rechazar = useRechazarVacacion();

  const solicitudes = data?.data ?? [];
  const total = data?.total ?? 0;
  const ultimaPagina = data?.last_page ?? 1;
  const totalPendientesVista = solicitudes.filter((solicitud) => solicitud.status === "pending").length;

  const btnSecundario =
    "inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroStatus("pending");
    setFiltroTipo("");
    setFechaDesde("");
    setFechaHasta("");
    setPagina(1);
  };

  const handleAprobar = async (solicitud: LeaveRequest) => {
    const respuesta = await Swal.fire({
      title: "¿Autorizar vacaciones?",
      text: `Se autorizará la solicitud de ${solicitud.user?.full_name ?? "este empleado"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, autorizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });

    if (!respuesta.isConfirmed) return;

    await aprobar.mutateAsync(solicitud.id);

    Swal.fire({
      icon: "success",
      title: "Solicitud autorizada",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handleRechazar = async () => {
    if (!rechazoId || !motivoRechazo.trim()) return;

    await rechazar.mutateAsync({
      id: rechazoId,
      rejection_reason: motivoRechazo.trim(),
    });

    setRechazoId(null);
    setMotivoRechazo("");

    Swal.fire({
      icon: "info",
      title: "Solicitud rechazada",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  if (!puedeAutorizarGlobal) {
    return (
      <div className="p-6">
        <PageMeta title="Autorizar vacaciones" description="Autorización global de vacaciones" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <h1 className="text-lg font-semibold">Sin acceso</h1>
          <p className="mt-1 text-sm">Solo super admin, admin y RH pueden entrar a este apartado.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Autorizar vacaciones" description="Autorización global de vacaciones y ausencias" />

      <div className="space-y-5 p-4 sm:p-6">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 p-5 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Vacaciones</p>
              <h1 className="mt-1 text-2xl font-bold">Autorizar vacaciones</h1>
              <p className="mt-1 text-sm text-white/80">
                Vista global para super admin, admin y RH. Aquí puedes revisar solicitudes de todos los usuarios.
              </p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 text-right backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Pendientes en vista</p>
              <p className="text-2xl font-bold">{totalPendientesVista}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
            <input
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
              placeholder="Buscar empleado, nómina o motivo..."
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />

            <select
              value={filtroStatus}
              onChange={(evento) => {
                setFiltroStatus(evento.target.value);
                setPagina(1);
              }}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Autorizadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <select
              value={filtroTipo}
              onChange={(evento) => {
                setFiltroTipo(evento.target.value);
                setPagina(1);
              }}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">Todos los tipos</option>
              <option value="vacaciones">Vacaciones</option>
              <option value="permiso_goce">Permiso con goce</option>
              <option value="permiso_sin_goce">Permiso sin goce</option>
              <option value="incapacidad">Incapacidad</option>
            </select>

            <input
              type="date"
              value={fechaDesde}
              onChange={(evento) => {
                setFechaDesde(evento.target.value);
                setPagina(1);
              }}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />

            <input
              type="date"
              value={fechaHasta}
              onChange={(evento) => {
                setFechaHasta(evento.target.value);
                setPagina(1);
              }}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />

            <button onClick={limpiarFiltros} className={btnSecundario} type="button">
              Limpiar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Solicitudes</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>
            </div>
            {isFetching && <span className="text-xs text-brand-500">Actualizando...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Empleado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Periodo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Días</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                      No hay solicitudes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900 dark:text-white">{solicitud.user?.full_name ?? "—"}</div>
                        <div className="text-xs text-gray-500">
                          Nómina: {solicitud.user?.employee_number ?? "—"}
                        </div>
                        {(solicitud.user?.department || solicitud.user?.position) && (
                          <div className="mt-1 text-xs text-gray-400">
                            {solicitud.user?.department?.name ?? "Sin departamento"} · {solicitud.user?.position?.name ?? "Sin puesto"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><BadgeTipo tipo={solicitud.leave_type} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {fmtFecha(solicitud.start_date)} – {fmtFecha(solicitud.end_date)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">{solicitud.total_days}</td>
                      <td className="max-w-xs px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <span className="line-clamp-2">{solicitud.reason || "—"}</span>
                      </td>
                      <td className="px-4 py-3"><BadgeEstatus status={solicitud.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {solicitud.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleAprobar(solicitud)}
                              disabled={aprobar.isPending}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              Autorizar
                            </button>
                            <button
                              onClick={() => {
                                setRechazoId(solicitud.id);
                                setMotivoRechazo("");
                              }}
                              disabled={rechazar.isPending}
                              className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {ultimaPagina > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
              <p className="text-sm text-gray-500">Página {pagina} de {ultimaPagina}</p>
              <div className="flex gap-2">
                <button onClick={() => setPagina((valor) => Math.max(1, valor - 1))} disabled={pagina === 1} className={btnSecundario}>Anterior</button>
                <button onClick={() => setPagina((valor) => Math.min(ultimaPagina, valor + 1))} disabled={pagina === ultimaPagina} className={btnSecundario}>Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {rechazoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rechazar solicitud</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Captura el motivo del rechazo.</p>
            <textarea
              value={motivoRechazo}
              onChange={(evento) => setMotivoRechazo(evento.target.value)}
              rows={4}
              className="mt-4 w-full rounded-md border border-gray-300 p-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder="Motivo del rechazo..."
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRechazoId(null);
                  setMotivoRechazo("");
                }}
                className={btnSecundario}
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={!motivoRechazo.trim() || rechazar.isPending}
                className="inline-flex h-9 items-center rounded-md bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
