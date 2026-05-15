import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell } from '../../components/UI';

export default function DonaturGaleriPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/donatur/galeri')
      .then((response) => setItems(response.data.data))
      .catch(() => {});
  }, []);

  return (
    <PageShell title="Galeri Bukti" subtitle="Semua foto penyaluran dan bukti kegiatan yang tersimpan di Firestore dikumpulkan di sini.">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Foto bukti</h2>
          <Badge tone="sea">Realtime</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {item.url ? <img src={item.url} alt={item.deskripsi || 'Bukti'} className="h-56 w-full object-cover" /> : null}
              <figcaption className="p-4 text-sm text-slate-600">{item.deskripsi || 'Bukti penyaluran'}</figcaption>
            </figure>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
