import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, TextField } from '../components/UI';

export default function LoginPage() {
  const { login } = useAuth();
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
      navigate(user.role === 'pengurus' ? '/admin/dashboard' : '/donatur/beranda');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-ember/70">Akses Sistem</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Masuk ke dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Gunakan akun yang sesuai untuk melihat fitur yang diinginkan.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            <TextField type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Memproses...' : 'Login'}</Button>
          </form>
          <p className="text-sm text-slate-600">Belum punya akun donatur? <Link to="/register" className="font-semibold text-ember">Daftar di sini</Link></p>
        </Card>
      </div>
      <div className="hidden flex-col justify-between bg-ink px-10 py-12 text-white lg:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">Transparansi Donasi</p>
          <h2 className="mt-4 max-w-xl font-display text-5xl font-bold leading-tight">Satu dashboard untuk kebutuhan, transparansi, dan cerita panti.</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Realtime', 'Firestore untuk katalog dan notifikasi'],
            ['Aman', 'JWT dan role-based access'],
            ['Transparan', 'Timeline penyaluran dan bukti foto'],
            ['Terstruktur', 'SQL + Cloud Storage + Cloud Run']
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="font-bold text-amber-200">{title}</p>
              <p className="mt-2 text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
