import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import InquiriesPage from './pages/InquiriesPage.jsx';

// Sends logged-out users to /login. This is only for a nicer experience:
// the REAL protection is requireAuth on the server.
function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <p className="page-status" role="status">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/inquiries" element={<InquiriesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/inquiries" replace />} />
    </Routes>
  );
}