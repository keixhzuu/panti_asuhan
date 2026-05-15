import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell, StatCard } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function DonaturTrackingPage() {
  const [data, setData] = useState({ summary: { total_dana_masuk: 0, total_dana_keluar: 0, saldo_akhir: 0 }, timeline: [], galeri: [] });

  useEffect(() => {
    api.get('/donatur/tracking')
      .then((response) => setData(response.data.data))
      .catch(() => {});
  }, []);

  const maxValue = Math.max(data.summary.total_dana_masuk, data.summary.total_dana_keluar, 1);

  return (
    <PageShell title="Tracking Aliran Dana" subtitle="Bandingkan dana masuk vs tersalurkan, lalu lihat timeline Firestore dan galeri bukti penyaluran.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Dana Masuk" value={formatCurrency(data.summary.total_dana_masuk)} tone="ember" />
        <StatCard label="Dana Keluar" value={formatCurrency(data.summary.total_dana_keluar)} tone="sea" />
        <StatCard label="Saldo Akhir" value={formatCurrency(data.summary.saldo_akhir)} tone="moss" />
      </div>

      <Card>
        <h2 className="font-display text-2xl font-bold">Grafik sederhana</h2>
        <div className="mt-4 space-y-4">
          {[
            { label: 'Total dana masuk', value: data.summary.total_dana_masuk, tone: 'ember' },
            { label: 'Total dana keluar', value: data.summary.total_dana_keluar, tone: 'sea' }
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="text-slate-500">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className={`h-3 rounded-full ${item.tone === 'ember' ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${(Number(item.value) / maxValue) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Timeline transparansi</h2>
            <Badge tone="sea">Firestore</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {data.timeline.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-bold text-ink">{item.judul || item.tipe}</p>
                <p className="text-sm text-slate-500">{item.deskripsi_penggunaan || item.pesan || 'Perubahan transparansi'}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Galeri bukti</h2>
            <Badge tone="ember">Foto realtime</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {data.galeri.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {item.url ? <img src={item.url} alt={item.deskripsi || 'Bukti'} className="h-36 w-full object-cover" /> : null}
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink">{item.deskripsi || 'Bukti penyaluran'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
