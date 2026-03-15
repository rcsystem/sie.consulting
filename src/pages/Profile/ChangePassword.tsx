import PageMeta from "../../components/common/PageMeta";

export default function ChangePasswordPage() {
  return (
    <>
      <PageMeta title="Cambiar contraseña | SIE RH" description="Actualización de contraseña del usuario" />
      <div className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cambiar contraseña</h1>
        <div className="mt-6 grid gap-4">
          {['Contraseña actual','Nueva contraseña','Confirmar nueva contraseña'].map((label) => (
            <label key={label} className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
              <input type="password" className="h-12 border border-gray-300 px-4 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </label>
          ))}
          <button className="mt-2 w-full border border-brand-500 bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 sm:w-fit">Guardar cambios</button>
        </div>
      </div>
    </>
  );
}
