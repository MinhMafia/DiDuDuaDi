import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={["user", "owner", "admin"]} />}>
        <Route
          path="/"
          element={
            <MainLayout>
              <Navigate to="/map" replace />
            </MainLayout>
          }
        />
        <Route
          path="/map"
          element={
            <MainLayout>
              <MapPage />
            </MainLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
        <Route
          path="/owner"
          element={
            <MainLayout>
              <OwnerDashboardPage />
            </MainLayout>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route
          path="/admin"
          element={
            <MainLayout>
              <AdminDashboardPage />
            </MainLayout>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
