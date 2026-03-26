import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-1 min-h-screen bg-gray-100 p-6 dark:bg-gray-950 sm:p-0">
      <div className="relative flex min-h-screen w-full flex-col justify-center lg:flex-row dark:bg-gray-950 sm:p-0">
        <div className="hidden w-full border-r border-gray-200 bg-white/70 lg:block lg:w-1/2 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex h-full items-center justify-center p-12">
            <div className="max-w-md text-center lg:text-left">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                SIE - Desde permisos hasta nómina: todo integrado, todo
                controlado, todo fácil.
              </h2>
              <p className="mt-4 text-base text-gray-600 dark:text-gray-400">
                Transforma la gestión de tu información en una plataforma única
                e integrada.
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full items-start justify-center bg-gray-100 lg:w-1/2 dark:bg-gray-950">
          {children}
        </div>
      </div>
    </div>
  );
}
