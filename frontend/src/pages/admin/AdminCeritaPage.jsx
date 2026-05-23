import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';
import { useToast } from '../../components/ToastProvider';

const emptyForm = { id_panti: '', judul: '', konten: '' };

export default function AdminCeritaPage() {
  const [stories, setStories] = useState([]);
  const [pantis, setPantis] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast, queueToast } = useToast();

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
    setPhotos([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // client-side validation
    if (!form.id_panti || !form.judul || !form.konten) {
      addToast({ title: 'Gagal', message: 'Panti, judul, dan konten wajib diisi.', tone: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      photos.forEach((photo) => payload.append('fotos', photo));

      if (editingId) {
        await api.put(`/cerita/${editingId}`, payload);
        // queue success toast and redirect
        queueToast({ title: 'Berhasil', message: 'Cerita diperbarui.', tone: 'success', duration: 5000 });
      } else {
        await api.post('/cerita', payload);
        queueToast({ title: 'Berhasil', message: 'Cerita ditambahkan.', tone: 'success', duration: 5000 });
      }
      // redirect to admin cerita (force reload to ensure ToastProvider reads queued toast)
      window.location.assign('/admin/cerita');
    } catch (err) {
      console.error('Cerita submit error', err);
      // show immediate error toast and keep on page so user can fix
      const message = err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat mengunggah cerita.';
      addToast({ title: 'Gagal', message, tone: 'danger' });
      // log response body if available for debugging
      if (err?.response?.data) console.debug('Server response:', err.response.data);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (story) => {
    setEditingId(story.id);
    setForm({ id_panti: story.id_panti, judul: story.judul, konten: story.konten });
    setPhotos([]);
  };

  const handleDelete = async (id) => {
    await api.delete(`/cerita/${id}`);
    await loadData();
  };

  return (
    <PageShell title="Cerita Aktivitas" subtitle="Tambahkan artikel dan ceritakan aktivitasmu ke donatur.">
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
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:font-semibold file:text-sea"
              />
              <p className="text-xs text-slate-400">Pilih satu atau beberapa foto sekaligus. Jika sedang edit, foto baru akan menggantikan foto lama.</p>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2">
                  {photos.map((photo) => (
                    <div key={`${photo.name}-${photo.lastModified}`} className="rounded-xl bg-white p-2 text-xs text-slate-600">
                      <p className="truncate font-medium">{photo.name}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Mengirim...' : 'Simpan'}</Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>Reset</Button>
            </div>
          </form>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Daftar cerita</h2>
          </div>
          <div className="mt-4 grid gap-4">
            {stories.map((story) => (
              <div key={story.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="font-bold text-ink">{story.judul}</p>
                    <p className="text-sm text-slate-600">{story.nama_panti}</p>
                    <p
                      className="text-sm text-slate-500"
                      style={{
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 5,
                        overflow: 'hidden'
                      }}
                    >
                      {story.konten}
                    </p>
                    {(story.foto_urls?.[0] || story.foto_url) ? <img src={story.foto_urls?.[0] || story.foto_url} alt={story.judul} className="h-40 w-full rounded-2xl object-cover" /> : null}
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
