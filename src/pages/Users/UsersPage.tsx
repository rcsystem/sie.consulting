const inputArchivoRef = useRef<HTMLInputElement | null>(null);

const [archivo, setArchivo] = useState<File | null>(null);
const [error, setError] = useState<string | null>(null);
const [resultado, setResultado] = useState<any>(null);
const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);

const cambiarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
  const archivoSeleccionado = event.target.files?.[0] ?? null;
  setArchivo(archivoSeleccionado);
  setError(null);
  setResultado(null);
};

const seleccionarArchivo = () => {
  inputArchivoRef.current?.click();
};

const descargarPlantilla = async () => {
  try {
    setDescargandoPlantilla(true);
    setError(null);

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
  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
        "No fue posible descargar la plantilla.",
    );
  } finally {
    setDescargandoPlantilla(false);
  }
};

const subirArchivo = async () => {
  if (!archivo) {
    setError("Selecciona un archivo Excel antes de continuar.");
    return;
  }

  try {
    setSubiendo(true);
    setError(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("archivo", archivo);

    const { data } = await api.post("/users/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });

    setResultado(data);
    await cargarUsuarios(1, porPagina);

    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }

    setArchivo(null);
  } catch (err: any) {
    setError(
      err?.response?.data?.message || "No fue posible importar el archivo.",
    );
  } finally {
    setSubiendo(false);
  }
};

const limpiarImportacion = () => {
  setArchivo(null);
  setError(null);
  setResultado(null);

  if (inputArchivoRef.current) {
    inputArchivoRef.current.value = "";
  }
};