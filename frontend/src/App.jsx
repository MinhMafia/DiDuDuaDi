import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CollaborationPage from "./pages/CollaborationPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import PoiDetailPage from "./pages/PoiDetailPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import SystemBenchmark from "./pages/SystemBenchmark";
import { ConfigProvider } from "antd";

export default function App() {
  return (
    <Routes>
      <Route path="/test" element={<SystemBenchmark></SystemBenchmark>}></Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* POI Detail - Public route, accessible without auth */}
      <Route path="/poi/:id" element={<PoiDetailPage />} />

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

      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route
          path="/cooperate"
          element={
            <MainLayout>
              <CollaborationPage />
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
             <ConfigProvider
  theme={{
    token: {
      colorPrimary: "#468bfa", 
      borderRadius: 12,
      fontFamily: "Inter, sans-serif",
    },
    components: {
      Button: {
        borderRadius: 10,
      },
      Card: {
        borderRadius: 16,
      },
    },
  }}
>
  <AdminDashboardPage />
</ConfigProvider>
            </MainLayout>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );
}
