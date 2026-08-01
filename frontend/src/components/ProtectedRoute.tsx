import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-gv-fg2">
        Loading…
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/login" replace />;
  return <Outlet />;
}
