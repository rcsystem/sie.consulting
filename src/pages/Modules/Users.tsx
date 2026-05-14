import { useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import type { UsuarioSistema } from "../../types/users";
import UserFormModal from "../../components/UserProfile/UserFormModal";
import { traducirRol } from "../../utils/roles";
import {
  useUsuarios,
  useUsuarioDetalle,
  useRoles,
  useDepartamentosCatalogo,
  useToggleEstatus,
} from "../../hooks/useUsers";

// ─── Tipos locales de importación ─────────────────────────────────────────────

type ErrorImportacion = {
  fila?: number | string;
  campo?: string;
  mensaje: string;
};

type RespuestaImportacion = {
  mensaje: string;
  resumen: { creados: number; actualizados: number; errores: number };
  errores: ErrorImportacion[];
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  // Filtros de búsqueda
  const [busqueda, setBusqueda]               = useState("");
  const [filtroActivo, setFiltroActivo]       = useState("");
  const [filtroRol, setFiltroRol]             = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina]       = useState(10);

  // Filtros "confirmados" — se actualizan solo al presionar Buscar
  const [filtrosActivos, setFiltrosActivos] = useState({
    search: "", is_active: "", role: "", department_id: "",
  });

  // Modal y usuario seleccionado para edición
  const [modalAbierto, setModalAbierto]   = useState(false);
  const [idEditar, setIdEditar]           = useState<number | null>(null);

  // Importación
  const inputArchivoRef                              = useRef<HTMLInputElement | null>(null);
  const [archivo, setArchivo]                        = useState<File | null>(null);
  const [subiendo, setSubiendo]                      = useState(false);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);
  const [errorImportacion, setErrorImportacion]      = useState<string | null>(null);
  const [resultadoImportacion, setResultadoImportacion] = useState<RespuestaImportacion | null>(null);

  // ── React Query ─────────────────────────────────────────────────────────────

  const { data: paginacion, isFetching: cargando } = useUsuarios({
    ...filtrosActivos,
    page:     paginaActual,
    per_page: porPagina,
  });

  // Solo se ejecuta cuando se selecciona un usuario para editar
  const { data: usuarioDetalle, isFetching: cargandoDetalle } = useUsuarioDetalle(idEditar);

  const { data: roles = [] }        = useRoles();
  const { data: departamentos = [] } = useDepartamentosCatalogo();
  const toggleEstatus                = useToggleEstatus();

  const usuarios  = paginacion?.data          ?? [];
  const total     = paginacion?.total         ?? 0;
  const ultimaPag = paginacion?.last_page     ?? 1;
  const desde     = paginacion?.from          ?? null;
  const hasta     = paginacion?.to            ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaActual(1);
    setFiltrosActivos({
      search:        busqueda,
      is_active:     filtroActivo,
      role:          filtroRol,
      department_id: filtroDepartamento,
    });
  };

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroActivo(""); setFiltroRol(""); setFiltroDepartamento("");
    setPaginaActual(1);
    setFiltrosActivos({ search: "", is_active: "", role: "", department_id: "" });
  };

  const abrirNuevo = () => {
    setIdEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = (usuario: UsuarioSistema) => {
    setIdEditar(usuario.id);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    // limpia el id después de que cierra la animación del modal
    setTimeout(() => setIdEditar(null), 300);
  };

  const cambiarEstatus = (usuario: UsuarioSistema) => {
    toggleEstatus.mutate(usuario.id);
  };

  // ── Exportar CSV ────────────────────────────────────────────────────────────

  const exportarUsuarios = async () => {
    try {
      const response = await api.get("/users/export", {
        params: {
          search:        filtrosActivos.search        || undefined,
          is_active:     filtrosActivos.is_active     || undefined,
          role:          filtrosActivos.role          || undefined,
          department_id: filtrosActivos.department_id || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] ?? "text/csv;charset=utf-8;",
      });
      const url   = window.URL.createObjectURL(blob);
      const link  = document.createElement("a");
      link.href   = url;
      link.setAttribute("download", "usuarios.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No fue posible exportar los usuarios.");
    }
  };

  // ── Importación ─────────────────────────────────────────────────────────────

  const descargarPlantilla = async () => {
    try {
      setDescargandoPlantilla(true);
      const response = await api.get("/users/import/template", {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] ??
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", "plantilla_usuarios.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setErrorImportacion(
        error?.response?.data?.message ?? "No fue posible descargar la plantilla."
      );
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  const cambiarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArchivo(e.target.files?.[0] ?? null);
    setErrorImportacion(null);
    setResultadoImportacion(null);
  };

  const subirArchivo = async () => {
    if (!archivo) {
      setErrorImportacion("Selecciona un archivo Excel antes de continuar.");
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const { data } = await api.post<RespuestaImportacion>("/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultadoImportacion(data);
      setPaginaActual(1);
      setFiltrosActivos((prev) => ({ ...prev })); // fuerza re-fetch
    } catch (error: any) {
      setErrorImportacion(
        error?.response?.data?.message ?? "No fue posible importar el archivo."
      );
    } finally {
      setSubiendo(false);
      setArchivo(null);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
    }
  };

  const limpiarImportacion = () => {
    setArchivo(null);
    setErrorImportacion(null);
    setResultadoImportacion(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta title="Usuarios | SIE" description="Administración de usuarios" />

      <div className="space-y-6">
        {/* Encabezado + acciones */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Usuarios</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Alta, edición, activación, consulta e importación masiva de usuarios.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <button
                type="button" onClick={descargarPlantilla} disabled={descargandoPlantilla}
                className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                {descargandoPlantilla ? "Descargando..." : "Descargar plantilla"}
              </button>

              <button
                type="button" onClick={() => inputArchivoRef.current?.click()} disabled={subiendo}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                {subiendo ? "Subiendo..." : "Importar Excel"}
              </button>

              <button
                type="button" onClick={subirArchivo} disabled={!archivo || subiendo}
                className="border border-brand-500 bg-brand-500 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {subiendo ? "Procesando..." : "Subir usuarios"}
              </button>

              <button
                type="button" onClick={exportarUsuarios}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
              >
                Exportar CSV
              </button>

              <button
                type="button" onClick={abrirNuevo}
                className="bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
              >
                Nuevo usuario
              </button>

              <input
                ref={inputArchivoRef} type="file" accept=".xlsx,.xls,.csv"
                className="hidden" onChange={cambiarArchivo}
              />
            </div>
          </div>

          {/* Archivo seleccionado */}
          {archivo && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-300">
              Archivo seleccionado: <span className="font-medium">{archivo.name}</span>
            </div>
          )}

          {/* Error importación */}
          {errorImportacion && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
              {errorImportacion}
            </div>
          )}

          {/* Resultado importación */}
          {resultadoImportacion && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-500/10">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Resultado de la importación
                  </h2>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                    {resultadoImportacion.mensaje}
                  </p>
                </div>
                <button
                  type="button" onClick={limpiarImportacion}
                  className="border border-green-300 px-4 py-2 text-sm font-medium text-green-700 dark:border-green-800 dark:text-green-300"
                >
                  Limpiar resultado
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(["creados", "actualizados", "errores"] as const).map((k) => (
                  <div key={k} className="rounded-2xl border border-green-200 bg-white p-4 dark:border-green-900 dark:bg-white/[0.03]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{k}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {resultadoImportacion.resumen[k]}
                    </p>
                  </div>
                ))}
              </div>

              {resultadoImportacion.errores.length > 0 && (
                <div className="mt-4 space-y-3">
                  {resultadoImportacion.errores.map((item, i) => (
                    <div
                      key={`${item.fila ?? "x"}-${i}`}
                      className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-300"
                    >
                      <p><span className="font-semibold">Fila:</span> {item.fila ?? "-"}</p>
                      <p><span className="font-semibold">Campo:</span> {item.campo ?? "-"}</p>
                      <p><span className="font-semibold">Mensaje:</span> {item.mensaje}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filtros */}
          <form
            onSubmit={buscar}
            className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5"
          >
            <input
              className="h-11 rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Buscar por nombre, correo, RFC, CURP o empleado"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="w-full border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
            >
              <option value="">Todos los estatus</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select
              className="w-full border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.name}>{traducirRol(rol.name)}</option>
              ))}
            </select>

            <select
              className="w-full border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-sm border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Buscar
              </button>
              <button
                type="button" onClick={limpiarFiltros}
                className="inline-flex h-11 items-center justify-center rounded-sm border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-800 dark:text-gray-100">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {["Empleado", "Nombre", "Correo", "Rol", "Departamento", "Estatus", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No hay usuarios disponibles.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800/60"
                    >
                      <td className="px-4 py-4">{usuario.employee_number ?? "-"}</td>
                      <td className="px-4 py-4">{usuario.full_name}</td>
                      <td className="px-4 py-4">{usuario.email}</td>
                      <td className="px-4 py-4">{traducirRol(usuario.role)}</td>
                      <td className="px-4 py-4">{usuario.department?.name ?? "-"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold ${
                            usuario.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {usuario.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button" onClick={() => abrirEditar(usuario)}
                            className="border border-gray-300 px-3 py-2 text-xs font-medium"
                          >
                            Editar
                          </button>
                          <button
                            type="button" onClick={() => cambiarEstatus(usuario)}
                            disabled={toggleEstatus.isPending}
                            className="border border-gray-300 px-3 py-2 text-xs font-medium disabled:opacity-60"
                          >
                            {usuario.is_active ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 md:flex-row md:items-center md:justify-between dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {total > 0
                ? <span>Mostrando {desde ?? 0} a {hasta ?? 0} de {total} usuarios</span>
                : <span>Sin registros</span>
              }
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={porPagina}
                onChange={(e) => { setPorPagina(Number(e.target.value)); setPaginaActual(1); }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} por página</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaActual((p) => p - 1)}
                  disabled={paginaActual <= 1}
                  className="border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  Anterior
                </button>

                <span className="px-3 text-sm text-gray-600 dark:text-gray-300">
                  Página {paginaActual} de {ultimaPag}
                </span>

                <button
                  type="button"
                  onClick={() => setPaginaActual((p) => p + 1)}
                  disabled={paginaActual >= ultimaPag}
                  className="border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal — recibe el detalle completo del usuario si está disponible */}
      <UserFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardado={cerrarModal}
        usuarioEditar={idEditar ? (usuarioDetalle ?? null) : null}
        cargandoDetalle={cargandoDetalle}
      />
    </>
  );
}
