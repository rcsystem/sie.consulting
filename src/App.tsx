import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import Calendar from "./pages/Calendar";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./auth/ProtectedRoute";
import UsersPage from "./pages/Modules/Users";
import DepartmentsPage from "./pages/Modules/Departments";
import PositionsPage from "./pages/Modules/Positions";
import SchedulesPage from "./pages/Modules/Schedules";
import ApprovalsPage from "./pages/Modules/Approvals";
import AbsencesPage from "./pages/Modules/Absences";
import ImportUsersPage from "./pages/Modules/ImportUsers";
import SettingsPage from "./pages/Modules/Settings";
import MyProfilePage from "./pages/Profile/MyProfile";
import ChangePasswordPage from "./pages/Profile/ChangePassword";
import { useAuthStore } from "./store/useAuthStore";
import ImportUsers from "./pages/Users/ImportUsers";
import PermissionRequestsPage from "./pages/Modules/PermissionRequestsPage";


export default function App() {
  const cargarUsuario = useAuthStore((state) => state.cargarUsuario);

  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route path="/signin" element={<SignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/users/import" element={<ImportUsers />} />
            <Route path="/departamentos" element={<DepartmentsPage />} />
            <Route path="/puestos" element={<PositionsPage />} />
            <Route path="/horarios" element={<SchedulesPage />} />
            <Route path="/autorizaciones" element={<ApprovalsPage />} />
            <Route path="/inasistencias" element={<AbsencesPage />} />
            <Route path="/importar-usuarios" element={<ImportUsersPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
            <Route path="/mi-perfil" element={<MyProfilePage />} />
            <Route
              path="/cambiar-contrasena"
              element={<ChangePasswordPage />}
            />
            <Route path="/permisos" element={<PermissionRequestsPage />} />
          </Route>
        </Route>

        <Route path="/signup" element={<Navigate to="/signin" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
