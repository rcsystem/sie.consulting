import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import {
  useRevisarComprobante,
  useSubirComprobante,
  useTravelReceipts,
} from "../../hooks/useTravels";
import type { TravelReceipt, TravelRequest } from "../../types/travels";

type Props = {
  solicitud: TravelRequest | null;
  onClose: () => void;
};

const CAMPO = "w-full rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const LABEL = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const ERR   = "mt-1 text-xs text-red-500";
const SECTION = "rounded-sm border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const SECTION_TITLE = "mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

const CATEGORIAS = [
  "Alimentación", "Transporte", "Hospedaje", "Combustible",
  "Peaje", "Taxi / Uber", "Vuelo", "Representación", "Otro",
];

const FORM_INICIAL = {
  expense_category: "", provider: "", amount: "",
  receipt_date: "", observations: "",
};

function badgeRecibo(s: string) {
  const b = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (s === "approved") return `${b} bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300`;
  if (s === "rejected") return `${b} bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300`;
  return `${b} bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300`;
}

export default function TravelReceiptsModal({ solicitud, onClose }: Props) {
  const abierto = solicitud !== null;

  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible]       = useState(false);
  const [form, setForm]             = useState({ ...FORM_INICIAL });
  const [pdfFile, setPdfFile]       = useState<File | null>(null);
  const [xmlFile, setXmlFile]       = useState<File | null>(null);
  const [errores, setErrores]       = useState<Record<string, string>>({});
  const pdfRef                      = useRef<HTMLInputElement>(null);
  const xmlRef                      = useRef<HTMLInputElement>(null);

  const { usuario, roles } = useAuthStore();
  const puedeRevisar = roles.some((r) =>
    ["rh", "admin", "super_admin", "manager"].includes(r)
  );
  const esDueno = (usuario?.id ?? 0) === solicitud?.user_id;

  const { data: recibos = [], isFetching } = useTravelReceipts(solicitud?.id ?? null);
  const subir   = useSubirComprobante(solicitud?.id ?? 0);
  const revisar = useRevisarComprobante(solicitud?.id ?? 0);

  // Animación slide-from-right
  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      const t = window.setTimeout(() => setVisible(true), 50);
      return () => window.clearTimeout(t);
    }
    setVisible(false);
    const t = window.setTimeout(() => {
      setRenderizar(false);
      setForm({ ...FORM_INICIAL });
      setPdfFile(null);
      setXmlFile(null);
      setErrores({});
    }, 300);
    return () => window.clearTimeout(t);
  }, [abierto]);

  if (!renderizar || !solicitud) return null;

  const set = (campo: string, valor: string) => {
    setForm((p) => ({ ...p, [campo]: valor }));
    setErrores((p) => { const n = { ...p }; delete n[campo]; return n; });
  };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.expense_category)                  e.expense_category = "Campo requerido";
    if (!form.amount || Number(form.amount) <= 0) e.amount           = "Ingresa un monto válido";
    if (!form.receipt_date)                       e.receipt_date     = "Campo requerido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubir = async () => {
    if (!validar()) return;
    await subir.mutateAsync({
      expense_category: form.expense_category,
      provider:         form.provider   || undefined,
      amount:           Number(form.amount),
      receipt_date:     form.receipt_date,
      observations:     form.observations || undefined,
      pdf:              pdfFile ?? undefined,
      xml:              xmlFile ?? undefined,
    });
    setForm({ ...FORM_INICIAL });
    setPdfFile(null);
    setXmlFile(null);
    if (pdfRef.current) pdfRef.current.value = "";
    if (xmlRef.current) xmlRef.current.value = "";
  };

  const handleRevisar = async (
    recibo: TravelReceipt,
    accion: "approve" | "reject"
  ) => {
    if (accion === "reject") {
      const { value: notas, isConfirmed } = await (window as any).Swal?.fire({
        title:            "Motivo de rechazo",
        input:            "textarea",
        inputLabel:       "¿Por qué se rechaza este comprobante?",
        showCancelButton: true,
        confirmButtonText:"Rechazar",
        cancelButtonText: "Volver",
        inputValidator:   (v: string) => (!v?.trim() ? "Escribe el motivo." : null),
      }) ?? { isConfirmed: false, value: "" };
      if (!isConfirmed || !notas) return;
      await revisar.mutateAsync({ receiptId: recibo.id, accion: "reject", review_notes: notas });
    } else {
      await revisar.mutateAsync({ receiptId: recibo.id, accion: "approve" });
    }
  };

  const totalComprobado = (recibos as TravelReceipt[])
    .filter((r) => r.status === "approved")
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const montoAprobado       = Number(solicitud.approved_amount ?? solicitud.estimated_amount);
  const diferencia          = montoAprobado - totalComprobado;
  const puedeSeguirComprobando = esDueno && solicitud.verification_status !== "completed";

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style:    "currency",
      currency: solicitud.currency_code,
    }).format(n);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="border-b border-white/10 px-6 py-5 text-white"
          style={{ backgroundColor: "#465fff" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Comprobación de gastos
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {solicitud.destination} · {solicitud.start_date}
                {solicitud.end_date !== solicitud.start_date
                  ? ` → ${solicitud.end_date}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
          <div className="grid grid-cols-1 gap-6">

            {/* Resumen financiero */}
            <section className={SECTION}>
              <h3 className={SECTION_TITLE}>Resumen financiero</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Monto aprobado",   valor: montoAprobado,   color: "text-green-600 dark:text-green-400" },
                  { label: "Total comprobado", valor: totalComprobado, color: "text-blue-600 dark:text-blue-400"  },
                  {
                    label: "Diferencia",
                    valor: diferencia,
                    color: diferencia >= 0
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-red-600 dark:text-red-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-sm border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className={`mt-1 text-base font-bold ${item.color}`}>
                      {fmt(item.valor)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Lista de comprobantes */}
            <section className={SECTION}>
              <h3 className={SECTION_TITLE}>
                Comprobantes ({(recibos as TravelReceipt[]).length})
              </h3>
              {isFetching ? (
                <p className="text-sm text-slate-500">Cargando comprobantes...</p>
              ) : (recibos as TravelReceipt[]).length === 0 ? (
                <p className="text-sm text-slate-400">
                  Sin comprobantes registrados aún.
                </p>
              ) : (
                <div className="space-y-3">
                  {(recibos as TravelReceipt[]).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-sm border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {r.expense_category}
                            </span>
                            <span className={badgeRecibo(r.status)}>
                              {r.status === "approved"
                                ? "Aprobado"
                                : r.status === "rejected"
                                ? "Rechazado"
                                : "Pendiente"}
                            </span>
                          </div>
                          {r.provider && (
                            <p className="mt-0.5 text-xs text-slate-500">{r.provider}</p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-500">{r.receipt_date as string}</p>
                          {r.review_notes && (
                            <p className="mt-1 text-xs text-red-500">
                              Nota: {r.review_notes}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {fmt(Number(r.amount))}
                          </p>
                          <div className="mt-1 flex justify-end gap-2">
                            {r.pdf_path && (
                              <a
                                href={`${import.meta.env.VITE_API_URL}/travel-requests/${solicitud.id}/receipts/${r.id}/download/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-500 underline"
                              >
                                PDF
                              </a>
                            )}
                            {r.xml_path && (
                              <a
                                href={`${import.meta.env.VITE_API_URL}/travel-requests/${solicitud.id}/receipts/${r.id}/download/xml`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-500 underline"
                              >
                                XML
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de revisión */}
                      {puedeRevisar && r.status === "pending" && (
                        <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => handleRevisar(r, "approve")}
                            disabled={revisar.isPending}
                            className="rounded-sm border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:border-green-800 dark:text-green-400"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevisar(r, "reject")}
                            disabled={revisar.isPending}
                            className="rounded-sm border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Agregar comprobante — solo el dueño */}
            {puedeSeguirComprobando && (
              <section className={SECTION}>
                <h3 className={SECTION_TITLE}>Agregar comprobante</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={LABEL}>Categoría de gasto *</label>
                    <select
                      className={CAMPO}
                      value={form.expense_category}
                      onChange={(e) => set("expense_category", e.target.value)}
                    >
                      <option value="">Selecciona la categoría</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errores.expense_category && (
                      <p className={ERR}>{errores.expense_category}</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>Proveedor / Razón social</label>
                    <input
                      className={CAMPO}
                      placeholder="Nombre del proveedor"
                      value={form.provider}
                      onChange={(e) => set("provider", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Fecha del comprobante *</label>
                    <input
                      type="date"
                      className={CAMPO}
                      value={form.receipt_date}
                      onChange={(e) => set("receipt_date", e.target.value)}
                    />
                    {errores.receipt_date && (
                      <p className={ERR}>{errores.receipt_date}</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>Monto *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={CAMPO}
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => set("amount", e.target.value)}
                    />
                    {errores.amount && <p className={ERR}>{errores.amount}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Observaciones</label>
                    <input
                      className={CAMPO}
                      placeholder="Notas adicionales"
                      value={form.observations}
                      onChange={(e) => set("observations", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Archivo PDF</label>
                    <input
                      ref={pdfRef}
                      type="file"
                      accept=".pdf"
                      className="text-sm text-slate-600 dark:text-slate-400"
                      onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                    {pdfFile && (
                      <p className="mt-1 text-xs text-slate-500">{pdfFile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>Archivo XML</label>
                    <input
                      ref={xmlRef}
                      type="file"
                      accept=".xml"
                      className="text-sm text-slate-600 dark:text-slate-400"
                      onChange={(e) => setXmlFile(e.target.files?.[0] ?? null)}
                    />
                    {xmlFile && (
                      <p className="mt-1 text-xs text-slate-500">{xmlFile.name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubir}
                    disabled={subir.isPending}
                    className="rounded-sm bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {subir.isPending ? "Subiendo..." : "Registrar comprobante"}
                  </button>
                </div>
              </section>
            )}

          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
