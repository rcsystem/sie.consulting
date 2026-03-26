import { useState } from "react";
import api from "../../lib/api";

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

export default function ImportUsers() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [respuesta, setRespuesta] = useState<RespuestaImportacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const descargarPlantilla = async () => {
    try {
      setDescargando(true);
      setError(null);

      const response = await api.get("/users/import/template", {
        responseType: "blob",
        headers: {
          Accept: "application/json",
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.setAttribute("download", "plantilla_usuarios.xlsx");
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No fue posible descargar la plantilla.",
      );
    } finally {
      setDescargando(false);
    }
  };

  const subirArchivo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivo) {
      setError("Selecciona un archivo Excel antes de continuar.");
      return;
    }

    try {
      setCargando(true);
      setError(null);
      setRespuesta(null);

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

      setRespuesta(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No fue posible procesar el archivo.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Importar usuarios
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Descarga la plantilla en Excel, captura la información en español y súbela para crear o actualizar usuarios masivamente.
            </p>
          </div>

          <button
            type="button"
            onClick={descargarPlantilla}
            disabled={descargando}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            {descargando ? "Descargando..." : "Descargar plantilla"}
          </button>
        </div>
      </section>

      <form
        onSubmit={subirArchivo}
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Archivo Excel
        </label>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-2xl border border-gray-300 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-transparent dark:text-gray-200"
        />

        {archivo ? (
          <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.02] dark:text-gray-300">
            Archivo seleccionado: <span className="font-medium">{archivo.name}</span>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={cargando}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? "Importando..." : "Importar usuarios"}
          </button>

          <button
            type="button"
            onClick={() => {
              setArchivo(null);
              setError(null);
              setRespuesta(null);
            }}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Limpiar
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </form>

      {respuesta ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resultado de la importación
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Creados</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {respuesta.resumen.creados}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Actualizados</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {respuesta.resumen.actualizados}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Errores</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {respuesta.resumen.errores}
              </p>
            </div>
          </div>

          {respuesta.errores.length > 0 ? (
            <div className="mt-6 space-y-3">
              {respuesta.errores.map((item, index) => (
                <div
                  key={`${item.fila ?? "sin-fila"}-${index}`}
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300"
                >
                  <p><span className="font-semibold">Fila:</span> {item.fila ?? "-"}</p>
                  <p><span className="font-semibold">Campo:</span> {item.campo ?? "-"}</p>
                  <p><span className="font-semibold">Mensaje:</span> {item.mensaje}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}