import PageMeta from "../../components/common/PageMeta";

type Props = {
  title: string;
  description: string;
  columns?: string[];
  rows?: string[][];
  children?: React.ReactNode;
};

export function ModulePage({ title, description, columns, rows, children }: Props) {
  return (
    <>
      <PageMeta title={`${title} | SIE RH`} description={description} />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <button className="border border-brand-500 bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600">
            Agregar nuevo
          </button>
        </div>

        {children}

        {columns && rows && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${title}-${idx}`} className="border-t border-gray-100 dark:border-gray-800/60">
                      {row.map((cell, cIdx) => (
                        <td key={`${cell}-${cIdx}`} className="px-5 py-4 text-gray-700 dark:text-gray-300">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
