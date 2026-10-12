import { Navigate, Outlet } from "react-router-dom";

import useAuthStore from "../../store/auth.store";

export default function ProtectedRoute({
  allowedRoles,
}) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.toUpperCase();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(userRole)
  ) {
    const role = userRole?.toLowerCase();
    return <Navigate to={role ? `/${role}/dashboard` : "/login"} replace />;
  }

  return <Outlet />;
}