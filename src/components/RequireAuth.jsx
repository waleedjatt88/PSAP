import { Navigate } from "react-router-dom";
import { useUser } from "../store/user";

// Auth gate for routes rendered OUTSIDE the dashboard Layout (e.g. /lesson).
// The Layout does its own version of this. Both must handle `loading` so
// they don't bounce the user to /login while the session is still hydrating.
export default function RequireAuth({ children }) {
  const { user, loading } = useUser();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-100/40">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
