import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button, Card, PageShell, Badge } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function AdminVerifikasiDonasiPage() {
  const [items, setItems] = useState([]);

  const loadData = async () => {
    const response = await api.get('/donasi/pending');
    setItems(response.data.data);
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const verify = async (id, status) => {
    await api.put(`/donasi/${id}/verify`, { status });
    await loadData();
  };

  return (
    <PageShell title="Verifikasi Donasi" subtitle="Daftar donasi pending, ubah status menjadi terverifikasi atau diterima, lalu sistem akan mengirim notifikasi Firestore ke donatur terkait.">
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-ink">{item.nama_donatur}</p>
                  <Badge tone="ember">Pending</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.nama_barang}</p>
                <p className="mt-1 text-sm text-slate-500">{item.metode_bayar || 'Metode tidak diisi'} • {formatCurrency(item.nominal)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => verify(item.id, 'terverifikasi')}>Verifikasi</Button>
                <Button onClick={() => verify(item.id, 'diterima')}>Terima</Button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 ? <Card><p className="text-sm text-slate-500">Tidak ada donasi pending.</p></Card> : null}
      </div>
    </PageShell>
  );
}
