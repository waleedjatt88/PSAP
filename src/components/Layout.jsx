import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUser } from "../store/user";

export default function Layout() {
  const { user, loading } = useUser();
  const location = useLocation();
  // Open by default on desktop, closed by default on mobile.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );

  // Auto-close the drawer on navigation, but only on mobile — the
  // desktop sidebar stays as the user left it.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="relative flex min-h-screen bg-[#070518] overflow-hidden">
      {/* Premium ambient glows — same treatment as the lesson stage */}
      <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Sidebar — sticky on desktop, slide-in drawer on mobile */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={[
          "relative z-10 flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen ? "lg:pl-64" : "lg:pl-20",
        ].join(" ")}
      >
        <Topbar onMenu={() => setSidebarOpen((v) => !v)} />
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
