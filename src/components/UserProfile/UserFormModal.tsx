import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import SearchSelect from "../form/SearchSelect";
import type {
  CatalogoBase,
  FormularioUsuario,
  HorarioCatalogo,
  RolSistema,
  UsuarioSistema,
} from "../../types/users";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onGuardado: () => void;
  usuarioEditar?: UsuarioSistema | null;
};

const estadoInicial: FormularioUsuario = {
  employee_number: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  business_email: "",
  personal_email: "",
  social_security_number: "",
  curp: "",
  password: "",
  password_confirmation: "",
  phone: "",
  mobile_phone: "",
  address: "",
  neighborhood: "",
  city: "",
  state: "",
  postal_code: "",
  hire_date: "",
  birth_date: "",
  department_id: "",
  position_id: "",
  schedule_id: "",
  operational_area: "",
  cost_center: "",
  contract_type: "",
  hierarchy_level: "",
  manager_user_id: "",
  director_user_id: "",
  is_active: true,
  role: "",
};

const pasos = [
  { id: 1, titulo: "Información básica" },
  { id: 2, titulo: "Datos personales" },
  { id: 3, titulo: "Información laboral" },
  { id: 4, titulo: "Acceso y resumen" },
];

export default function UserFormModal({
  abierto,
  onClose,
  onGuardado,
  usuarioEditar,
}: Props) {
  const [formulario, setFormulario] = useState<FormularioUsuario>(estadoInicial);
  const [roles, setRoles] = useState<RolSistema[]>([]);
  const [departamentos, setDepartamentos] = useState<CatalogoBase[]>([]);
  const [puestos, setPuestos] = useState<CatalogoBase[]>([]);
  const [horarios, setHorarios] = useState<HorarioCatalogo[]>([]);
  const [usuariosRelacionados, setUsuariosRelacionados] = useState<UsuarioSistema[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [pasoActual, setPasoActual] = useState(1);

  useEffect(() => {
    if (!abierto) return;

    const cargarCatalogos = async () => {
      try {
        const [
          rolesRes,
          deptosRes,
          puestosRes,
          horariosRes,
          usuariosRes,
        ] = await Promise.all([
          api.get("/roles"),
          api.get("/catalogs/departments"),
          api.get("/catalogs/positions"),
          api.get("/catalogs/schedules"),
          api.get("/users", {
            params: {
              is_active: true,
            },
          }),
        ]);

        setRoles(rolesRes.data);
        setDepartamentos(deptosRes.data);
        setPuestos(puestosRes.data);
        setHorarios(horariosRes.data);
        setUsuariosRelacionados(usuariosRes.data.data ?? []);
      } catch {
        setError("No fue posible cargar los catálogos del formulario.");
      }
    };

    cargarCatalogos();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    setPasoActual(1);

    if (usuarioEditar) {
      setFormulario({
        employee_number: usuarioEditar.employee_number ?? "",
        first_name: usuarioEditar.first_name ?? "",
        last_name: usuarioEditar.last_name ?? "",
        middle_name: usuarioEditar.middle_name ?? "",
        email: usuarioEditar.email ?? "",
        business_email: usuarioEditar.business_email ?? "",
        personal_email: usuarioEditar.personal_email ?? "",
        social_security_number: usuarioEditar.social_security_number ?? "",
        curp: usuarioEditar.curp ?? "",
        password: "",
        password_confirmation: "",
        phone: usuarioEditar.phone ?? "",
        mobile_phone: usuarioEditar.mobile_phone ?? "",
        address: usuarioEditar.address ?? "",
        neighborhood: usuarioEditar.neighborhood ?? "",
        city: usuarioEditar.city ?? "",
        state: usuarioEditar.state ?? "",
        postal_code: usuarioEditar.postal_code ?? "",
        hire_date: usuarioEditar.hire_date ?? "",
        birth_date: usuarioEditar.birth_date ?? "",
        department_id: usuarioEditar.department?.id
          ? String(usuarioEditar.department.id)
          : "",
        position_id: usuarioEditar.position?.id
          ? String(usuarioEditar.position.id)
          : "",
        schedule_id: usuarioEditar.schedule?.id
          ? String(usuarioEditar.schedule.id)
          : "",
        operational_area: usuarioEditar.operational_area ?? "",
        cost_center: usuarioEditar.cost_center ?? "",
        contract_type: usuarioEditar.contract_type ?? "",
        hierarchy_level: usuarioEditar.hierarchy_level ?? "",
        manager_user_id: usuarioEditar.manager?.id
          ? String(usuarioEditar.manager.id)
          : "",
        director_user_id: usuarioEditar.director?.id
          ? String(usuarioEditar.director.id)
          : "",
        is_active: usuarioEditar.is_active,
        role: usuarioEditar.role ?? "",
      });
    } else {
      setFormulario(estadoInicial);
    }

    setError("");
  }, [abierto, usuarioEditar]);

  const actualizarCampo = (
    campo: keyof FormularioUsuario,
    valor: string | boolean,
  ) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const siguientePaso = () => {
    if (pasoActual < pasos.length) {
      setPasoActual((prev) => prev + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual((prev) => prev - 1);
    }
  };

  const guardar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setGuardando(true);

    try {
      const payload: Record<string, any> = {
        ...formulario,
        department_id: formulario.department_id || null,
        position_id: formulario.position_id || null,
        schedule_id: formulario.schedule_id || null,
        manager_user_id: formulario.manager_user_id || null,
        director_user_id: formulario.director_user_id || null,
      };

      if (usuarioEditar) {
        if (!payload.password) {
          delete payload.password;
          delete payload.password_confirmation;
        }

        await api.put(`/users/${usuarioEditar.id}`, payload);
      } else {
        await api.post("/users", payload);
      }

      onGuardado();
      onClose();
    } catch (error: any) {
      const mensaje =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.email?.[0] ||
        error?.response?.data?.errors?.employee_number?.[0] ||
        error?.response?.data?.errors?.business_email?.[0] ||
        error?.response?.data?.errors?.curp?.[0] ||
        "No fue posible guardar el usuario.";

      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesJefes = useMemo(() => {
    return usuariosRelacionados
      .filter((usuario) =>
        ["super_admin", "rh", "director", "manager"].includes(usuario.role ?? ""),
      )
      .filter((usuario) => !usuarioEditar || usuario.id !== usuarioEditar.id)
      .map((usuario) => ({
        value: String(usuario.id),
        label: `${usuario.full_name} (${usuario.role ?? "sin rol"})`,
      }));
  }, [usuariosRelacionados, usuarioEditar]);

  const opcionesDirectores = useMemo(() => {
    return usuariosRelacionados
      .filter((usuario) =>
        ["super_admin", "rh", "director"].includes(usuario.role ?? ""),
      )
      .filter((usuario) => !usuarioEditar || usuario.id !== usuarioEditar.id)
      .map((usuario) => ({
        value: String(usuario.id),
        label: `${usuario.full_name} (${usuario.role ?? "sin rol"})`,
      }));
  }, [usuariosRelacionados, usuarioEditar]);

  if (!abierto) return null;

  return (
    <div className={`fixed inset-0 z-[999999] ${abierto ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 flex h-full w-full max-w-6xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900 ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-brand-500 px-6 py-4 text-white">
          <div>
            <h2 className="text-xl font-semibold">
              {usuarioEditar ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Captura la información del empleado por secciones.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl leading-none text-white/90 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {pasos.map((paso) => {
              const activo = pasoActual === paso.id;
              const completado = pasoActual > paso.id;

              return (
                <button
                  key={paso.id}
                  type="button"
                  onClick={() => setPasoActual(paso.id)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                    activo
                      ? "border-brand-500 bg-brand-500 text-white"
                      : completado
                        ? "border-brand-200 bg-brand-50 text-brand-700"
                        : "border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      activo
                        ? "bg-white text-brand-500"
                        : completado
                          ? "bg-brand-500 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
                    }`}
                  >
                    {paso.id}
                  </span>
                  <span className="text-sm font-semibold">{paso.titulo}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {pasoActual === 1 && (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Información básica
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número de empleado
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Ej. 0001"
                      value={formulario.employee_number}
                      onChange={(e) => actualizarCampo("employee_number", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo principal de acceso
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="correo@empresa.com"
                      value={formulario.email}
                      onChange={(e) => actualizarCampo("email", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo empresarial
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="nombre.apellido@empresa.com"
                      value={formulario.business_email}
                      onChange={(e) => actualizarCampo("business_email", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo personal
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="correo.personal@gmail.com"
                      value={formulario.personal_email}
                      onChange={(e) => actualizarCampo("personal_email", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre(s)
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Nombre(s)"
                      value={formulario.first_name}
                      onChange={(e) => actualizarCampo("first_name", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apellido paterno
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Apellido paterno"
                      value={formulario.last_name}
                      onChange={(e) => actualizarCampo("last_name", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apellido materno
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Apellido materno"
                      value={formulario.middle_name}
                      onChange={(e) => actualizarCampo("middle_name", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teléfono
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Teléfono"
                      value={formulario.phone}
                      onChange={(e) => actualizarCampo("phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Celular
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Celular"
                      value={formulario.mobile_phone}
                      onChange={(e) => actualizarCampo("mobile_phone", e.target.value)}
                    />
                  </div>
                </div>
              </section>
            )}

            {pasoActual === 2 && (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Datos personales
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número de seguro social
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="NSS"
                      value={formulario.social_security_number}
                      onChange={(e) =>
                        actualizarCampo("social_security_number", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      CURP
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 uppercase dark:border-gray-700"
                      placeholder="CURP"
                      value={formulario.curp}
                      onChange={(e) => actualizarCampo("curp", e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dirección
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Dirección"
                      value={formulario.address}
                      onChange={(e) => actualizarCampo("address", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Colonia
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Colonia"
                      value={formulario.neighborhood}
                      onChange={(e) => actualizarCampo("neighborhood", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ciudad
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Ciudad"
                      value={formulario.city}
                      onChange={(e) => actualizarCampo("city", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estado
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Estado"
                      value={formulario.state}
                      onChange={(e) => actualizarCampo("state", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Código postal
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Código postal"
                      value={formulario.postal_code}
                      onChange={(e) => actualizarCampo("postal_code", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de ingreso
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 px-4 py-3 text-sm dark:border-gray-700"
                      value={formulario.hire_date}
                      onChange={(e) => actualizarCampo("hire_date", e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Selecciona la fecha en que ingresó el empleado.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 px-4 py-3 text-sm dark:border-gray-700"
                      value={formulario.birth_date}
                      onChange={(e) => actualizarCampo("birth_date", e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Selecciona la fecha de nacimiento del empleado.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {pasoActual === 3 && (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Información laboral
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SearchSelect
                    label="Departamento"
                    value={formulario.department_id}
                    onChange={(value) => actualizarCampo("department_id", value)}
                    placeholder="Buscar departamento"
                    options={departamentos.map((item) => ({
                      value: String(item.id),
                      label: item.name,
                    }))}
                  />

                  <SearchSelect
                    label="Puesto"
                    value={formulario.position_id}
                    onChange={(value) => actualizarCampo("position_id", value)}
                    placeholder="Buscar puesto"
                    options={puestos.map((item) => ({
                      value: String(item.id),
                      label: item.name,
                    }))}
                  />

                  <SearchSelect
                    label="Horario"
                    value={formulario.schedule_id}
                    onChange={(value) => actualizarCampo("schedule_id", value)}
                    placeholder="Buscar horario"
                    options={horarios.map((item) => ({
                      value: String(item.id),
                      label: `${item.name} (${item.entry_time} - ${item.exit_time})`,
                    }))}
                  />

                  <SearchSelect
                    label="Rol"
                    value={formulario.role}
                    onChange={(value) => actualizarCampo("role", value)}
                    placeholder="Buscar rol"
                    options={roles.map((item) => ({
                      value: item.name,
                      label: item.name,
                    }))}
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Área operativa
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Área operativa"
                      value={formulario.operational_area}
                      onChange={(e) =>
                        actualizarCampo("operational_area", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Centro de costo
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Centro de costo"
                      value={formulario.cost_center}
                      onChange={(e) => actualizarCampo("cost_center", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de contrato
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Ej. Planta, temporal, sindicalizado, confianza"
                      value={formulario.contract_type}
                      onChange={(e) =>
                        actualizarCampo("contract_type", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Grado / jerarquía
                    </label>
                    <input
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Ej. Coordinador, jefe, gerente"
                      value={formulario.hierarchy_level}
                      onChange={(e) =>
                        actualizarCampo("hierarchy_level", e.target.value)
                      }
                    />
                  </div>

                  <SearchSelect
                    label="Jefe directo"
                    value={formulario.manager_user_id}
                    onChange={(value) => actualizarCampo("manager_user_id", value)}
                    placeholder="Buscar jefe directo"
                    options={opcionesJefes}
                  />

                  <SearchSelect
                    label="Director"
                    value={formulario.director_user_id}
                    onChange={(value) => actualizarCampo("director_user_id", value)}
                    placeholder="Buscar director"
                    options={opcionesDirectores}
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formulario.is_active}
                    onChange={(e) => actualizarCampo("is_active", e.target.checked)}
                  />
                  Usuario activo
                </label>
              </section>
            )}

            {pasoActual === 4 && (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acceso y resumen
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {usuarioEditar ? "Nueva contraseña" : "Contraseña"}
                    </label>
                    <input
                      type="password"
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder={
                        usuarioEditar
                          ? "Nueva contraseña (opcional)"
                          : "Contraseña"
                      }
                      value={formulario.password}
                      onChange={(e) => actualizarCampo("password", e.target.value)}
                    />
                    {usuarioEditar ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Déjalo vacío si no deseas cambiar la contraseña.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full border border-gray-300 px-4 py-3 dark:border-gray-700"
                      placeholder="Confirmar contraseña"
                      value={formulario.password_confirmation}
                      onChange={(e) =>
                        actualizarCampo("password_confirmation", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    Resumen del usuario
                  </p>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <p>
                      <span className="font-medium">Empleado:</span>{" "}
                      {formulario.employee_number || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {`${formulario.first_name} ${formulario.last_name} ${formulario.middle_name}`.trim() || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Correo acceso:</span>{" "}
                      {formulario.email || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Correo empresarial:</span>{" "}
                      {formulario.business_email || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Rol:</span>{" "}
                      {formulario.role || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Centro de costo:</span>{" "}
                      {formulario.cost_center || "-"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {error ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              onClick={pasoAnterior}
              disabled={pasoActual === 1}
              className="border border-gray-300 px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="border border-gray-300 px-5 py-3 text-sm font-medium"
              >
                Cancelar
              </button>

              {pasoActual < pasos.length ? (
                <button
                  type="button"
                  onClick={siguientePaso}
                  className="bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {guardando
                    ? "Guardando..."
                    : usuarioEditar
                      ? "Actualizar"
                      : "Crear"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}                                             