import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import type {
  CatalogoBase,
  RespuestaPaginadaUsuarios,
  RolSistema,
  UsuarioSistema,
} from "../../types/users";
import UserFormModal from "../../components/UserProfile/UserFormModal";
import { traducirRol } from "../../utils/roles";

type ErrorImportacion = {
  fila?: number | string;
  campo?: string;
  mensaje: string;
};

type RespuestaImportacion = {
  mensaje: string;
  resumen: {
    creados: number;
    actualizados: number;
    errores: number;
  };
  errores: ErrorImportacion[];
};

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [roles, setRoles] = useState<RolSistema[]>([]);
  const [departamentos, setDepartamentos] = useState<CatalogoBase[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioSistema | null>(
    null,
  );

  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);

  const inputArchivoRef = useRef<HTMLInputElement | null>(null);

  const exportarUsuarios = async () => {
    try {
      const response = await api.get("/users/export", {
        params: {
          search: busqueda || undefined,
          is_active: filtroActivo !== "" ? filtroActivo : undefined,
          role: filtroRol || undefined,
          department_id: filtroDepartamento || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] ?? "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);

      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.setAttribute("download", "usuarios.csv");
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("No fue posible exportar usuarios.", error);
      alert("No fue posible exportar los usuarios.");
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [rolesRes, departamentosRes] = await Promise.all([
        api.get("/roles"),
        api.get("/catalogs/departments"),
      ]);

      setRoles(rolesRes.data);
      setDepartamentos(departamentosRes.data);
    } catch (error) {
      console.error("No fue posible cargar los catálogos de filtros.", error);
    }
  };

  const cargarUsuarios = async (pagina = paginaActual, limite = porPagina) => {
    setCargando(true);

    try {
      const { data } = await api.get<RespuestaPaginadaUsuarios>("/users", {
        params: {
          search: busqueda || undefined,
          is_active: filtroActivo !== "" ? filtroActivo : undefined,
          role: filtroRol || undefined,
          department_id: filtroDepartamento || undefined,
          page: pagina,
          per_page: limite,
        },
      });

      setUsuarios(data.data);
      setPaginaActual(data.current_page);
      setUltimaPagina(data.last_page);
      setTotal(data.total);
      setDesde(data.from ?? null);
      setHasta(data.to ?? null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarUsuarios(1, porPagina);
  }, []);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    await cargarUsuarios(1, porPagina);
  };

  const limpiarFiltros = async () => {
    setBusqueda("");
    setFiltroActivo("");
    setFiltroRol("");
    setFiltroDepartamento("");
    await cargarUsuarios(1, porPagina);
  };

  const abrirNuevo = () => {
    setUsuarioEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = async (usuario: UsuarioSistema) => {
    try {
      const response = await api.get(`/users/${usuario.id}`, {
        headers: {
          Accept: "application/json",
        },
      });

      setUsuarioEditar(response.data.user); // 🔥 AQUÍ está la clave
      setModalAbierto(true);
    } catch (error) {
      console.error("No fue posible cargar el detalle del usuario.", error);
      alert("No fue posible abrir el usuario para edición.");
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioEditar(null); // 🔥 importante
  };

  const cambiarEstatus = async (usuario: UsuarioSistema) => {
    await api.patch(`/users/${usuario.id}/toggle-status`);
    await cargarUsuarios(paginaActual, porPagina);
  };

  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [resultadoImportacion, setResultadoImportacion] =
    useState<RespuestaImportacion | null>(null);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);

  const descargarPlantilla = async () => {
    try {
      setDescargandoPlantilla(true);
      setErrorImportacion(null);

      const response = await api.get("/users/import/template", {
        responseType: "blob",
        headers: {
          Accept: "application/json",
        },
      });

      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ??
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.setAttribute("download", "plantilla_usuarios.xlsx");
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setErrorImportacion(
        error?.response?.data?.message ||
          "No fue posible descargar la plantilla.",
      );
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  const seleccionarArchivo = () => {
    inputArchivoRef.current?.click();
  };

  const cambiarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivoSeleccionado = event.target.files?.[0] ?? null;
    setArchivo(archivoSeleccionado);
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

      const { data } = await api.post<RespuestaImportacion>(
        "/users/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      setResultadoImportacion(data);
      await cargarUsuarios(1, porPagina);
    } catch (error: any) {
      setErrorImportacion(
        error?.response?.data?.message || "No fue posible importar el archivo.",
      );
    } finally {
      setSubiendo(false);
      if (inputArchivoRef.current) {
        inputArchivoRef.current.value = "";
      }
      setArchivo(null);
    }
  };

  const limpiarImportacion = () => {
    setArchivo(null);
    setErrorImportacion(null);
    setResultadoImportacion(null);
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }
  };

  
  return (
    <>
      <PageMeta
        title="Usuarios | SIE"
        description="Administración de usuarios"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-slate-900">
                Usuarios
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Alta, edición, activación, consulta e importación masiva de
                usuarios.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <button
                type="button"
                onClick={descargarPlantilla}
                disabled={descargandoPlantilla}
                className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                {descargandoPlantilla
                  ? "Descargando..."
                  : "Descargar plantilla"}
              </button>

              <button
                type="button"
                onClick={seleccionarArchivo}
                disabled={subiendo}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                {subiendo ? "Subiendo..." : "Importar Excel"}
              </button>

              <button
                type="button"
                onClick={subirArchivo}
                disabled={!archivo || subiendo}
                className="border border-brand-500 bg-brand-500 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {subiendo ? "Procesando..." : "Subir usuarios"}
              </button>

              <button
                type="button"
                onClick={exportarUsuarios}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
              >
                Exportar CSV
              </button>

              <button
                type="button"
                onClick={abrirNuevo}
                className="bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
              >
                Nuevo usuario
              </button>

              <input
                ref={inputArchivoRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={cambiarArchivo}
              />
            </div>
          </div>

          {archivo ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-300">
              Archivo seleccionado:{" "}
              <span className="font-medium">{archivo.name}</span>
            </div>
          ) : null}

          {errorImportacion ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
              {errorImportacion}
            </div>
          ) : null}

          {resultadoImportacion ? (
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
                  type="button"
                  onClick={limpiarImportacion}
                  className="border border-green-300 px-4 py-2 text-sm font-medium text-green-700 dark:border-green-800 dark:text-green-300"
                >
                  Limpiar resultado
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-green-200 bg-white p-4 dark:border-green-900 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Creados
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {resultadoImportacion.resumen.creados}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-200 bg-white p-4 dark:border-green-900 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Actualizados
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {resultadoImportacion.resumen.actualizados}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-200 bg-white p-4 dark:border-green-900 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Errores
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {resultadoImportacion.resumen.errores}
                  </p>
                </div>
              </div>

              {resultadoImportacion.errores.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {resultadoImportacion.errores.map((item, index) => (
                    <div
                      key={`${item.fila ?? "sin-fila"}-${index}`}
                      className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-300"
                    >
                      <p>
                        <span className="font-semibold">Fila:</span>{" "}
                        {item.fila ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Campo:</span>{" "}
                        {item.campo ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Mensaje:</span>{" "}
                        {item.mensaje}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={buscar}
            className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5 min-w-full text-left text-sm text-gray-800 dark:text-gray-100"
          >
            <input
              className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500"
              placeholder="Buscar por nombre, correo, RFC, CURP o empleado"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
            >
              <option value="">Todos los estatus</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select
              className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.name}>
                  {traducirRol(rol.name)}
                </option>
              ))}
            </select>

            <select
              className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.name}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Buscar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-800 dark:text-gray-100">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {[
                    "Empleado",
                    "Nombre",
                    "Correo",
                    "Rol",
                    "Departamento",
                    "Estatus",
                    "Acciones",
                  ].map((item) => (
                    <th
                      key={item}
                      className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300"
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No hay usuarios disponibles.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800/60"
                    >
                      <td className="px-4 py-4">
                        {usuario.employee_number ?? "-"}
                      </td>
                      <td className="px-4 py-4">{usuario.full_name}</td>
                      <td className="px-4 py-4">{usuario.email}</td>
                      <td className="px-4 py-4">{traducirRol(usuario.role)}</td>
                      <td className="px-4 py-4">
                        {usuario.department?.name ?? "-"}
                      </td>
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
                            type="button"
                            onClick={() => abrirEditar(usuario)}
                            className="border border-gray-300 px-3 py-2 text-xs font-medium"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => cambiarEstatus(usuario)}
                            className="border border-gray-300 px-3 py-2 text-xs font-medium"
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

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 md:flex-row md:items-center md:justify-between dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {total > 0 ? (
                <span>
                  Mostrando {desde ?? 0} a {hasta ?? 0} de {total} usuarios
                </span>
              ) : (
                <span>Sin registros</span>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="border border-gray-300 px-3 py-2 text-sm dark:text-white dark:border-gray-700 dark:bg-gray-900"
                name="paginacion"
                value={porPagina}
                onChange={async (e) => {
                  const nuevoLimite = Number(e.target.value);
                  setPorPagina(nuevoLimite);
                  await cargarUsuarios(1, nuevoLimite);
                }}
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cargarUsuarios(paginaActual - 1, porPagina)}
                  disabled={paginaActual <= 1}
                  className="border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white dark:bg-gray-900"
                >
                  Anterior
                </button>

                <span className="px-3 text-sm text-gray-600 dark:text-gray-300">
                  Página {paginaActual} de {ultimaPagina}
                </span>

                <button
                  type="button"
                  onClick={() => cargarUsuarios(paginaActual + 1, porPagina)}
                  disabled={paginaActual >= ultimaPagina}
                  className="border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white dark:bg-gray-900"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardado={() => cargarUsuarios(paginaActual, porPagina)}
        usuarioEditar={usuarioEditar}
      />
    </>
  );
}
