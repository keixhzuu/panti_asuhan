import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell, StatCard } from '../../components/UI';
import { formatCurrency } from '../../utils/format';
import TransactionChart from '../../components/TransactionChart';
import PieChart from '../../components/PieChart';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DonaturTrackingPage() {
  const [data, setData] = useState({
    summary: { total_dana_masuk: 0, total_dana_keluar: 0, saldo_akhir: 0 },
  });
  const [trendData, setTrendData] = useState([]);
  const [kategoriData, setKategoriData] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/donatur/tracking'),
      api.get('/laporan/trend'),
      api.get('/laporan/kategori'),
    ]).then(([trackingRes, trendRes, kategoriRes]) => {
      if (trackingRes.status === 'fulfilled') {
        setData(trackingRes.value.data.data);
      }
      if (trendRes.status === 'fulfilled') {
        setTrendData(trendRes.value.data.data);
      }
      if (kategoriRes.status === 'fulfilled') {
        setKategoriData(kategoriRes.value.data.data);
      }
    });
  }, []);

  const sisaDana = (data.summary.total_dana_masuk || 0) - (data.summary.total_dana_keluar || 0);

  return (
    <PageShell
      title="Tracking Aliran Dana"
      subtitle="Bandingkan dana masuk vs tersalurkan, pantau grafik tren dan distribusi penyaluran per kategori barang."
    >
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Dana Masuk" value={formatCurrency(data.summary.total_dana_masuk)} tone="ember" />
        <StatCard label="Dana Keluar" value={formatCurrency(data.summary.total_dana_keluar)} tone="sea" />
        <StatCard label="Sisa Dana" value={formatCurrency(sisaDana)} tone="moss" />
      </div>

      {/* Grafik Transparansi Card */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Grafik Transparansi Keuangan</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Tren dana masuk &amp; keluar 30 hari terakhir, serta distribusi penyaluran per kategori barang.
            </p>
          </div>
          <Badge tone="sea">Realtime</Badge>
        </div>

        {/* Line Chart */}
        <div className="mt-6 h-[260px]">
          {trendData && trendData.length > 0 ? (
            <TransactionChart data={trendData} />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Memuat data grafik tren...
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-slate-100" />

        {/* Pie Chart Section */}
        <div>
          <h3 className="font-semibold text-slate-700 text-base mb-1">Distribusi Penyaluran per Panti Penerima</h3>
          <p className="text-xs text-slate-400 mb-2">
            Proporsi total dana yang tersalurkan berdasarkan panti asuhan penerima manfaat.
          </p>
          <PieChart data={kategoriData} />
        </div>
      </Card>

    </PageShell>
  );
}
