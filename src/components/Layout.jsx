import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUser } from "../store/user";

export default function Layout() {
  const { user, loading } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-ink-100/40">
      {/* Sidebar — sticky on desktop, slide-in drawer on mobile */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-100/40">
      <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
