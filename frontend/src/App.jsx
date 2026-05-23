import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AccessSelectPage from './pages/AccessSelectPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DonaturLoginPage from './pages/DonaturLoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKebutuhanPage from './pages/admin/AdminKebutuhanPage';
import AdminVerifikasiDonasiPage from './pages/admin/AdminVerifikasiDonasiPage';
import AdminKumpulanDonasiPage from './pages/admin/AdminKumpulanDonasiPage';
import AdminPenyaluranPage from './pages/admin/AdminPenyaluranPage';
import AdminCeritaPage from './pages/admin/AdminCeritaPage';
import AdminDonationReviewPage from './pages/admin/AdminDonationReviewPage';
import DonaturBerandaPage from './pages/donatur/DonaturBerandaPage';
import DonaturDonasiPage from './pages/donatur/DonaturDonasiPage';
import DonaturTrackingPage from './pages/donatur/DonaturTrackingPage';
import DonaturGaleriPage from './pages/donatur/DonaturGaleriPage';
import DonaturRiwayatPage from './pages/donatur/DonaturRiwayatPage';
import DonaturNotifikasiPage from './pages/donatur/DonaturNotifikasiPage';
import DonaturProfilePage from './pages/donatur/DonaturProfilePage';
import AdminTambahPantiPage from './pages/admin/AdminTambahPantiPage';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat aplikasi...</div>;
  }

  if (!user) {
    return <Navigate to="/access" replace />;
  }

  return <Navigate to={user.role === 'pengurus' ? '/admin/dashboard' : '/donatur/beranda'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/access" element={<AccessSelectPage />} />
      <Route path="/login" element={<Navigate to="/access" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/donatur/login" element={<DonaturLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute roles={["pengurus"]} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/kebutuhan" element={<AdminKebutuhanPage />} />
           <Route path="/admin/verifikasi-donasi" element={<AdminVerifikasiDonasiPage />} />
          <Route path="/admin/verifikasi-donasi/:id" element={<AdminDonationReviewPage />} />
          <Route path="/admin/kumpulan-donasi" element={<AdminKumpulanDonasiPage />} />
          <Route path="/admin/kumpulan-donasi/:id" element={<AdminDonationReviewPage />} />
          <Route path="/admin/penyaluran" element={<AdminPenyaluranPage />} />
          <Route path="/admin/cerita" element={<AdminCeritaPage />} />
          <Route path="/admin/tambah-panti" element={<AdminTambahPantiPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["donatur"]} />}>
        <Route element={<Layout />}>
          <Route path="/donatur/beranda" element={<DonaturBerandaPage />} />
          <Route path="/donatur/donasi" element={<DonaturDonasiPage />} />
          <Route path="/donatur/tracking" element={<DonaturTrackingPage />} />
          <Route path="/donatur/galeri" element={<DonaturGaleriPage />} />
          <Route path="/donatur/riwayat" element={<DonaturRiwayatPage />} />
          <Route path="/donatur/notifikasi" element={<DonaturNotifikasiPage />} />
          <Route path="/donatur/profil" element={<DonaturProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
