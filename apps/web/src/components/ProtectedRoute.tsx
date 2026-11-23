import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="auth-layout"><div className="auth-card">Loading account...</div></main>;
  if (!firebaseUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
