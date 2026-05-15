import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

const initialForm = {
  id_donasi: '',
  id_panti: '',
  jumlah_disalurkan: '',
  tanggal_salur: new Date().toISOString().slice(0, 10),
  deskripsi_penggunaan: ''
};

export default function AdminPenyaluranPage() {
  const [verifiedDonations, setVerifiedDonations] = useState([]);
  const [pantis, setPantis] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [donationResponse, pantiResponse] = await Promise.all([api.get('/donasi/verified'), api.get('/panti')]);
    setVerifiedDonations(donationResponse.data.data);
    setPantis(pantiResponse.data.data);
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append('foto_bukti', file);

    const response = await api.post('/penyaluran', payload);
    setMessage(`Penyaluran tersimpan dengan ID ${response.data.data.id}.`);
    setForm(initialForm);
    setFile(null);
  };

  return (
    <PageShell title="Penyaluran Dana" subtitle="Pilih donasi yang sudah diverifikasi, isi jumlah disalurkan, unggah foto bukti, lalu sistem menulis ke SQL dan Firestore timeline.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-bold">Buat penyaluran</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <SelectField value={form.id_donasi} onChange={(e) => setForm((prev) => ({ ...prev, id_donasi: e.target.value }))}>
              <option value="">Pilih donasi terverifikasi</option>
              {verifiedDonations.map((item) => (
                <option key={item.id} value={item.id}>{item.nama_donatur} - {item.nama_barang} ({formatCurrency(item.nominal)})</option>
              ))}
            </SelectField>
            <SelectField value={form.id_panti} onChange={(e) => setForm((prev) => ({ ...prev, id_panti: e.target.value }))}>
              <option value="">Pilih panti</option>
              {pantis.map((panti) => <option key={panti.id} value={panti.id}>{panti.nama_panti}</option>)}
            </SelectField>
            <TextField type="number" placeholder="Jumlah disalurkan" value={form.jumlah_disalurkan} onChange={(e) => setForm((prev) => ({ ...prev, jumlah_disalurkan: e.target.value }))} />
            <TextField type="date" value={form.tanggal_salur} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_salur: e.target.value }))} />
            <TextAreaField rows="4" placeholder="Deskripsi penggunaan" value={form.deskripsi_penggunaan} onChange={(e) => setForm((prev) => ({ ...prev, deskripsi_penggunaan: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:font-semibold file:text-ember" />
            {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
            <Button type="submit" className="w-full">Simpan Penyaluran</Button>
          </form>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Donasi terverifikasi</h2>
            <Badge tone="sea">Siap disalurkan</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {verifiedDonations.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-ink">{item.nama_donatur}</p>
                    <p className="text-sm text-slate-500">{item.nama_barang}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ember">{formatCurrency(item.nominal)}</p>
                    <p className="text-xs text-slate-500">{item.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
