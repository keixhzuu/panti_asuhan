import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';

const emptyForm = { id_panti: '', judul: '', konten: '' };

export default function AdminCeritaPage() {
  const [stories, setStories] = useState([]);
  const [pantis, setPantis] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [photo, setPhoto] = useState(null);

  const loadData = async () => {
    const [storyResponse, pantiResponse] = await Promise.all([api.get('/cerita'), api.get('/panti')]);
    setStories(storyResponse.data.data);
    setPantis(pantiResponse.data.data);
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setPhoto(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (photo) payload.append('foto', photo);

    if (editingId) {
      await api.put(`/cerita/${editingId}`, payload);
    } else {
      await api.post('/cerita', payload);
    }
    await loadData();
    resetForm();
  };

  const handleEdit = (story) => {
    setEditingId(story.id);
    setForm({ id_panti: story.id_panti, judul: story.judul, konten: story.konten });
  };

  const handleDelete = async (id) => {
    await api.delete(`/cerita/${id}`);
    await loadData();
  };

  return (
    <PageShell title="Cerita Aktivitas" subtitle="Kelola cerita panti asuhan dan simpan foto ke Cloud Storage. Log aktivitas juga bisa disinkronkan ke Firestore opsional.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-bold">{editingId ? 'Edit cerita' : 'Tambah cerita'}</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <SelectField value={form.id_panti} onChange={(e) => setForm((prev) => ({ ...prev, id_panti: e.target.value }))}>
              <option value="">Pilih panti</option>
              {pantis.map((panti) => <option key={panti.id} value={panti.id}>{panti.nama_panti}</option>)}
            </SelectField>
            <TextField placeholder="Judul cerita" value={form.judul} onChange={(e) => setForm((prev) => ({ ...prev, judul: e.target.value }))} />
            <TextAreaField rows="6" placeholder="Konten cerita" value={form.konten} onChange={(e) => setForm((prev) => ({ ...prev, konten: e.target.value }))} />
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:font-semibold file:text-sea" />
            <div className="flex gap-3">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            </div>
          </form>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Daftar cerita</h2>
            <Badge tone="ember">SQL + Storage</Badge>
          </div>
          <div className="mt-4 grid gap-4">
            {stories.map((story) => (
              <div key={story.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="font-bold text-ink">{story.judul}</p>
                    <p className="text-sm text-slate-600">{story.nama_panti}</p>
                    <p className="text-sm text-slate-500">{story.konten}</p>
                    {story.foto_url ? <img src={story.foto_url} alt={story.judul} className="h-40 w-full rounded-2xl object-cover" /> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEdit(story)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(story.id)}>Hapus</Button>
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
