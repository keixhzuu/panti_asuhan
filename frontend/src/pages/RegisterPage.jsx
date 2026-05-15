import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, SelectField, TextField } from '../components/UI';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', password: '', no_hp: '', alamat: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await register(form);
      navigate(user.role === 'pengurus' ? '/admin/dashboard' : '/donatur/beranda');
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sea px-10 py-12 text-white lg:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200">Akun Donatur</p>
          <h2 className="mt-4 max-w-xl font-display text-5xl font-bold leading-tight">Daftar, pilih kebutuhan, lalu pantau aliran dana secara realtime.</h2>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-teal-50/90">Setelah registrasi, donatur bisa melihat katalog Firestore, mengirim donasi digital, dan memantau notifikasi verifikasi secara langsung.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-sea/70">Registrasi Donatur</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Buat akun baru</h1>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField placeholder="Nama lengkap" value={form.nama} onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))} />
            <TextField type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            <TextField type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
            <TextField placeholder="No HP" value={form.no_hp} onChange={(e) => setForm((prev) => ({ ...prev, no_hp: e.target.value }))} />
            <TextField placeholder="Alamat" value={form.alamat} onChange={(e) => setForm((prev) => ({ ...prev, alamat: e.target.value }))} />
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Memproses...' : 'Daftar'}</Button>
          </form>
          <p className="text-sm text-slate-600">Sudah punya akun? <Link to="/donatur/login" className="font-semibold text-sea">Login donatur</Link></p>
        </Card>
      </div>
    </div>
  );
}
