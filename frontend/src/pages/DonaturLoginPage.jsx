import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, TextField } from '../components/UI';

export default function DonaturLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(form);
      if (user.role !== 'donatur') {
        logout();
        throw new Error('Akun ini bukan donatur.');
      }
      navigate('/donatur/beranda');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login donatur gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sea px-10 py-12 text-white lg:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200">Akses Donatur</p>
          <h2 className="mt-4 max-w-xl font-display text-5xl font-bold leading-tight">Masuk untuk melihat transparansi realtime dan riwayat donasi.</h2>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-teal-50/90">Aplikasi untuk memantau pergerakan uang donasi Anda.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-sea/70">Login Donatur</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Masuk sebagai donatur</h1>
            <p className="mt-2 text-sm text-slate-600">Gunakan akun untuk <span className="font-semibold">donatur</span>.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField type="email" placeholder="Email donatur" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            <TextField type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Memproses...' : 'Login Donatur'}</Button>
          </form>
          <p className="text-sm text-slate-600">
            Belum punya akun? <Link to="/register" className="font-semibold text-ember">Daftar donatur</Link>
          </p>
          <p className="text-sm text-slate-600">
            Kembali ke <Link to="/access" className="font-semibold text-ember">pilih akses</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
