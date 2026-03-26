import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../lib/api";
import ScheduleFormModal from "../../components/Schedules/ScheduleFormModal";
import type {
  ErrorImportacionHorario,
  Horario,
  RespuestaImportacionHorario,
  RespuestaPaginadaHorarios,
} from "../../types/schedules";

export default function SchedulesPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");

  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [horarioEditar, setHorarioEditar] = useState<Horario | null>(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [resultadoImportacion, setResultadoImportacion] =
    useState<RespuestaImportacionHorario | null>(null);

  const inputArchivoRef = useRef<HTMLInputElement | null>(null);

  const claseBotonSecundario =
    "inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  const claseBotonPrimario =
    "inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60";

  const cargarHorarios = async (pagina = paginaActual, limite = porPagina) => {
    setCargando(true);

    try {
      const { data } = await api.get<RespuestaPaginadaHorarios>("/schedules", {
        params: {
          search: busqueda || undefined,
          is_active: filtroActivo !== "" ? filtroActivo : undefined,
          page: pagina,
          per_page: limite,
        },
      });

      setHorarios(data.data);
      setPaginaActual(data.current_page);
      setUltimaPagina(data.last_page);
      setTotal(data.total);
      setDesde(data.from ?? null);
      setHasta(data.to ?? null);
    } catch (error) {
      console.error("No fue posible cargar los horarios.", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHorarios(1, porPagina);
  }, []);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    await cargarHorarios(1, porPagina);
  };

  const limpiarFiltros = async () => {
    setBusqueda("");
    setFiltroActivo("");
    await cargarHorarios(1, porPagina);
  };

  const abrirNuevo = () => {
    setHorarioEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = async (horario: Horario) => {
    try {
      const response = await api.get(`/schedules/${horario.id}`, {
        headers: {
          Accept: "application/json",
        },
      });

      setHorarioEditar(response.data.schedule);
      setModalAbierto(true);
    } catch (error) {
      console.error("No fue posible cargar el detalle del horario.", error);
      alert("No fue posible abrir el horario para edición.");
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setHorarioEditar(null);
  };

  const cambiarEstatus = async (horario: Horario) => {
    await api.patch(`/schedules/${horario.id}/toggle-status`);
    await cargarHorarios(paginaActual, porPagina);
  };

  const descargarPlantilla = async () => {
    try {
      setDescargandoPlantilla(true);
      setErrorImportacion(null);

      const response = await api.get("/schedules/import/template", {
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
      enlace.setAttribute("download", "plantilla_horarios.xlsx");
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

      const { data } = await api.post<RespuestaImportacionHorario>(
        "/schedules/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      setResultadoImportacion(data);
      await cargarHorarios(1, porPagina);
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

  const formatearDias = (dias: string[]) => {
    const mapa: Record<string, string> = {
      lunes: "Lun",
      martes: "Mar",
      miercoles: "Mié",
      jueves: "Jue",
      viernes: "Vie",
      sabado: "Sáb",
      domingo: "Dom",
    };

    return (dias ?? []).map((dia) => mapa[dia] ?? dia).join(", ");
  };

  return (
    <>
      <PageMeta
        title="Horarios | SIE"
        description="Administración del catálogo de horarios"
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Horarios
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Alta, edición, activación e importación del catálogo de
                horarios.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <button
                type="button"
                onClick={descargarPlantilla}
                disabled={descargandoPlantilla}
                className={claseBotonSecundario}
              >
                {descargandoPlantilla
                  ? "Descargando..."
                  : "Descargar plantilla"}
              </button>

              <button
                type="button"
                onClick={seleccionarArchivo}
                disabled={subiendo}
                className={claseBotonSecundario}
              >
                {subiendo ? "Subiendo..." : "Importar Excel"}
              </button>

              <button
                type="button"
                onClick={subirArchivo}
                disabled={!archivo || subiendo}
                className={claseBotonPrimario}
              >
                {subiendo ? "Procesando..." : "Subir horarios"}
              </button>

              <button
                type="button"
                onClick={abrirNuevo}
                className={claseBotonPrimario}
              >
                Nuevo horario
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
                  {resultadoImportacion.errores.map(
                    (item: ErrorImportacionHorario, index) => (
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
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={buscar}
            className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3"
          >
            <input
              className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Buscar por nombre o descripción"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
            >
              <option value="">Todos los estatus</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <div className="flex gap-3">
              <button type="submit" className={claseBotonSecundario}>
                Buscar
              </button>
              <button
                type="button"
                onClick={limpiarFiltros}
                className={claseBotonSecundario}
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
                    "Nombre",
                    "Horario",
                    "Tolerancias",
                    "Días laborales",
                    "Usuarios",
                    "Estatus",
                    "Acciones",
                  ].map((columna) => (
                    <th
                      key={columna}
                      className="px-4 py-4 font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                    >
                      Cargando horarios...
                    </td>
                  </tr>
                ) : horarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                    >
                      No se encontraron horarios.
                    </td>
                  </tr>
                ) : (
                  horarios.map((horario) => (
                    <tr
                      key={horario.id}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800/60"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {horario.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {horario.description || "Sin descripción"}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {horario.entry_time} - {horario.exit_time}
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs">
                          <p>
                            Entrada: {horario.entry_tolerance_minutes ?? 0} min
                          </p>
                          <p>
                            Salida: {horario.exit_tolerance_minutes ?? 0} min
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {formatearDias(horario.working_days)}
                      </td>

                      <td className="px-4 py-4">{horario.users_count ?? 0}</td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            horario.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                          }`}
                        >
                          {horario.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(horario)}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => cambiarEstatus(horario)}
                            className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white ${
                              horario.is_active
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {horario.is_active ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {desde ?? 0} a {hasta ?? 0} de {total} registros
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={porPagina}
                onChange={async (e) => {
                  const nuevoLimite = Number(e.target.value);
                  setPorPagina(nuevoLimite);
                  await cargarHorarios(1, nuevoLimite);
                }}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {[10, 15, 20, 50].map((item) => (
                  <option key={item} value={item}>
                    {item} por página
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => cargarHorarios(paginaActual - 1, porPagina)}
                disabled={paginaActual <= 1}
                className={claseBotonSecundario}
              >
                Anterior
              </button>

              <span className="text-sm">
                Página {paginaActual} de {ultimaPagina}
              </span>

              <button
                type="button"
                onClick={() => cargarHorarios(paginaActual + 1, porPagina)}
                disabled={paginaActual >= ultimaPagina}
                className={claseBotonSecundario}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <ScheduleFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardado={async () => {
          await cargarHorarios(paginaActual, porPagina);
        }}
        horarioEditar={horarioEditar}
      />
    </>
  );
}
