import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

const emptyForm = { id_kebutuhan: '', jumlah_donasi: '', metode_bayar: 'Transfer Bank', catatan: '' };

export default function DonaturKatalogPage() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');

  const selectedNeed = needs.find((item) => String(item.id) === String(form.id_kebutuhan));
  const sisaDonasi = Number(selectedNeed?.sisa_donasi || 0);
  const jumlahDonasi = Number(form.jumlah_donasi || 0);
  const totalHarga = selectedNeed ? Number(selectedNeed.harga_satuan || 0) * jumlahDonasi : 0;
  const isFulfilled = Boolean(selectedNeed) && sisaDonasi <= 0;
  const isOverLimit = Boolean(selectedNeed) && jumlahDonasi > sisaDonasi;
  const isBusy = submitState !== 'idle';

  useEffect(() => {
    api.get('/donatur/katalog')
      .then((response) => setNeeds(response.data.data))
      .catch(() => setNeeds([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.id_kebutuhan) return;
    setSubmitError('');
    if (isFulfilled) {
      setSubmitError('Kebutuhan sudah terpenuhi. Pilih kebutuhan lain.');
      return;
    }
    if (isOverLimit) {
      setSubmitError('Jumlah pcs tidak boleh melebihi kebutuhan yang tersedia.');
      return;
    }

    setSubmitState('saving');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append('bukti_transfer', file);

    try {
      await api.post('/donasi', payload);
      setSubmitState('redirecting');
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate('/donatur/riwayat');
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Donasi gagal dikirim. Coba lagi.');
      setSubmitState('idle');
    }
  };

  return (
    <PageShell title="Katalog Kebutuhan" subtitle="Data kebutuhan diambil dari PostgreSQL dan menampilkan daftar aktif dari panti.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Daftar kebutuhan</h2>
            <Badge tone="sea">Live DB</Badge>
          </div>
          <div className="mt-4 grid max-h-[70vh] gap-3 overflow-y-auto pr-2">
            {needs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, id_kebutuhan: item.id }))}
                aria-pressed={String(form.id_kebutuhan) === String(item.id)}
                className={`rounded-3xl border p-4 text-left transition ${form.id_kebutuhan === item.id ? 'border-ember bg-amber-50' : 'border-slate-200 bg-white hover:border-ember/40'}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-ink">{item.nama_barang}</p>
                    <p className="text-sm text-slate-500">{item.nama_panti || `Panti #${item.id_panti}`}</p>
                    <p className="text-sm text-slate-600">{formatCurrency(item.harga_satuan)}/{item.satuan || 'unit'} • Total harga: {formatCurrency(Number(item.harga_satuan || 0) * Number(item.jumlah_dibutuhkan || 0))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ember">{item.sisa_donasi} {item.satuan || ''}</p>
                    <p className="text-xs text-slate-500">Urgensi: {item.tingkat_urgensi}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-bold">Donasi digital</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <TextField
              placeholder="Klik kebutuhan di daftar sebelah kiri"
              value={selectedNeed?.nama_barang || ''}
              readOnly
            />
            <TextField
              type="number"
              min="1"
              max={selectedNeed ? sisaDonasi : undefined}
              disabled={!selectedNeed || isFulfilled || isBusy}
              placeholder="Jumlah pcs / satuan"
              value={form.jumlah_donasi}
              onChange={(e) => setForm((prev) => ({ ...prev, jumlah_donasi: e.target.value }))}
            />
            {isOverLimit ? (
              <p className="text-xs text-red-600">Jumlah pcs tidak boleh melebihi kebutuhan yang tersedia.</p>
            ) : null}
            <TextField
              placeholder="Total harga tagihan"
              value={selectedNeed ? formatCurrency(totalHarga) : ''}
              readOnly
            />
            <SelectField
              value={form.metode_bayar}
              disabled={!selectedNeed || isFulfilled || isOverLimit || isBusy}
              onChange={(e) => setForm((prev) => ({ ...prev, metode_bayar: e.target.value }))}
            >
              <option>Transfer Bank</option>
              <option>E-Wallet</option>
              <option>Virtual Account</option>
            </SelectField>
            <TextAreaField rows="4" placeholder="Catatan tambahan" value={form.catatan} onChange={(e) => setForm((prev) => ({ ...prev, catatan: e.target.value }))} disabled={isBusy} />
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isBusy} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:font-semibold file:text-ember" />
            {submitError ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p> : null}
            {isBusy ? (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-ember" />
                {submitState === 'saving' ? 'Menyimpan donasi...' : 'Mengalihkan ke riwayat donasi...'}
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={!selectedNeed || isFulfilled || isOverLimit || isBusy}>Kirim Donasi</Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
