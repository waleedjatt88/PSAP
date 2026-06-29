import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./store/user";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lesson from "./pages/Lesson";
import Subjects from "./pages/Subjects";
import Progress from "./pages/Progress";
import Bookmarks from "./pages/Bookmarks";
import Accomplishments from "./pages/Accomplishments";
import Settings from "./pages/Settings";
import "./App.css";

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/subjects" element={<Subjects />} />
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
