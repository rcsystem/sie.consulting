import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/useAuthStore";

export default function ProtectedRoute() {
  const autenticado = useAuthStore((state) => state.autenticado);
  const token = useAuthStore((state) => state.token);

  return autenticado && token ? <Outlet /> : <Navigate to="/signin" replace />;
}