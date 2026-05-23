import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

const initialForm = {
  id_kebutuhan: '',
  id_panti: '',
  jumlah_disalurkan: '',
  tanggal_salur: new Date().toISOString().slice(0, 10),
  deskripsi_penggunaan: ''
};

export default function AdminPenyaluranPage() {
  const [readyCategories, setReadyCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const categoriesResponse = await api.get('/penyaluran/ready-categories');
      setReadyCategories(categoriesResponse.data.data);
    } catch (loadError) {
      setError('Gagal memuat data penyaluran.');
    }
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setForm((prev) => ({
        ...prev,
        id_kebutuhan: '',
        id_panti: '',
        jumlah_disalurkan: ''
      }));
      return;
    }

    const category = readyCategories.find((cat) => String(cat.id_kebutuhan) === String(selectedId));
    if (category) {
      setForm((prev) => ({
        ...prev,
        id_kebutuhan: category.id_kebutuhan,
        id_panti: category.id_panti,
        jumlah_disalurkan: category.total_nominal
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.id_kebutuhan) {
      setError('Kategori barang donasi wajib dipilih.');
      return;
    }

    setLoading(true);

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append('foto_bukti', file);

    try {
      await api.post('/penyaluran', payload);
      setMessage('Penyaluran dana berhasil disimpan untuk seluruh donasi di kategori ini.');
      setForm(initialForm);
      setFile(null);
      await loadData();
    } catch (submitError) {
      const responseMessage = submitError.response?.data?.message;
      setError(responseMessage || submitError.message || 'Gagal menyimpan penyaluran.');
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Penyaluran Dana" subtitle="Pilih kategori barang dengan donasi yang sudah diverifikasi untuk menyalurkan dana secara akumulatif ke panti terkait.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-bold">Buat penyaluran</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Barang Donasi</label>
              <SelectField value={form.id_kebutuhan} onChange={handleCategoryChange}>
                <option value="">Pilih kategori barang</option>
                {readyCategories.map((item) => (
                  <option key={item.id_kebutuhan} value={item.id_kebutuhan}>
                    {item.nama_barang} — {formatCurrency(item.total_nominal)}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Penerima Panti</label>
              <TextField
                type="text"
                placeholder="Pilih kategori untuk mengisi panti"
                value={
                  form.id_kebutuhan
                    ? readyCategories.find((cat) => String(cat.id_kebutuhan) === String(form.id_kebutuhan))?.nama_panti || ''
                    : ''
                }
                readOnly
                className="bg-slate-50 border-slate-100 text-slate-500 font-extrabold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nominal Disalurkan</label>
              <TextField
                type="text"
                placeholder="Pilih kategori untuk mengisi nominal"
                value={form.jumlah_disalurkan ? formatCurrency(form.jumlah_disalurkan) : ''}
                readOnly
                className="bg-slate-50 border-slate-100 text-slate-500 font-extrabold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Penyaluran</label>
              <TextField type="date" value={form.tanggal_salur} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_salur: e.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi Penggunaan</label>
              <TextAreaField rows="3" placeholder="Tulis rincian penggunaan dana untuk transparansi..." value={form.deskripsi_penggunaan} onChange={(e) => setForm((prev) => ({ ...prev, deskripsi_penggunaan: e.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Foto Bukti Penyaluran</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:font-semibold file:text-ember" />
            </div>

            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</p> : null}
            {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-8 11h4z"></path>
                  </svg>
                  Mengirim...
                </span>
              ) : (
                'Simpan Penyaluran'
              )}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Kategori siap disalurkan</h2>
          </div>
          <div className="mt-4 space-y-3">
            {readyCategories.map((item) => (
              <div key={item.id_kebutuhan} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-ink">{item.nama_barang}</p>
                    <p className="text-sm text-slate-500">{item.nama_panti}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-ember">{formatCurrency(item.total_nominal)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Akumulasi donasi</p>
                  </div>
                </div>
              </div>
            ))}
            {readyCategories.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-slate-400">Tidak ada donasi terverifikasi yang siap disalurkan.</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
