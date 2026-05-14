/**
 * VacationsPage
 *
 * Módulo completo de vacaciones. Funciona para:
 *   - Empleado: ver sus solicitudes, saldo y crear nuevas
 *   - Manager/Director: aprobar solicitudes de su equipo
 *   - RH/Admin: vista completa, aprobación final y acceso a todos
 */
import { useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/useAuthStore";
import type { LeaveRequest } from "../../types/leaveAndAttendance";
import {
  useLeaveRequests,
  useMisVacaciones,
  useResumenVacaciones,
  useSaldoVacaciones,
  useCrearVacacion,
  useAprobarVacacionManager,
  useAprobarVacacionRh,
  useRechazarVacacion,
  useCancelarVacacion,
  useAprobarVacacion,
} from "../../hooks/useLeaveAndAttendance";
import VacationRequestFormModal from "../../components/Vacations/VacationRequestFormModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFecha(val: string | null | undefined): string {
  if (!val) return "—";
  const s = val.length > 10 ? val.substring(0, 10) : val;
  const [a, m, d] = s.split("-");
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${d}/${meses[parseInt(m, 10) - 1]}/${a.slice(2)}`;
}

function BadgeEstatus({ status }: { status: string }) {
  const clases: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    manager_approved:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels: Record<string, string> = {
    pending: "Pendiente",
    manager_approved: "Aprobado (jefe)",
    approved: "Aprobado",
    rejected: "Rechazado",
    cancelled: "Cancelado",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${clases[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function BadgeTipo({ tipo }: { tipo: string }) {
  const labels: Record<string, string> = {
    vacaciones: "Vacaciones",
    permiso_goce: "Perm. con goce",
    permiso_sin_goce: "Sin goce",
    incapacidad: "Incapacidad",
  };
  return (
    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
      {labels[tipo] ?? tipo}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function VacationsPage() {
  const { roles = [], usuario } = useAuthStore();
  const esRh = roles.some((r) => ["rh", "admin", "super_admin"].includes(r));
  const esJefe = roles.some((r) => ["manager", "director"].includes(r));
  const puedeAprobar = esRh || esJefe;

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [soloMios, setSoloMios] = useState(!esRh);
  const [pagina, setPagina] = useState(1);

  // Modal nuevo
  const [modalAbierto, setModalAbierto] = useState(false);

  // Modal rechazo
  const [motivoRechazoId, setMotivoRechazoId] = useState<number | null>(null);
  const [motivoCancelId, setMotivoCancelId] = useState<number | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");

  // Datos
  const { data, isFetching } = useLeaveRequests({
    status: filtroStatus || undefined,
    leave_type: filtroTipo || undefined,
    solo_mios: soloMios,
    page: pagina,
    per_page: 10,
  });

  const { data: resumen } = useResumenVacaciones();
  const { data: saldo } = useSaldoVacaciones();

  // Mutaciones
  const crearVacacion = useCrearVacacion();
  const rechazar = useRechazarVacacion();
  const cancelar = useCancelarVacacion();
  const aprobar = useAprobarVacacion();

  const handleCrear = async (
    payload: import("../../types/leaveAndAttendance").LeaveRequestPayload,
  ) => {
    await crearVacacion.mutateAsync(payload);
    setModalAbierto(false);
    Swal.fire({
      icon: "success",
      title: "Solicitud enviada",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleAprobar = async (id: number) => {
    const res = await Swal.fire({
      title: "¿Aprobar solicitud?",
      text: "La solicitud quedará aprobada y se descontará del saldo del empleado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;

    await aprobar.mutateAsync(id);
    Swal.fire({
      icon: "success",
      title: "Aprobado",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleRechazar = async () => {
    if (!motivoRechazoId || !motivoTexto.trim()) return;
    await rechazar.mutateAsync({
      id: motivoRechazoId,
      rejection_reason: motivoTexto,
    });
    setMotivoRechazoId(null);
    setMotivoTexto("");
    Swal.fire({
      icon: "info",
      title: "Solicitud rechazada",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleCancelar = async () => {
    if (!motivoCancelId || !motivoTexto.trim()) return;
    await cancelar.mutateAsync({
      id: motivoCancelId,
      cancel_reason: motivoTexto,
    });
    setMotivoCancelId(null);
    setMotivoTexto("");
    Swal.fire({
      icon: "info",
      title: "Solicitud cancelada",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const solicitudes = data?.data ?? [];
  const ultimaPagina = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  const btnPrimario =
    "inline-flex h-9 items-center rounded-sm bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60";
  const btnSecundario =
    "inline-flex h-9 items-center rounded-sm border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

  return (
    <>
      <PageMeta
        title="Vacaciones y Permisos"
        description="Solicitudes de vacaciones y ausencias"
      />

      <div className="space-y-5 p-4 sm:p-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Vacaciones y Permisos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestión de ausencias con y sin goce de sueldo
            </p>
          </div>
          <button onClick={() => setModalAbierto(true)} className={btnPrimario}>
            + Nueva solicitud
          </button>
        </div>

        {/* Tarjetas métricas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Saldo vacaciones */}
          {saldo && (
            <div className="col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Mi saldo {saldo.year}
              </p>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {saldo.available_days}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Disponibles
                  </div>
                </div>
                <div className="text-gray-400">/</div>
                <div className="text-center">
                  <div className="text-xl text-blue-600 dark:text-blue-400">
                    {saldo.entitled_days}
                  </div>
                  <div className="text-xs text-blue-500">
                    Corresponden (LFT)
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-blue-500">
                {saldo.seniority_years} año(s) de antigüedad
              </p>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Pendientes
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">
              {resumen?.pendientes ?? "—"}
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-300">
              Aprobadas {new Date().getFullYear()}
            </p>
            <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">
              {resumen?.aprobadas_anio ?? "—"}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setPagina(1);
            }}
            className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="manager_approved">Aprobado por jefe</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPagina(1);
            }}
            className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los tipos</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="permiso_goce">Con goce</option>
            <option value="permiso_sin_goce">Sin goce</option>
            <option value="incapacidad">Incapacidad</option>
          </select>

          {(esRh || esJefe) && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={soloMios}
                onChange={(e) => {
                  setSoloMios(e.target.checked);
                  setPagina(1);
                }}
                className="rounded"
              />
              Solo las mías
            </label>
          )}

          {total > 0 && (
            <p className="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
              {total} solicitud{total !== 1 ? "es" : ""}
            </p>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {!soloMios && (
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Empleado
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Período
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                    Días
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isFetching && solicitudes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-gray-400"
                    >
                      Cargando…
                    </td>
                  </tr>
                ) : solicitudes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-gray-400"
                    >
                      No hay solicitudes.
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((s: LeaveRequest) => (
                    <tr
                      key={s.id}
                      className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                    >
                      {!soloMios && (
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {s.user?.full_name ?? "—"}
                          {s.user?.employee_number && (
                            <div className="text-xs text-gray-400">
                              {s.user.employee_number}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <BadgeTipo tipo={s.leave_type} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {fmtFecha(s.start_date)} – {fmtFecha(s.end_date)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        {s.total_days}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstatus status={s.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {puedeAprobar && s.status === "pending" && (
                            <button
                              onClick={() => handleAprobar(s.id)}
                              className="rounded-sm bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600"
                            >
                              Aprobar
                            </button>
                          )}
                          
                          {puedeAprobar &&
                            ["pending", "manager_approved"].includes(
                              s.status,
                            ) && (
                              <button
                                onClick={() => {
                                  setMotivoRechazoId(s.id);
                                  setMotivoTexto("");
                                }}
                                className="rounded-sm bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                              >
                                Rechazar
                              </button>
                            )}
                          {/* Cancelar (propio) */}
                          {s.user_id === usuario?.id &&
                            ["pending", "manager_approved"].includes(
                              s.status,
                            ) && (
                              <button
                                onClick={() => {
                                  setMotivoCancelId(s.id);
                                  setMotivoTexto("");
                                }}
                                className="rounded-sm border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                              >
                                Cancelar
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {ultimaPagina > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Página {pagina} de {ultimaPagina}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className={btnSecundario}
                >
                  ‹ Anterior
                </button>
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(ultimaPagina, p + 1))
                  }
                  disabled={pagina === ultimaPagina}
                  className={btnSecundario}
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo */}
      <VacationRequestFormModal
        abierto={modalAbierto}
        saldo={saldo ?? null}
        onClose={() => setModalAbierto(false)}
        onSubmit={handleCrear}
      />

      {/* Modal rechazo */}
      {(motivoRechazoId || motivoCancelId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {motivoRechazoId ? "Motivo de rechazo" : "Motivo de cancelación"}
            </h3>
            <textarea
              value={motivoTexto}
              onChange={(e) => setMotivoTexto(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              placeholder="Describe el motivo…"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMotivoRechazoId(null);
                  setMotivoCancelId(null);
                }}
                className={btnSecundario}
              >
                Cancelar
              </button>
              <button
                onClick={motivoRechazoId ? handleRechazar : handleCancelar}
                disabled={!motivoTexto.trim()}
                className={`${btnPrimario} ${motivoRechazoId ? "bg-red-500 hover:bg-red-600" : ""}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
