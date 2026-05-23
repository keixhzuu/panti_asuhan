import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './UI';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/kebutuhan', label: 'Kebutuhan' },
  { to: '/admin/verifikasi-donasi', label: 'Verifikasi Donasi' },
  { to: '/admin/kumpulan-donasi', label: 'Kumpulan Donasi' },
  { to: '/admin/penyaluran', label: 'Penyaluran' },
  { to: '/admin/cerita', label: 'Cerita' }
];

const donorNav = [
  { to: '/donatur/beranda', label: 'Beranda' },
  { to: '/donatur/donasi', label: 'Donasi' },
  { to: '/donatur/tracking', label: 'Tracking' },
  { to: '/donatur/galeri', label: 'Galeri' },
  { to: '/donatur/riwayat', label: 'Riwayat' },
  { to: '/donatur/notifikasi', label: 'Notifikasi' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'pengurus' ? adminNav : donorNav;

  const handleLogout = () => {
    logout();
    navigate('/access');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-xl font-bold text-ink">
            Donasi Panti Asuhan
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'text-slate-600 hover:bg-white/70 hover:text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-500">Masuk sebagai</p>
              <p className="text-sm font-semibold text-ink">{user?.nama || user?.email || 'Tamu'}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>Keluar</Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 lg:hidden sm:px-6 lg:px-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'bg-white/70 text-slate-600'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
