import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, PageShell } from '../../components/UI';

const INPUT_CLS =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-ink placeholder-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition';
const LABEL_CLS = 'block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5';

export default function AdminTambahPantiPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [form, setForm] = useState({
    nama_panti: '',
    alamat: '',
    no_telepon: '',
    email_panti: '',
    deskripsi: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_panti.trim()) {
      setError('Nama panti wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fd = new FormData();
      fd.append('nama_panti', form.nama_panti);
      fd.append('alamat', form.alamat);
      fd.append('no_telepon', form.no_telepon);
      fd.append('email_panti', form.email_panti);
      fd.append('deskripsi', form.deskripsi);
      if (fotoFile) fd.append('foto_panti', fotoFile);

      await api.post('/panti', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Panti berhasil ditambahkan!');
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menambahkan panti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Tambah Panti Asuhan"
      subtitle="Daftarkan panti asuhan baru ke dalam sistem. Data akan langsung tersimpan di database."
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Foto Panti */}
            <div>
              <label className={LABEL_CLS}>Foto Panti</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group rounded-3xl border-2 border-dashed border-slate-200 hover:border-teal-400 transition overflow-hidden bg-slate-50 flex items-center justify-center"
                style={{ height: 200 }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300 mx-auto mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-400 font-medium">Klik untuk unggah foto panti</p>
                    <p className="text-xs text-slate-300 mt-1">JPG, PNG, WebP · Maks. 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </div>
            </div>

            {/* Nama Panti */}
            <div>
              <label className={LABEL_CLS}>
                Nama Panti <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className={INPUT_CLS}
                value={form.nama_panti}
                onChange={handleChange('nama_panti')}
                placeholder="Contoh: Panti Asuhan Al-Ikhlas"
                required
              />
            </div>

            {/* Alamat */}
            <div>
              <label className={LABEL_CLS}>Alamat</label>
              <textarea
                className={`${INPUT_CLS} resize-none`}
                rows={3}
                value={form.alamat}
                onChange={handleChange('alamat')}
                placeholder="Jl. Contoh No. 1, Kota, Provinsi"
              />
            </div>

            {/* No Telepon & Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>No. Telepon</label>
                <input
                  type="tel"
                  className={INPUT_CLS}
                  value={form.no_telepon}
                  onChange={handleChange('no_telepon')}
                  placeholder="021-xxxxxxx"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Email Panti</label>
                <input
                  type="email"
                  className={INPUT_CLS}
                  value={form.email_panti}
                  onChange={handleChange('email_panti')}
                  placeholder="panti@example.com"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className={LABEL_CLS}>Deskripsi / Profil Panti</label>
              <textarea
                className={`${INPUT_CLS} resize-none`}
                rows={4}
                value={form.deskripsi}
                onChange={handleChange('deskripsi')}
                placeholder="Ceritakan singkat tentang panti asuhan ini..."
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {success}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-teal-600 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambah Panti'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
