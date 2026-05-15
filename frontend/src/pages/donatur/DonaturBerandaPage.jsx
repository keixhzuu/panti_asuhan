import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, StatCard } from '../../components/UI';

export default function DonaturBerandaPage() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    api.get('/cerita')
      .then((response) => setStories(response.data.data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <PageShell
      title="Beranda Donatur"
      subtitle="Lihat ringkasan, cerita aktivitas panti, dan akses cepat ke katalog kebutuhan realtime, tracking dana, serta riwayat donasi pribadi."
      actions={[
        <Button key="katalog" as={Link} to="/donatur/katalog">Donasi Sekarang</Button>
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Donasi Digital" value="Realtime" tone="ember" />
        <StatCard label="Notifikasi" value="Langsung" tone="sea" />
        <StatCard label="Transparansi" value="Penuh" tone="moss" />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Cerita terbaru</h2>
          <Badge tone="sea">Dari API SQL</Badge>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {stories.map((story) => (
            <div key={story.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              {story.foto_url ? <img src={story.foto_url} alt={story.judul} className="mb-3 h-44 w-full rounded-2xl object-cover" /> : null}
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-ember/70">{story.nama_panti}</p>
              <h3 className="mt-2 font-bold text-ink">{story.judul}</h3>
              <p className="mt-2 text-sm text-slate-600">{story.konten}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
