import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import type {
  RespuestaPaginadaUsuarios,
  UsuarioSistema,
} from "../../types/users";
import UserFormModal from "../../components/UserProfile/UserFormModal";

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioSistema | null>(
    null,
  );
  const inputArchivoRef = useRef<HTMLInputElement | null>(null);

  const cargarUsuarios = async () => {
    setCargando(true);

    try {
      const { data } = await api.get<RespuestaPaginadaUsuarios>("/users", {
        params: {
          search: busqueda || undefined,
        },
      });

      setUsuarios(data.data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    await cargarUsuarios();
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
    await cargarUsuarios();
  };

  const descargarPlantilla = () => {
    const encabezados = [
      "employee_number",
      "first_name",
      "last_name",
      "middle_name",
      "email",
      "phone",
      "mobile_phone",
      "address",
      "neighborhood",
      "city",
      "state",
      "postal_code",
      "hire_date",
      "birth_date",
      "department_id",
      "position_id",
      "schedule_id",
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
      "juan@rh.local",
      "5555555555",
      "5555555555",
      "Av Principal 123",
      "Centro",
      "CDMX",
      "CDMX",
      "54000",
      "2026-03-15",
      "1990-01-10",
      "1",
      "1",
      "1",
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

      await cargarUsuarios();
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
            className="mt-6 flex flex-col gap-3 md:flex-row"
          >
            <input
              className="w-full border border-gray-300 px-4 py-3"
              placeholder="Buscar por nombre, correo o número de empleado"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button
              type="submit"
              className="border border-gray-300 px-5 py-3 text-sm font-medium"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
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
                      <td className="px-4 py-4">{usuario.role ?? "-"}</td>
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
                            onClick={() => abrirEditar(usuario)}
                            className="border border-gray-300 px-3 py-2 text-xs font-medium"
                          >
                            Editar
                          </button>
                          <button
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
        </div>
      </div>

      <UserFormModal
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={cargarUsuarios}
        usuarioEditar={usuarioEditar}
      />
    </>
  );
}
