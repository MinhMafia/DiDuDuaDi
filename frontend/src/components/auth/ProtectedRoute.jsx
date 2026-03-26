import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const currentUser = useSelector((state) => state.app.currentUser);
  const isAuthenticated = useSelector((state) => state.app.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDefaultPathByRole(currentUser.role)} replace />;
  }

  return <Outlet />;
}

function getDefaultPathByRole(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  return "/map";
}
