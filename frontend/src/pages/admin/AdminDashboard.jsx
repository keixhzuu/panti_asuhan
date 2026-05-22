import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, PageShell, StatCard, Badge } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentNeeds, setRecentNeeds] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/kebutuhan'),
      api.get('/donasi/pending')
    ])
      .then(([statsResponse, needsResponse, donationResponse]) => {
        setStats(statsResponse.data.data);
        const sortedNeeds = [...needsResponse.data.data].sort((a, b) => {
          const remainingA = Number(a.sisa_kebutuhan_terverifikasi ?? a.jumlah_dibutuhkan ?? 0);
          const remainingB = Number(b.sisa_kebutuhan_terverifikasi ?? b.jumlah_dibutuhkan ?? 0);
          if (remainingA !== remainingB) return remainingA - remainingB;
          const createdA = new Date(a.created_at || 0).getTime();
          const createdB = new Date(b.created_at || 0).getTime();
          return createdB - createdA;
        });
        setRecentNeeds(sortedNeeds.slice(0, 5));
        setRecentDonations(donationResponse.data.data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <PageShell
      title="Dashboard Admin"
      subtitle="Pantau donasi masuk, kebutuhan aktif, donatur baru, dan stok yang hampir habis dalam satu tampilan."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Donasi Masuk" value={formatCurrency(stats?.total_donasi_masuk)} tone="ember" />
        <StatCard label="Kebutuhan Aktif" value={stats?.jumlah_kebutuhan_aktif ?? 0} tone="sea" />
        <StatCard label="Donatur Baru" value={stats?.donatur_baru ?? 0} tone="moss" />
        <StatCard label="Stok Hampir Habis" value={stats?.stok_hampir_habis ?? 0} tone="ember" />
        <StatCard label="Total Penyaluran" value={formatCurrency(stats?.total_penyaluran)} tone="sea" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Kebutuhan terbaru</h2>
            <Badge tone="sea">Realtime SQL + Firestore</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {recentNeeds.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-teal-50 px-4 py-3 shadow-sm">
                <div>
                  <p className="font-semibold text-ink">{item.nama_barang}</p>
                  <p className="text-sm text-slate-500">{item.nama_panti}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-sea">Prioritas</p>
                  <p className="text-sm font-extrabold text-ember">{item.sisa_kebutuhan_terverifikasi} {item.satuan || ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Donasi pending</h2>
            <Badge tone="ember">Perlu verifikasi</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {recentDonations.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{item.nama_donatur}</p>
                    <p className="text-sm text-slate-500">{item.nama_barang}</p>
                  </div>
                  <p className="text-sm font-bold text-ink">{formatCurrency(item.nominal)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
