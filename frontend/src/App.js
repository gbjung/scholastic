import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { HomeRedirect, ProtectedRoute } from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import {
  AssignmentProgressPage,
  ClassDetailPage,
  ClassesPage,
  ManageRosterPage,
  NewAssignmentPage,
  NewClassPage,
} from "./features/teacher";
import { AssignmentDetailPage, AssignmentsListPage } from "./features/student";
import { NotFound } from "./components/states";
import "./App.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/assignments"
        element={
          <ProtectedRoute role="student">
            <AssignmentsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:assignmentId"
        element={
          <ProtectedRoute role="student">
            <AssignmentDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes"
        element={
          <ProtectedRoute role="teacher">
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/new"
        element={
          <ProtectedRoute role="teacher">
            <NewClassPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/roster"
        element={
          <ProtectedRoute role="teacher">
            <ManageRosterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/assignments/new"
        element={
          <ProtectedRoute role="teacher">
            <NewAssignmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/assignments/:assignmentId"
        element={
          <ProtectedRoute role="teacher">
            <AssignmentProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id"
        element={
          <ProtectedRoute role="teacher">
            <ClassDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
