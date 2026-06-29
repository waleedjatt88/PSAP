import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUser } from "../store/user";

export default function Layout() {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-ink-100/40">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
