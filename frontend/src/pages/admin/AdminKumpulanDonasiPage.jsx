import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Card, PageShell, StatCard, Badge, Button, TextField, SelectField } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function AdminKumpulanDonasiPage() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donasi');
      setDonations(res.data.data);
      setError('');
    } catch (err) {
      setError('Gagal memuat data donasi. Coba muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  // Calculate stats based on all loaded donations
  const totalUangTerkumpul = donations
    .filter((d) => d.status === 'verifikasi')
    .reduce((sum, d) => sum + Number(d.nominal || 0), 0);

  const totalBarangTerkumpul = donations
    .filter((d) => d.status === 'verifikasi')
    .reduce((sum, d) => sum + Number(d.jumlah_donasi || 0), 0);

  const ditolakCount = donations.filter((d) => d.status === 'ditolak').length;

  // Filter donations list (only verified or ditolak are allowed on this page)
  const filteredDonations = donations.filter((d) => {
    const isVerifiedOrRejected = d.status === 'verifikasi' || d.status === 'ditolak';
    if (!isVerifiedOrRejected) return false;

    const matchesSearch =
      d.nama_donatur?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nama_barang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.nama_panti && d.nama_panti.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'semua' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verifikasi':
        return <Badge tone="moss">Terverifikasi</Badge>;
      case 'ditolak':
        return <Badge tone="red">Ditolak</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  return (
    <PageShell
      title="Kumpulan Donasi"
      subtitle="Pantau dan tinjau seluruh riwayat transaksi donasi logistik yang telah diproses (terverifikasi atau ditolak)."
    >
      {/* Dynamic Statistics cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Dana Terkumpul"
          value={formatCurrency(totalUangTerkumpul)}
          tone="moss"
          hint="Donasi yang sudah sukses terverifikasi"
        />
        <StatCard
          label="Total Barang Didonasikan"
          value={`${totalBarangTerkumpul} unit`}
          tone="sea"
          hint="Jumlah pcs/satuan barang yang disumbangkan"
        />
        <StatCard
          label="Donasi Ditolak"
          value={`${ditolakCount} donasi`}
          tone="red"
          hint="Pembayaran tidak valid / ditolak"
        />
      </div>

      {/* Filters Card */}
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <TextField
              placeholder="Cari nama donatur, nama barang, atau nama panti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <SelectField
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Status</option>
              <option value="verifikasi">Terverifikasi</option>
              <option value="ditolak">Ditolak</option>
            </SelectField>
          </div>
        </div>
      </Card>

      {/* List / Table */}
      {loading ? (
        <Card className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-ember" />
            <p className="text-sm font-semibold text-slate-500">Memuat data donasi...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50/50 p-6 text-center">
          <p className="font-bold text-red-600 mb-2">{error}</p>
          <Button onClick={loadData} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
            Coba Lagi
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDonations.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-slate-800 text-base">{item.nama_donatur}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Mendonasikan: <span className="text-ember">{item.jumlah_donasi} unit</span> {item.nama_barang}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Penerima: {item.nama_panti || `Panti #${item.id_panti}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1 font-medium">
                    <span>Metode: {item.metode_bayar || 'Transfer Bank'}</span>
                    <span className="text-slate-300">•</span>
                    <span>Nominal: <strong className="text-slate-700 font-bold">{formatCurrency(item.nominal)}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Tanggal: {new Date(item.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  {item.status === 'ditolak' && item.alasan_ditolak && (
                    <p className="text-xs text-red-600 bg-red-50/70 border border-red-100 rounded-lg px-2.5 py-1.5 mt-2 max-w-xl italic">
                      Alasan ditolak: "{item.alasan_ditolak}"
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {/* Tinjau button to view details */}
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/kumpulan-donasi/${item.id}`)}
                    className="w-full lg:w-auto"
                  >
                    Tinjau Detail
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredDonations.length === 0 && (
            <Card className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-400">Tidak ada data donasi yang cocok dengan pencarian / filter.</p>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
