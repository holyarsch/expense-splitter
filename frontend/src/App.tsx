import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
