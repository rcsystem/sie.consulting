import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  useBiometricosZkteco,
  useCancelarComandoZkteco,
  useComandosZkteco,
  useConsultarUsuarioReloj,
  useRelojesZkteco,
  useReintentarComandoZkteco,
  useSincronizarUsuariosReloj,
  useUsuariosRelojZkteco,
} from "../../hooks/useZkteco";

import type { EstadoComandoZkteco, RelojZkteco } from "../../types/zkteco";

type TabActiva = "relojes" | "usuarios" | "biometria" | "comandos";

const COLOR_ZENDA = "#465fff";

function useValorConRetraso<T>(valor: T, retrasoMs = 400) {
  const [valorRetrasado, setValorRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setValorRetrasado(valor);
    }, retrasoMs);

    return () => window.clearTimeout(temporizador);
  }, [valor, retrasoMs]);

  return valorRetrasado;
}

function formatearFecha(valor?: string | null) {
  if (!valor) return "—";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(valor));
  } catch {
    return valor;
  }
}

function nombreEmpleado(registro: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  user_name?: string | null;
}) {
  const nombre = [registro.first_name, registro.middle_name, registro.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombre || registro.user_name || "Sin vincular";
}

function claseEstadoComando(estado: EstadoComandoZkteco) {
  const clases: Record<EstadoComandoZkteco, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    executed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return clases[estado] ?? clases.pending;
}

function etiquetaEstado(estado: EstadoComandoZkteco) {
  const etiquetas: Record<EstadoComandoZkteco, string> = {
    pending: "Pendiente",
    sent: "Enviado",
    executed: "Ejecutado",
    failed: "Fallido",
    cancelled: "Cancelado",
  };

  return etiquetas[estado] ?? estado;
}

function BadgeEstado({ estado }: { estado: EstadoComandoZkteco }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${claseEstadoComando(
        estado,
      )}`}
    >
      {etiquetaEstado(estado)}
    </span>
  );
}

function TabButton({
  activo,
  children,
  onClick,
}: {
  activo: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
        activo
          ? "bg-[#465fff] text-white shadow-sm"
          : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: number | string;
  descripcion: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
        {valor}
      </p>
      <p className="mt-1 text-xs text-slate-400">{descripcion}</p>
    </div>
  );
}

function RelojCard({ reloj }: { reloj: RelojZkteco }) {
  const enLinea = reloj.last_seen_at
    ? Date.now() - new Date(reloj.last_seen_at).getTime() < 2 * 60 * 1000
    : false;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {reloj.name || "Reloj sin nombre"}
          </h3>
          <p className="mt-1 text-xs font-mono text-slate-500">
            SN: {reloj.serial_number}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            IP detectada: {reloj.last_ip || "—"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            enLinea
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {enLinea ? "En línea" : "Sin conexión reciente"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-400">Última conexión</p>
          <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">
            {formatearFecha(reloj.last_seen_at)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-400">Usuarios</p>
          <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">
            {reloj.device_users_count}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-400">Pendientes</p>
          <p className="mt-1 font-bold text-amber-600">
            {reloj.pending_commands_count}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-400">Fallidos</p>
          <p className="mt-1 font-bold text-red-600">
            {reloj.failed_commands_count}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ZktecoDevicesPage() {
  const [tabActiva, setTabActiva] = useState<TabActiva>("relojes");
  const [estadoComando, setEstadoComando] = useState<EstadoComandoZkteco | "">(
    "",
  );
  const [pinBusqueda, setPinBusqueda] = useState("");
  const [deviceId, setDeviceId] = useState<number | "">("");
  const [pinConsulta, setPinConsulta] = useState("");
  const [deviceConsultaId, setDeviceConsultaId] = useState<number | "">("");

  const pinBusquedaFiltrado = useValorConRetraso(pinBusqueda.trim(), 400);

  const relojes = useRelojesZkteco();

  const comandos = useComandosZkteco(
    {
      status: estadoComando,
      employee_pin: pinBusquedaFiltrado,
      device_id: deviceId,
    },
    { enabled: tabActiva === "comandos" },
  );

  const usuariosReloj = useUsuariosRelojZkteco(
    {
      search: pinBusquedaFiltrado,
      device_id: deviceId,
    },
    { enabled: tabActiva === "usuarios" },
  );

  const biometricos = useBiometricosZkteco(
    {
      employee_pin: pinBusquedaFiltrado,
    },
    { enabled: tabActiva === "biometria" },
  );

  const consultarUsuario = useConsultarUsuarioReloj();
  const sincronizarUsuarios = useSincronizarUsuariosReloj();
  const reintentarComando = useReintentarComandoZkteco();
  const cancelarComando = useCancelarComandoZkteco();

  const resumen = useMemo(() => {
    const listaRelojes = relojes.data ?? [];

    return {
      relojes: listaRelojes.length,
      enLinea: listaRelojes.filter((reloj) => {
        if (!reloj.last_seen_at) return false;
        return (
          Date.now() - new Date(reloj.last_seen_at).getTime() < 2 * 60 * 1000
        );
      }).length,
      pendientes: listaRelojes.reduce(
        (total, reloj) => total + reloj.pending_commands_count,
        0,
      ),
      fallidos: listaRelojes.reduce(
        (total, reloj) => total + reloj.failed_commands_count,
        0,
      ),
    };
  }, [relojes.data]);

  const actualizarTodo = () => {
    relojes.refetch();

    if (tabActiva === "comandos") {
      comandos.refetch();
    }

    if (tabActiva === "usuarios") {
      usuariosReloj.refetch();
    }

    if (tabActiva === "biometria") {
      biometricos.refetch();
    }
  };

  const ejecutarConsulta = async () => {
    if (!deviceConsultaId || !pinConsulta.trim()) return;

    try {
      await consultarUsuario.mutateAsync({
        deviceId: Number(deviceConsultaId),
        employeePin: pinConsulta.trim(),
      });

      setPinConsulta("");
    } catch (error) {
      console.error("Error al consultar usuario desde reloj:", error);
      alert(
        "No se pudo consultar el usuario desde el reloj. Revisa la pestaña Comandos o la consola.",
      );
    }
  };

  const sincronizarUsuariosDelReloj = async (idReloj: number) => {
    try {
      await sincronizarUsuarios.mutateAsync(idReloj);
    } catch (error) {
      console.error("Error al sincronizar usuarios del reloj:", error);
      alert(
        "No se pudo enviar la sincronización al reloj. Revisa la pestaña Comandos o la consola.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#465fff]">
              Zenda by SISU
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Relojes checadores
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Administra relojes ZKTeco, usuarios enviados, tarjetas, huellas y
              comandos de sincronización. Este módulo complementa el panel de
              registros de entrada y salida.
            </p>
          </div>

          <button
            type="button"
            onClick={actualizarTodo}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TarjetaResumen
          titulo="Relojes registrados"
          valor={resumen.relojes}
          descripcion="Dispositivos activos/inactivos"
        />
        <TarjetaResumen
          titulo="En línea"
          valor={resumen.enLinea}
          descripcion="Conexión reciente"
        />
        <TarjetaResumen
          titulo="Pendientes"
          valor={resumen.pendientes}
          descripcion="Comandos por entregar"
        />
        <TarjetaResumen
          titulo="Fallidos"
          valor={resumen.fallidos}
          descripcion="Requieren revisión"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap gap-2">
          <TabButton
            activo={tabActiva === "relojes"}
            onClick={() => setTabActiva("relojes")}
          >
            Relojes
          </TabButton>
          <TabButton
            activo={tabActiva === "usuarios"}
            onClick={() => setTabActiva("usuarios")}
          >
            Usuarios
          </TabButton>
          <TabButton
            activo={tabActiva === "biometria"}
            onClick={() => setTabActiva("biometria")}
          >
            Biometría
          </TabButton>
          <TabButton
            activo={tabActiva === "comandos"}
            onClick={() => setTabActiva("comandos")}
          >
            Comandos
          </TabButton>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <input
            value={pinBusqueda}
            onChange={(evento) => setPinBusqueda(evento.target.value)}
            placeholder="Buscar PIN, empleado o nombre"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#465fff]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <select
            value={deviceId}
            onChange={(evento) =>
              setDeviceId(
                evento.target.value ? Number(evento.target.value) : "",
              )
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#465fff]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Todos los relojes</option>
            {(relojes.data ?? []).map((reloj) => (
              <option key={reloj.id} value={reloj.id}>
                {reloj.name || reloj.serial_number}
              </option>
            ))}
          </select>

          <select
            value={estadoComando}
            onChange={(evento) =>
              setEstadoComando(evento.target.value as EstadoComandoZkteco | "")
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#465fff]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="sent">Enviado</option>
            <option value="executed">Ejecutado</option>
            <option value="failed">Fallido</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <button
            type="button"
            onClick={actualizarTodo}
            className="rounded-xl bg-[#465fff] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#3548d4]"
          >
            Actualizar vista
          </button>
        </div>
      </div>

      {tabActiva === "relojes" && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Consultar usuario desde reloj
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Solicita al reloj los datos USERINFO y FINGERTMP para un PIN
              específico.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <select
                value={deviceConsultaId}
                onChange={(evento) =>
                  setDeviceConsultaId(
                    evento.target.value ? Number(evento.target.value) : "",
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#465fff]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Selecciona reloj</option>
                {(relojes.data ?? []).map((reloj) => (
                  <option key={reloj.id} value={reloj.id}>
                    {reloj.name || reloj.serial_number}
                  </option>
                ))}
              </select>

              <input
                value={pinConsulta}
                onChange={(evento) => setPinConsulta(evento.target.value)}
                placeholder="PIN / número de empleado"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#465fff]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <button
                type="button"
                onClick={ejecutarConsulta}
                disabled={
                  consultarUsuario.isPending ||
                  !deviceConsultaId ||
                  !pinConsulta.trim()
                }
                className="rounded-xl bg-[#465fff] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#3548d4] disabled:opacity-60"
              >
                {consultarUsuario.isPending
                  ? "Enviando..."
                  : "Consultar usuario"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {(relojes.data ?? []).map((reloj) => (
              <div key={reloj.id} className="space-y-3">
                <RelojCard reloj={reloj} />

                <button
                  type="button"
                  onClick={() => sincronizarUsuariosDelReloj(reloj.id)}
                  disabled={sincronizarUsuarios.isPending}
                  className="w-full rounded-xl border border-[#465fff]/20 bg-[#465fff]/10 px-4 py-2 text-sm font-bold text-[#465fff] hover:bg-[#465fff]/15 disabled:opacity-60"
                >
                  {sincronizarUsuarios.isPending
                    ? "Sincronizando..."
                    : "Sincronizar usuarios del reloj"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tabActiva === "usuarios" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  PIN
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Empleado Zenda
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Nombre reloj
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Tarjeta
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Reloj
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Última detección
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(usuariosReloj.data?.data ?? []).map((usuario) => (
                <tr
                  key={usuario.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">
                    {usuario.employee_pin}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800 dark:text-white">
                      {nombreEmpleado(usuario)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {usuario.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {usuario.name_from_device || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {usuario.card_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {usuario.device_name || usuario.device_serial || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatearFecha(usuario.last_seen_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tabActiva === "biometria" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  PIN
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Índice
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Tamaño
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Origen
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Capturado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(biometricos.data?.data ?? []).map((bio) => (
                <tr
                  key={bio.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">
                    {bio.employee_pin}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                    {nombreEmpleado(bio)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#465fff]/10 px-2.5 py-1 text-xs font-bold text-[#465fff]">
                      {bio.biometric_type === "fingerprint"
                        ? "Huella"
                        : bio.biometric_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {bio.template_index || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {bio.template_size || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {bio.source_device_name || bio.source_device_serial || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatearFecha(bio.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tabActiva === "comandos" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Reloj
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  PIN
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Intentos
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">
                  Respuesta
                </th>
                <th className="px-4 py-3 text-right font-bold text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(comandos.data?.data ?? []).map((comando) => (
                <tr
                  key={comando.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-mono text-slate-500">
                    #{comando.id}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    {comando.device_name || comando.device_serial || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">
                    {comando.employee_pin || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {comando.command_type}
                  </td>
                  <td className="px-4 py-3">
                    <BadgeEstado estado={comando.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {comando.attempts}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-500">
                    {comando.response_text || comando.error_message || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {comando.status !== "executed" && (
                        <button
                          type="button"
                          onClick={() => reintentarComando.mutate(comando.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          Reintentar
                        </button>
                      )}

                      {["pending", "sent", "failed"].includes(
                        comando.status,
                      ) && (
                        <button
                          type="button"
                          onClick={() => cancelarComando.mutate(comando.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
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
      )}

      <div className="rounded-2xl border border-[#465fff]/20 bg-[#465fff]/5 p-4 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-bold text-[#465fff]">Nota:</span> Las huellas y
        plantillas biométricas no se muestran completas por seguridad. Solo se
        visualiza el estado, origen, índice y tamaño.
      </div>
    </div>
  );
}
