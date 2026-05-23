import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Badge, Card, PageShell } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function DonaturRiwayatPage() {
  const [items, setItems] = useState([]);

  const loadData = () => {
    api.get('/donatur/riwayat')
      .then((response) => setItems(response.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefund = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin mengajukan refund untuk donasi ini?')) {
      return;
    }
    try {
      await api.put(`/donasi/${id}/refund`);
      loadData();
      alert('Pengajuan refund berhasil dikirim.');
    } catch (error) {
      alert(error?.response?.data?.message || 'Gagal mengajukan refund. Silakan coba lagi.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge tone="ember">Menunggu Verifikasi</Badge>;
      case 'verifikasi':
        return <Badge tone="sea">Diverifikasi</Badge>;
      case 'ditolak':
        return <Badge tone="red">Ditolak</Badge>;
      case 'refund_diajukan':
        return <Badge tone="ember">Refund Diajukan</Badge>;
      case 'refund_disetujui':
        return <Badge tone="moss">Refund Selesai</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

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
                  {getStatusBadge(item.status)}
                  <span className="text-sm font-bold text-ink">{formatCurrency(item.nominal)}</span>
                </div>
              </div>

              {(item.status === 'ditolak' || item.alasan_ditolak) && (
                <div className="mt-3 text-xs bg-rose-50/50 border border-rose-100/50 rounded-xl p-3 text-slate-700">
                  {item.alasan_ditolak && (
                    <>
                      <p className="font-semibold mb-0.5 text-rose-800 font-display">Alasan Penolakan:</p>
                      <p className="text-slate-600 mb-2">{item.alasan_ditolak}</p>
                    </>
                  )}
                  {item.status === 'ditolak' && (
                    <button
                      onClick={() => handleRefund(item.id)}
                      className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 focus:outline-none shadow-sm hover:shadow"
                    >
                      Ajukan Refund
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
