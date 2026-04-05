import { useEffect, useState } from "react";
import api from "../../lib/api";
import type {
  RespuestaSolicitudPermiso,
  SolicitudPermiso,
} from "../../types/permissionRequests";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onGuardado: () => Promise<void> | void;
  solicitud: SolicitudPermiso | null;
};



export default function RejectPermissionRequestModal({
  abierto,
  onClose,
  onGuardado,
  solicitud,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (abierto) {
      setRenderizar(true);

      const frame = requestAnimationFrame(() => {
        setVisible(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);

    const temporizador = setTimeout(() => {
      setRenderizar(false);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    setMotivo("");
    setError("");
  }, [abierto]);

  const rechazar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitud) return;

    setGuardando(true);
    setError("");

    try {
      await api.patch<RespuestaSolicitudPermiso>(
        `/permission-requests/${solicitud.id}/reject`,
        {
          rejection_reason: motivo.trim(),
        },
      );

      await onGuardado();
      onClose();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "No fue posible rechazar la solicitud.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!renderizar) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] ${
        visible ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-gray-900 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-red-500 px-6 py-4 text-white">
          <div>
            <h2 className="text-xl font-semibold">Rechazar solicitud</h2>
            <p className="mt-1 text-sm text-white/80">
              Captura el motivo del rechazo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-white/90 hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={rechazar} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Solicitud de:
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {solicitud?.user?.full_name ?? "-"}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Motivo original:
              </p>
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {solicitud?.reason ?? "-"}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Motivo de rechazo
              </label>
              <textarea
                rows={6}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Describe el motivo del rechazo"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {guardando ? "Procesando..." : "Rechazar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
