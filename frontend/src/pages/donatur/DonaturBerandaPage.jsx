import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, StatCard } from '../../components/UI';
import TransactionChart from '../../components/TransactionChart';

export default function DonaturBerandaPage() {
  const [stories, setStories] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/cerita'),
      api.get('/laporan/trend')
    ])
      .then(([storiesResponse, trendResponse]) => {
        setStories(storiesResponse.data.data.slice(0, 3));
        setTrendData(trendResponse.data.data);
      })
      .catch(() => { });
  }, []);

  return (
    <PageShell
      title="Beranda Donatur"
      subtitle="Lihat ringkasan, cerita aktivitas panti, dan akses cepat ke katalog kebutuhan realtime, tracking dana, serta riwayat donasi pribadi."
      actions={[
        <Button key="donasi" as={Link} to="/donatur/donasi">Donasi Sekarang</Button>
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Donasi Realtime" value="Transparan" tone="ember" />
        <StatCard label="Notifikasi" value="Langsung" tone="sea" />
        <StatCard label="Penyaluran Dana" value="Terlacak" tone="moss" />
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

      <Card className="mt-6">
        <h2 className="font-display text-2xl font-bold">Tren Transparansi Keuangan Panti</h2>
        <p className="text-sm text-slate-500 mt-1">Pantau pergerakan dana masuk (donasi terverifikasi) dan dana keluar (penyaluran berhasil) selama 30 hari terakhir secara transparan.</p>
        <div className="mt-6 h-[300px]">
          {trendData && trendData.length > 0 ? (
            <TransactionChart data={trendData} />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">Memuat data grafik...</div>
          )}
        </div>
      </Card>
    </PageShell>
  );
}
