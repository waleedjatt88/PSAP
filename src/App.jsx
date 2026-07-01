import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./store/user";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lesson from "./pages/Lesson";
import Subjects from "./pages/Subjects";
import Progress from "./pages/Progress";
import Bookmarks from "./pages/Bookmarks";
import Accomplishments from "./pages/Accomplishments";
import Settings from "./pages/Settings";
import Homework from "./pages/Homework";
import Path from "./pages/Path";
import Community from "./pages/Community";
import "./App.css";

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* /lesson is rendered OUTSIDE the dashboard Layout so it can
            take over the entire viewport like a real PowerPoint
            presentation — no sidebar, no top bar. */}
        <Route
          path="/lesson"
          element={
            <RequireAuth>
              <Lesson />
            </RequireAuth>
          }
        />

        {/* Everything else uses the regular dashboard chrome */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/path/:id" element={<Path />} />
          <Route path="/community/:pathId" element={<Community />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/accomplishments" element={<Accomplishments />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UserProvider>
  );
}
