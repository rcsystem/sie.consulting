/**
 * VacationPolicyPage
 *
 * Catálogo editable de la política de vacaciones de la empresa.
 * Solo visible para RH / admin / super_admin.
 *
 * Funciones:
 *   - Ver todas las reglas actuales (días por año de antigüedad)
 *   - Editar días de cualquier regla inline
 *   - Agregar reglas personalizadas
 *   - Restaurar tabla LFT 2023 base
 *   - Recalcular saldos de todos los empleados tras cambiar la política
 */
import { useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VacationPolicy {
  id: number;
  year_from: number;
  year_to: number;
  vacation_days: number;
  label: string;
  rango: string;
  source: string;
  source_label: string;
  is_active: boolean;
}

interface PolicyFormState {
  year_from: string;
  year_to: string;
  vacation_days: string;
  label: string;
  source: string;
}

const formVacio: PolicyFormState = {
  year_from:     "",
  year_to:       "",
  vacation_days: "",
  label:         "",
  source:        "empresa",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function usePolicies() {
  return useQuery({
    queryKey: ["vacation-policies"],
    queryFn: async () => {
      const { data } = await api.get<{ data: VacationPolicy[] }>("/vacation-policies");
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function badgeSource(source: string) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    lft:                 { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-800 dark:text-blue-300",   label: "LFT 2023" },
    empresa:             { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-300", label: "Empresa" },
    contrato_colectivo:  { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-800 dark:text-amber-300",  label: "Contrato col." },
  };
  const cfg = configs[source] ?? configs.empresa;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function VacationPolicyPage() {
  const qc = useQueryClient();
  const { data: politicas = [], isLoading } = usePolicies();

  // Fila en edición inline
  const [editandoId,  setEditandoId]  = useState<number | null>(null);
  const [editDias,    setEditDias]    = useState("");
  const [editLabel,   setEditLabel]   = useState("");
  const [editSource,  setEditSource]  = useState("empresa");

  // Form de nueva regla
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form,        setForm]        = useState<PolicyFormState>(formVacio);
  const [guardando,   setGuardando]   = useState(false);
  const [errorForm,   setErrorForm]   = useState<string | null>(null);

  // Año para recalcular
  const [anioRecalc, setAnioRecalc] = useState(new Date().getFullYear());

  // ── Edición inline ──────────────────────────────────────────────────────────

  const abrirEdicion = (p: VacationPolicy) => {
    setEditandoId(p.id);
    setEditDias(String(p.vacation_days));
    setEditLabel(p.label ?? "");
    setEditSource(p.source ?? "empresa");
  };

  const guardarEdicion = async (id: number) => {
    if (!editDias || isNaN(Number(editDias)) || Number(editDias) < 1) {
      Swal.fire({ icon: "error", title: "Valor inválido", text: "Los días deben ser un número mayor a 0." });
      return;
    }
    setGuardando(true);
    try {
      await api.put(`/vacation-policies/${id}`, {
        vacation_days: Number(editDias),
        label:         editLabel || undefined,
        source:        editSource,
      });
      qc.invalidateQueries({ queryKey: ["vacation-policies"] });
      setEditandoId(null);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el cambio." });
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (id: number, rango: string) => {
    const res = await Swal.fire({
      title: `¿Desactivar la regla "${rango}"?`,
      text: "Los saldos existentes no se modifican hasta recalcular.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      confirmButtonColor: "#EF4444",
    });
    if (!res.isConfirmed) return;
    await api.delete(`/vacation-policies/${id}`);
    qc.invalidateQueries({ queryKey: ["vacation-policies"] });
  };

  // ── Nueva regla ─────────────────────────────────────────────────────────────

  const crearRegla = async () => {
    setErrorForm(null);
    const from = Number(form.year_from);
    const to   = Number(form.year_to);
    const dias = Number(form.vacation_days);

    if (!from || !to || !dias) { setErrorForm("Todos los campos son requeridos."); return; }
    if (from > to)             { setErrorForm("El año inicial no puede ser mayor al final."); return; }
    if (dias < 1)              { setErrorForm("Los días deben ser al menos 1."); return; }

    setGuardando(true);
    try {
      await api.post("/vacation-policies", {
        year_from:     from,
        year_to:       to === 999 ? 999 : to,
        vacation_days: dias,
        label:         form.label || undefined,
        source:        form.source,
      });
      qc.invalidateQueries({ queryKey: ["vacation-policies"] });
      setMostrarForm(false);
      setForm(formVacio);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorForm(msg ?? "No se pudo crear la regla.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Restaurar LFT ───────────────────────────────────────────────────────────

  const restaurarLFT = async () => {
    const res = await Swal.fire({
      title: "¿Restaurar política LFT 2023?",
      html: `Se desactivarán todas las reglas actuales y se reemplazarán con la tabla oficial de la <b>Ley Federal del Trabajo (Art. 76, reforma 2023)</b>.<br><br>Los saldos existentes no cambian hasta que hagas un recálculo.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar LFT",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;

    await api.post("/vacation-policies/reset-lft");
    qc.invalidateQueries({ queryKey: ["vacation-policies"] });
    Swal.fire({ icon: "success", title: "Política LFT restaurada", timer: 2000, showConfirmButton: false });
  };

  // ── Recalcular saldos ───────────────────────────────────────────────────────

  const recalcular = async () => {
    const res = await Swal.fire({
      title: `¿Recalcular saldos ${anioRecalc}?`,
      html: `Se actualizarán los días correspondientes de <b>todos los empleados</b> activos para el año <b>${anioRecalc}</b> según la política actual.<br><br>Esta operación puede tardar unos segundos.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, recalcular",
    });
    if (!res.isConfirmed) return;

    const { data } = await api.post("/vacation-policies/recalculate", { year: anioRecalc });
    Swal.fire({
      icon: "success",
      title: "Recálculo completado",
      text: data.message,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const btnPrimario   = "inline-flex h-9 items-center rounded-sm bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60";
  const btnSecundario = "inline-flex h-9 items-center rounded-sm border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";
  const inputCls      = "w-full rounded-sm border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <>
      <PageMeta title="Política de vacaciones" description="Catálogo editable de días de vacaciones por antigüedad" />

      <div className="space-y-6 p-4 sm:p-6">

        {/* Encabezado */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Política de vacaciones
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Define cuántos días corresponden según años de antigüedad.
              Base: <span className="font-medium text-blue-600 dark:text-blue-400">Ley Federal del Trabajo Art. 76 — reforma 2023</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={restaurarLFT} className={btnSecundario}>
              Restaurar LFT base
            </button>
            <button onClick={() => setMostrarForm(true)} className={btnPrimario}>
              + Nueva regla
            </button>
          </div>
        </div>

        {/* Info LFT */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            ¿Qué dice la LFT 2023?
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Año 1: 12 días · Año 2: 14 · Año 3: 16 · Año 4: 18 · Año 5: 20 ·
            Años 6-10: +2 días por año · Años 11-15: 32 · Años 16-20: 34 · Años 21-25: 36 · Año 31+: 40
          </p>
          <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
            La empresa puede otorgar más días que la LFT, nunca menos. Al editar una regla, el origen cambia a "Empresa".
          </p>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Años de antigüedad</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">Días de vacaciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Etiqueta</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">Origen</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">Cargando política…</td></tr>
              ) : politicas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <p className="text-sm text-gray-500">No hay reglas configuradas.</p>
                    <button onClick={restaurarLFT} className="mt-3 text-sm text-blue-600 underline hover:text-blue-800">
                      Cargar tabla LFT 2023
                    </button>
                  </td>
                </tr>
              ) : (
                politicas.map((p) => (
                  <tr
                    key={p.id}
                    className={`bg-white dark:bg-gray-900 ${!p.is_active ? "opacity-40" : ""}`}
                  >
                    {/* Rango */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {p.year_to >= 999
                        ? `Año ${p.year_from} en adelante`
                        : p.year_from === p.year_to
                        ? `Año ${p.year_from}`
                        : `Años ${p.year_from} a ${p.year_to}`}
                    </td>

                    {/* Días — edición inline */}
                    <td className="px-4 py-3 text-center">
                      {editandoId === p.id ? (
                        <input
                          type="number"
                          value={editDias}
                          onChange={(e) => setEditDias(e.target.value)}
                          min={1}
                          max={365}
                          className={`${inputCls} w-20 text-center`}
                          autoFocus
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {p.vacation_days}
                        </span>
                      )}
                    </td>

                    {/* Etiqueta */}
                    <td className="px-4 py-3">
                      {editandoId === p.id ? (
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Ej: Año 1 – LFT"
                          className={inputCls}
                          maxLength={100}
                        />
                      ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-300">{p.label}</span>
                      )}
                    </td>

                    {/* Origen */}
                    <td className="px-4 py-3 text-center">
                      {editandoId === p.id ? (
                        <select
                          value={editSource}
                          onChange={(e) => setEditSource(e.target.value)}
                          className={inputCls}
                        >
                          <option value="lft">LFT</option>
                          <option value="empresa">Empresa</option>
                          <option value="contrato_colectivo">Contrato colectivo</option>
                        </select>
                      ) : (
                        badgeSource(p.source)
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      {editandoId === p.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => guardarEdicion(p.id)}
                            disabled={guardando}
                            className="rounded-sm bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-60"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className={btnSecundario}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {p.is_active && (
                            <button
                              onClick={() => abrirEdicion(p)}
                              className="rounded-sm border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            >
                              Editar
                            </button>
                          )}
                          {p.is_active && (
                            <button
                              onClick={() => desactivar(p.id, p.rango)}
                              className="rounded-sm border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Formulario nueva regla */}
        {mostrarForm && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/20">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Nueva regla de vacaciones</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Año desde *</label>
                <input
                  type="number" min={1} max={998}
                  value={form.year_from}
                  onChange={(e) => setForm((f) => ({ ...f, year_from: e.target.value }))}
                  placeholder="Ej: 1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Año hasta * (999 = en adelante)</label>
                <input
                  type="number" min={1}
                  value={form.year_to}
                  onChange={(e) => setForm((f) => ({ ...f, year_to: e.target.value }))}
                  placeholder="Ej: 5 o 999"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Días de vacaciones *</label>
                <input
                  type="number" min={1} max={365}
                  value={form.vacation_days}
                  onChange={(e) => setForm((f) => ({ ...f, vacation_days: e.target.value }))}
                  placeholder="Ej: 20"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Origen</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className={inputCls}
                >
                  <option value="empresa">Empresa</option>
                  <option value="lft">LFT</option>
                  <option value="contrato_colectivo">Contrato colectivo</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Etiqueta (opcional)</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ej: Años 1 a 5 — Beneficio empresa"
                  maxLength={100}
                  className={inputCls}
                />
              </div>
            </div>

            {errorForm && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorForm}</p>
            )}

            <div className="mt-4 flex gap-3">
              <button onClick={crearRegla} disabled={guardando} className={btnPrimario}>
                {guardando ? "Guardando…" : "Crear regla"}
              </button>
              <button onClick={() => { setMostrarForm(false); setForm(formVacio); setErrorForm(null); }} className={btnSecundario}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Recalcular saldos */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recalcular saldos de empleados</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Después de modificar la política, aplica los nuevos días a todos los empleados para el año seleccionado.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={anioRecalc}
              onChange={(e) => setAnioRecalc(Number(e.target.value))}
              className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <button onClick={recalcular} className={btnPrimario}>
              Recalcular saldos {anioRecalc}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
