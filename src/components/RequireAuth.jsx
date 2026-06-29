import { Navigate } from "react-router-dom";
import { useUser } from "../store/user";

// Lightweight auth gate for routes that render OUTSIDE the dashboard Layout.
// The Layout already does this check internally; this is the equivalent
// for the full-screen /lesson route.
export default function RequireAuth({ children }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
