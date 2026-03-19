export const etiquetasRoles: Record<string, string> = {
  super_admin: "Super Administrador",
  rh: "Recursos Humanos",
  director: "Director",
  manager: "Gerente",
  administrative: "Administrativo",
  unionized: "Sindicalizado",
};

export function traducirRol(rol?: string | null): string {
  if (!rol) return "-";
  return etiquetasRoles[rol] ?? rol;
}