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

  const abrirEditar = (usuario: UsuarioSistema) => {
    setUsuarioEditar(usuario);
    setModalAbierto(true);
  };

  const cambiarEstatus = async (usuario: UsuarioSistema) => {
    await api.patch(`/users/${usuario.id}/toggle-status`);
    await cargarUsuarios(paginaActual, porPagina);
  };

  const descargarPlantilla = () => {
    const encabezados = [
      "employee_number",
      "first_name",
      "last_name",
      "middle_name",
      "email",
      "personal_email",
      "phone",
      "mobile_phone",
      "address",
      "neighborhood",
      "city",
      "state",
      "postal_code",
      "social_security_number",
      "curp",
      "rfc",
      "gender",
      "marital_status",
      "emergency_contact_name",
      "emergency_contact_phone",
      "hire_date",
      "birth_date",
      "department_id",
      "position_id",
      "schedule_id",
      "operational_area_id",
      "contract_type_id",
      "hierarchy_level_id",
      "cost_center",
      "manager_user_id",
      "director_user_id",
      "role",
      "is_active",
      "password",
      "password_confirmation",
    ];

    const ejemplo = [
      "0007",
      "Juan",
      "Perez",
      "Lopez",
      "juan@empresa.com",
      "juan.personal@gmail.com",
      "5555555555",
      "5555555556",
      "Av Principal 123",
      "Centro",
      "CDMX",
      "CDMX",
      "54000",
      "12345678901",
      "PELJ900101HDFRPN01",
      "PELJ900101ABC",
      "masculino",
      "soltero",
      "Maria Perez",
      "5551234567",
      "2026-03-15",
      "1990-01-10",
      "1",
      "1",
      "1",
      "1",
      "1",
      "1",
      "CC-001",
      "",
      "",
      "administrative",
      "1",
      "Admin12345",
      "Admin12345",
    ];

    const csv = [encabezados.join(","), ejemplo.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.setAttribute("download", "plantilla_usuarios.csv");
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  const seleccionarArchivo = () => {
    inputArchivoRef.current?.click();
  };

  const subirArchivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    setSubiendo(true);

    try {
      const formData = new FormData();
      formData.append("file", archivo);

      await api.post("/users/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await cargarUsuarios(1, porPagina);
      alert("Archivo procesado correctamente.");
    } catch (error: any) {
      alert(
        error?.response?.data?.message || "No fue posible importar el archivo.",
      );
    } finally {
      setSubiendo(false);
      if (inputArchivoRef.current) {
        inputArchivoRef.current.value = "";
      }
    }
  };

  return (
    <>
      <PageMeta
        title="Usuarios | SIE RH"
        description="Administración de usuarios"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Usuarios
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Alta, edición, activación, consulta e importación masiva de
                usuarios.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={descargarPlantilla}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
              >
                Descargar plantilla
              </button>

              <button
                onClick={seleccionarArchivo}
                disabled={subiendo}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                {subiendo ? "Subiendo..." : "Importar Excel"}
              </button>
              <button
                type="button"
                onClick={exportarUsuarios}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
              >
                Exportar CSV
              </button>

              <button
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
                onChange={subirArchivo}
              />
            </div>
          </div>

          <form
            onSubmit={buscar}
            className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5 min-w-full text-left text-sm text-gray-800 dark:text-gray-100"
          >
            <input
              className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
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
                className="w-full border border-gray-300 px-5 py-3 text-sm font-medium"
              >
                Buscar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="w-full border border-gray-300 px-5 py-3 text-sm font-medium"
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
        onClose={() => setModalAbierto(false)}
        onGuardado={() => cargarUsuarios(paginaActual, porPagina)}
        usuarioEditar={usuarioEditar}
      />
    </>
  );
}
