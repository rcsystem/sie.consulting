import { useEffect, useMemo, useRef, useState } from "react";

type OpcionBusqueda = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: OpcionBusqueda[];
  placeholder?: string;
  onChange: (value: string) => void;
};

export default function SearchSelect({
  label,
  value,
  options,
  placeholder = "Buscar...",
  onChange,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [termino, setTermino] = useState("");
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  const opcionSeleccionada = useMemo(
    () => options.find((item) => item.value === value) ?? null,
    [options, value],
  );

  const opcionesFiltradas = useMemo(() => {
    const texto = termino.trim().toLowerCase();

    if (!texto) return options;

    return options.filter((item) =>
      item.label.toLowerCase().includes(texto),
    );
  }, [options, termino]);

  useEffect(() => {
    const manejarClickFuera = (event: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  return (
    <div className="relative" ref={contenedorRef}>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <button
        type="button"
        onClick={() => {
          setAbierto((prev) => !prev);
          setTermino("");
        }}
        className="flex w-full items-center justify-between border border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      >
        <span className={opcionSeleccionada ? "" : "text-gray-400"}>
          {opcionSeleccionada?.label ?? placeholder}
        </span>
        <span className="text-gray-400">▾</span>
      </button>

      {abierto && (
        <div className="absolute z-50 mt-1 w-full border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-2 dark:border-gray-700">
            <input
              autoFocus
              type="text"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {opcionesFiltradas.length > 0 ? (
              opcionesFiltradas.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setAbierto(false);
                    setTermino("");
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5 ${
                    item.value === value
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}