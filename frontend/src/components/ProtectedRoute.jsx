import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center text-sm text-slate-500">Memuat sesi...</div>;
  }

  if (!user) {
    return <Navigate to="/access" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'pengurus' ? '/admin/dashboard' : '/donatur/beranda'} replace />;
  }

  return <Outlet />;
}
