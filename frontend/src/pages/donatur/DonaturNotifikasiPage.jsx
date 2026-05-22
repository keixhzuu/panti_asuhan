import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell } from '../../components/UI';

export default function DonaturNotifikasiPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/donatur/notifikasi')
      .then((response) => setItems(response.data.data))
      .catch(() => setItems([]));
  }, [user?.id_donatur]);

  return (
    <PageShell title="Notifikasi Donatur" subtitle="Notifikasi diambil dari PostgreSQL berdasarkan akun donatur aktif.">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Kotak notifikasi</h2>
          <Badge tone="ember">Live DB</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-ink">{item.judul || 'Notifikasi'}</p>
              <p className="text-sm text-slate-600">{item.pesan}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
