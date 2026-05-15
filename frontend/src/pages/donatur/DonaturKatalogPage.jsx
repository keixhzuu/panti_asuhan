import { useState } from 'react';
import useFirestoreCollection from '../../hooks/useFirestoreCollection';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

const emptyForm = { id_kebutuhan: '', nominal: '', metode_bayar: 'Transfer Bank', catatan: '' };

export default function DonaturKatalogPage() {
  const { data: needs } = useFirestoreCollection('update_kebutuhan_realtime', { orderByField: 'updated_at', limitCount: 50 });
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append('bukti_transfer', file);

    await api.post('/donasi', payload);
    setMessage('Donasi berhasil dikirim dan menunggu verifikasi pengurus.');
    setForm(emptyForm);
    setFile(null);
  };

  return (
    <PageShell title="Katalog Kebutuhan Realtime" subtitle="Data kebutuhan diambil dari Firestore update_kebutuhan_realtime dan selalu sinkron dengan perubahan admin.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Daftar kebutuhan</h2>
            <Badge tone="sea">Live Firestore</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {needs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, id_kebutuhan: item.id }))}
                className={`rounded-3xl border p-4 text-left transition ${form.id_kebutuhan === item.id ? 'border-ember bg-amber-50' : 'border-slate-200 bg-white hover:border-ember/40'}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-ink">{item.nama_barang}</p>
                    <p className="text-sm text-slate-500">{item.nama_panti || `Panti #${item.id_panti}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ember">{item.jumlah_dibutuhkan} {item.satuan || ''}</p>
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
            <SelectField value={form.id_kebutuhan} onChange={(e) => setForm((prev) => ({ ...prev, id_kebutuhan: e.target.value }))}>
              <option value="">Pilih kebutuhan</option>
              {needs.map((item) => <option key={item.id} value={item.id}>{item.nama_barang}</option>)}
            </SelectField>
            <TextField type="number" placeholder="Nominal donasi" value={form.nominal} onChange={(e) => setForm((prev) => ({ ...prev, nominal: e.target.value }))} />
            <SelectField value={form.metode_bayar} onChange={(e) => setForm((prev) => ({ ...prev, metode_bayar: e.target.value }))}>
              <option>Transfer Bank</option>
              <option>E-Wallet</option>
              <option>Virtual Account</option>
            </SelectField>
            <TextAreaField rows="4" placeholder="Catatan tambahan" value={form.catatan} onChange={(e) => setForm((prev) => ({ ...prev, catatan: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:font-semibold file:text-ember" />
            {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
            <Button type="submit" className="w-full">Kirim Donasi</Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
