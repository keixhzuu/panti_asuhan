import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function DonaturRiwayatPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/donatur/riwayat')
      .then((response) => setItems(response.data.data))
      .catch(() => {});
  }, []);

  return (
    <PageShell title="Riwayat Donasi" subtitle="Lihat seluruh donasi pribadi yang tersimpan di PostgreSQL berdasarkan akun donatur aktif.">
      <Card>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-bold text-ink">{item.nama_barang}</p>
                  <p className="text-sm text-slate-500">{item.nama_panti} • {item.metode_bayar || 'Metode tidak diisi'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={item.status === 'pending' ? 'ember' : 'sea'}>{item.status}</Badge>
                  <span className="text-sm font-bold text-ink">{formatCurrency(item.nominal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
