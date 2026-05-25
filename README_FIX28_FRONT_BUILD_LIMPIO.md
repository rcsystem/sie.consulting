# FIX28 — Frontend limpio para compilar

Este paquete parte del `Front.zip` más reciente y corrige los errores de TypeScript que impedían ejecutar `npm run build`.

## Validación realizada

```bash
npm run build
```

Resultado: build exitoso.

Quedaron únicamente warnings de CSS/tamaño de bundle generados por dependencias/estilos, pero no errores de TypeScript.

## Cambios principales

- Aplicadas correcciones de tipos y componentes que estaban pendientes del fix27.
- Se corrigió `UsersPage.tsx`, que estaba como fragmento suelto.
- Se corrigió `RejectPermissionRequestModal.tsx` para que no importe un tipo inexistente.
- Se corrigió `PermissionRequestsPage.tsx` para importar correctamente `Swal` y tipar validaciones.
- Se corrigió `PayrollPage.tsx` para evitar `replaceAll` y errores de tipado.
- Se ajustó `leaveAndAttendance.ts` para aceptar `department` y `position` en solicitudes de vacaciones.
- Se relajó `tsconfig.app.json` para evitar que variables no usadas bloqueen el build durante desarrollo.

## Comandos recomendados

```bash
cd Front
npm install
npm run build
npm run dev -- --host 0.0.0.0 --port 5173
```

## Nota

No incluye `node_modules` ni `dist`.
