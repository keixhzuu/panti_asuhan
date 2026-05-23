import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, PageShell, StatCard, Badge } from '../../components/UI';
import { formatCurrency } from '../../utils/format';
import TransactionChart from '../../components/TransactionChart';

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
      .catch(() => { });
  }, []);

  const generateMonthsList = () => {
    const list = [];
    const today = new Date();
    // Generate the last 12 months dynamically
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push({ label, value });
    }
    return list;
  };

  const handleDownloadPdf = async (monthValue, monthLabel) => {
    try {
      const response = await api.get('/laporan/download-pdf', {
        params: { periode_bulan: monthValue },
        responseType: 'blob'
      });
      const monthNamesLower = [
        'januari', 'februari', 'maret', 'april', 'mei', 'juni',
        'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
      ];
      const parts = monthValue.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthNameLower = monthNamesLower[monthIdx];
      const filename = `laporan-transparansi-${monthNameLower}.pdf`;

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Gagal mengunduh PDF:', error);
      alert('Gagal mengunduh laporan PDF.');
    }
  };

  const handleDownloadExcel = async (monthValue, monthLabel) => {
    try {
      const response = await api.get('/laporan/download-excel', {
        params: { periode_bulan: monthValue },
        responseType: 'blob'
      });
      const monthNamesLower = [
        'januari', 'februari', 'maret', 'april', 'mei', 'juni',
        'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
      ];
      const parts = monthValue.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthNameLower = monthNamesLower[monthIdx];
      const filename = `laporan-transparansi-${monthNameLower}.xlsx`;

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Gagal mengunduh Excel:', error);
      alert('Gagal mengunduh laporan Excel.');
    }
  };

  return (
    <PageShell
      title="Dashboard Admin"
      subtitle="Pantau donasi masuk, kebutuhan aktif, jumlah donatur, dan kebutuhan yang sudah terpenuhi dalam satu tampilan."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Donasi Masuk" value={formatCurrency(stats?.total_donasi_masuk)} tone="ember" />
        <StatCard label="Kebutuhan Aktif" value={stats?.jumlah_kebutuhan_aktif ?? 0} tone="sea" />
        <StatCard label="Jumlah Donatur" value={stats?.total_donatur ?? 0} tone="moss" />
        <StatCard label="Kebutuhan Terpenuhi" value={stats?.kebutuhan_terpenuhi ?? 0} tone="ember" />
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

      <div className="grid gap-6 xl:grid-cols-3 mt-6">
        <div className="xl:col-span-2">
          <Card className="h-full">
            <h2 className="font-display text-2xl font-bold">Tren Pemasukan & Pengeluaran</h2>
            <p className="text-sm text-slate-500 mt-1">Grafik harian dana donasi terverifikasi vs penyaluran dana berhasil (30 hari terakhir)</p>
            <div className="mt-6 h-[300px]">
              {stats?.trend_data ? (
                <TransactionChart data={stats.trend_data} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Memuat data grafik...</div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <h2 className="font-display text-2xl font-bold">Laporan Transparansi Bulanan</h2>
            <p className="text-sm text-slate-500 mt-1">Unduh laporan keuangan transparansi (uang masuk & keluar) per bulan.</p>
            <div className="mt-6 divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
              {generateMonthsList().map((item) => (
                <div key={item.value} className="flex items-center justify-between py-3 gap-2">
                  <span className="font-medium text-ink text-sm sm:text-base">{item.label}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadPdf(item.value, item.label)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 text-ember px-3 py-1.5 text-xs font-bold transition hover:bg-amber-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownloadExcel(item.value, item.label)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 text-sea px-3 py-1.5 text-xs font-bold transition hover:bg-teal-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
