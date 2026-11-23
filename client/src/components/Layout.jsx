import { Link, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <Link to="/inquiries" className="brand">Inquiry Desk</Link>
        <div className="header-user">
          <span>{user.name} <span className="muted">({user.role})</span></span>
          <button className="btn" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="app-main">
        <Outlet /> {/* the current page appears here */}
      </main>
    </>
  );
}