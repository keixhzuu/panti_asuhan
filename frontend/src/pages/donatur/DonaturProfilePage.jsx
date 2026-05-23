import { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, PageShell } from '../../components/UI';

const INPUT_CLS =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-ink placeholder-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition';
const LABEL_CLS = 'block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5';

function Alert({ type, msg }) {
  if (!msg) return null;
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {msg}
    </div>
  );
}

export default function DonaturProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [form, setForm] = useState({ nama: '', no_hp: '', alamat: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', msg: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ password_lama: '', password_baru: '', konfirmasi: '' });
  const [passMsg, setPassMsg] = useState({ type: '', msg: '' });
  const [passLoading, setPassLoading] = useState(false);

  // Load current user data into form
  useEffect(() => {
    if (user) {
      setForm({
        nama: user.nama || '',
        no_hp: user.no_hp || '',
        alamat: user.alamat || '',
      });
    }
  }, [user]);

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', msg: '' });

    try {
      const fd = new FormData();
      fd.append('nama', form.nama);
      fd.append('no_hp', form.no_hp);
      fd.append('alamat', form.alamat);
      if (fotoFile) fd.append('foto_profil', fotoFile);

      await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Refresh user from server
      const meRes = await api.get('/auth/me');
      setUser(meRes.data.data);
      // Update local user state without full re-login
      setProfileMsg({ type: 'success', msg: 'Profil berhasil diperbarui!' });
      setFotoFile(null);
      setPreview(null);
    } catch (err) {
      setProfileMsg({ type: 'error', msg: err?.response?.data?.message || 'Gagal memperbarui profil.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', msg: '' });

    if (passwords.password_baru !== passwords.konfirmasi) {
      setPassMsg({ type: 'error', msg: 'Konfirmasi password tidak cocok.' });
      return;
    }

    setPassLoading(true);
    try {
      await api.put('/auth/password', {
        password_lama: passwords.password_lama,
        password_baru: passwords.password_baru,
      });
      setPassMsg({ type: 'success', msg: 'Password berhasil diubah!' });
      setPasswords({ password_lama: '', password_baru: '', konfirmasi: '' });
    } catch (err) {
      setPassMsg({ type: 'error', msg: err?.response?.data?.message || 'Gagal mengubah password.' });
    } finally {
      setPassLoading(false);
    }
  };

  const avatarSrc = preview || user?.foto_profil_url || null;
  const initials = (user?.nama || 'D').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <PageShell
      title="Profil Saya"
      subtitle="Kelola foto profil, informasi pribadi, dan keamanan akun donatur Anda."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Foto Profil ─────────────────────────────── */}
        <Card className="flex flex-col items-center gap-5 py-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-teal-100 shadow-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Foto profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-white">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center shadow-md hover:bg-teal-700 transition"
              title="Ubah foto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-ink">{user?.nama || '—'}</p>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-teal-50 px-3 py-0.5 text-xs font-semibold text-teal-700">
              Donatur
            </span>
          </div>

          {fotoFile && (
            <p className="text-xs text-slate-500 text-center">
              📸 {fotoFile.name}<br />
              <span className="text-slate-400">Simpan data profil untuk mengunggah foto.</span>
            </p>
          )}
        </Card>

        {/* ── Data Profil & Password ───────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Ubah Data Donatur */}
          <Card>
            <h2 className="font-display text-xl font-bold text-ink mb-5">Ubah Data Pribadi</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Nama Lengkap</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Nama lengkap Anda"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Nomor HP</label>
                <input
                  type="tel"
                  className={INPUT_CLS}
                  value={form.no_hp}
                  onChange={(e) => setForm((f) => ({ ...f, no_hp: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Alamat</label>
                <textarea
                  className={`${INPUT_CLS} resize-none`}
                  rows={3}
                  value={form.alamat}
                  onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                  placeholder="Alamat lengkap"
                />
              </div>
              <Alert type={profileMsg.type} msg={profileMsg.msg} />
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full rounded-2xl bg-teal-600 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </Card>

          {/* Ganti Password */}
          <Card>
            <h2 className="font-display text-xl font-bold text-ink mb-5">Ganti Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Password Lama</label>
                <input
                  type="password"
                  className={INPUT_CLS}
                  value={passwords.password_lama}
                  onChange={(e) => setPasswords((p) => ({ ...p, password_lama: e.target.value }))}
                  placeholder="Masukkan password saat ini"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Password Baru</label>
                <input
                  type="password"
                  className={INPUT_CLS}
                  value={passwords.password_baru}
                  onChange={(e) => setPasswords((p) => ({ ...p, password_baru: e.target.value }))}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Konfirmasi Password Baru</label>
                <input
                  type="password"
                  className={INPUT_CLS}
                  value={passwords.konfirmasi}
                  onChange={(e) => setPasswords((p) => ({ ...p, konfirmasi: e.target.value }))}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                />
              </div>
              <Alert type={passMsg.type} msg={passMsg.msg} />
              <button
                type="submit"
                disabled={passLoading}
                className="w-full rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {passLoading ? 'Memproses...' : 'Ubah Password'}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
