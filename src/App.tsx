import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./contexts/AuthContext";

// Public pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AcceptInvite from "./pages/auth/AcceptInvite";

// Protected pages
import Dashboard from "./pages/dashboard/Dashboard";
import Budget from "./pages/budget/Budget";
import Transactions from "./pages/transactions/Transactions";
import Groups from "./pages/groups/Groups";
import GroupDetail from "./pages/groups/GroupDetail";
import History from "./pages/history/History";

// Layout components
import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";
import LoadingScreen from "./components/ui/LoadingScreen";

// Localization
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login\" replace />;
  }

  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/convite/:token" element={<AcceptInvite />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orcamento" element={<Budget />} />
          <Route path="/lancamentos" element={<Transactions />} />
          <Route path="/meus-grupos" element={<Groups />} />
          <Route path="/grupo/:id" element={<GroupDetail />} />
          <Route path="/historico" element={<History />} />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard\" replace />} />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/dashboard\" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
