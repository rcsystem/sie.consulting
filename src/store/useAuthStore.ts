import { create } from "zustand";
import api from "../lib/api";
import type {
  RespuestaLogin,
  RespuestaMe,
  UsuarioAutenticado,
} from "../types/auth";

type EstadoAuth = {
  token: string | null;
  usuario: UsuarioAutenticado | null;
  rol: string | null;
  roles: string[];
  permisos: string[];
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  cargarUsuario: () => Promise<void>;
  logout: () => Promise<void>;
  limpiarSesion: () => void;
  autenticado: boolean;
};

export const useAuthStore = create<EstadoAuth>((set) => ({
  token: localStorage.getItem("token"),
  usuario: null,
  rol: null,
  roles: [],
  permisos: [],
  cargando: false,
  autenticado: !!localStorage.getItem("token"),

  login: async (email, password) => {
    set({ cargando: true });

    try {
      const { data } = await api.post<RespuestaLogin>("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);

      set({
        token: data.token,
        usuario: data.user,
        rol: data.role,
        roles: data.roles,
        permisos: data.permissions,
        autenticado: true,
        cargando: false,
      });
    } catch (error) {
      set({ cargando: false });
      throw error;
    }
  },

  cargarUsuario: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({
        token: null,
        usuario: null,
        rol: null,
        roles: [],
        permisos: [],
        autenticado: false,
      });
      return;
    }

    try {
      const { data } = await api.get<RespuestaMe>("/auth/me");

      set({
        token,
        usuario: data.user,
        rol: data.role,
        roles: data.roles,
        permisos: data.permissions,
        autenticado: true,
      });
    } catch {
      localStorage.removeItem("token");

      set({
        token: null,
        usuario: null,
        rol: null,
        roles: [],
        permisos: [],
        autenticado: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignorar si el token ya expiró
    } finally {
      localStorage.removeItem("token");

      set({
        token: null,
        usuario: null,
        rol: null,
        roles: [],
        permisos: [],
        autenticado: false,
      });
    }
  },

  limpiarSesion: () => {
    localStorage.removeItem("token");

    set({
      token: null,
      usuario: null,
      rol: null,
      roles: [],
      permisos: [],
      autenticado: false,
    });
  },
}));
