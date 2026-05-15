import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button, Card, PageShell, SelectField, TextField, Badge } from '../../components/UI';

const emptyForm = { id_panti: '', nama_barang: '', jumlah_dibutuhkan: '', satuan: '', tingkat_urgensi: 'Biasa', status: 'aktif' };

export default function AdminKebutuhanPage() {
  const [items, setItems] = useState([]);
  const [pantis, setPantis] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    const [needsResponse, pantiResponse] = await Promise.all([api.get('/kebutuhan'), api.get('/panti')]);
    setItems(needsResponse.data.data);
    setPantis(pantiResponse.data.data);
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { ...form, jumlah_dibutuhkan: Number(form.jumlah_dibutuhkan) };
    if (editingId) {
      await api.put(`/kebutuhan/${editingId}`, payload);
    } else {
      await api.post('/kebutuhan', payload);
    }
    await loadData();
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      id_panti: item.id_panti,
      nama_barang: item.nama_barang,
      jumlah_dibutuhkan: item.jumlah_dibutuhkan,
      satuan: item.satuan || '',
      tingkat_urgensi: item.tingkat_urgensi,
      status: item.status
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/kebutuhan/${id}`);
    await loadData();
  };

  return (
    <PageShell title="Manajemen Kebutuhan" subtitle="CRUD kebutuhan logistik dan sinkronisasi realtime ke Firestore collection update_kebutuhan_realtime.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-bold">{editingId ? 'Edit kebutuhan' : 'Tambah kebutuhan'}</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <SelectField value={form.id_panti} onChange={(e) => setForm((prev) => ({ ...prev, id_panti: e.target.value }))}>
              <option value="">Pilih panti</option>
              {pantis.map((panti) => <option key={panti.id} value={panti.id}>{panti.nama_panti}</option>)}
            </SelectField>
            <TextField placeholder="Nama barang" value={form.nama_barang} onChange={(e) => setForm((prev) => ({ ...prev, nama_barang: e.target.value }))} />
            <TextField type="number" placeholder="Jumlah dibutuhkan" value={form.jumlah_dibutuhkan} onChange={(e) => setForm((prev) => ({ ...prev, jumlah_dibutuhkan: e.target.value }))} />
            <TextField placeholder="Satuan" value={form.satuan} onChange={(e) => setForm((prev) => ({ ...prev, satuan: e.target.value }))} />
            <SelectField value={form.tingkat_urgensi} onChange={(e) => setForm((prev) => ({ ...prev, tingkat_urgensi: e.target.value }))}>
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
            </SelectField>
            <SelectField value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="aktif">Aktif</option>
              <option value="selesai">Selesai</option>
            </SelectField>
            <div className="flex gap-3">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            </div>
          </form>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Daftar kebutuhan</h2>
            <Badge tone="sea">Sinkron realtime aktif</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-ink">{item.nama_barang}</p>
                    <p className="text-sm text-slate-500">{item.nama_panti} • {item.jumlah_dibutuhkan} {item.satuan}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={item.tingkat_urgensi === 'Penting' ? 'ember' : 'neutral'}>{item.tingkat_urgensi}</Badge>
                    <Badge tone={item.status === 'aktif' ? 'sea' : 'neutral'}>{item.status}</Badge>
                    <Button variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(item.id)}>Hapus</Button>
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
