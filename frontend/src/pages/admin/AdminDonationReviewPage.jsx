import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button, Card, PageShell } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

export default function AdminDonationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);

  const load = async () => {
    const res = await api.get(`/donasi/${id}`);
    const d = res.data.data;
    console.log('Loaded donation detail:', d);
    setDonation(d);
  };

  useEffect(() => { load().catch(() => {}); }, [id]);

  const verify = async (status) => {
    await api.put(`/donasi/${id}/verify`, { status });
    navigate('/admin/verifikasi-donasi');
  };

  if (!donation) return <PageShell title="Review Donasi">Memuat...</PageShell>;

  return (
    <PageShell title={`Review Donasi #${donation.id}`} subtitle="Periksa bukti transfer dan detail sebelum verifikasi.">
      <div className="grid gap-4">
        <Card>
          <div className="space-y-2">
            <p className="font-bold">{donation.nama_donatur}</p>
            <p className="text-sm text-slate-600">{donation.nama_barang}</p>
            <p className="text-sm">{donation.metode_bayar || 'Metode tidak diisi'} • {formatCurrency(donation.nominal)}</p>
            <p className="text-sm text-slate-500">Tanggal: {new Date(donation.created_at).toLocaleString()}</p>
          </div>
        </Card>

        {donation.bukti_transfer_signed ? (
          <Card>
            <div className="flex flex-col items-start gap-2">
              <p className="font-medium">Bukti Transfer</p>
              <img src={donation.bukti_transfer_signed} alt="Bukti transfer" className="w-1/3 h-auto rounded" />
            </div>
          </Card>
        ) : null}

        {donation.penyaluran && donation.penyaluran.length > 0 ? (
          donation.penyaluran.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col items-start gap-2">
                <p className="font-medium">Bukti Penyaluran ({new Date(p.tanggal_salur).toLocaleDateString()})</p>
                {p.bukti_signed ? (
                  <img src={p.bukti_signed} alt={`Bukti penyaluran ${p.id}`} className="w-1/3 h-auto rounded" />
                ) : (
                  <p className="text-sm text-slate-500">Tidak ada bukti penyaluran.</p>
                )}
              </div>
            </Card>
          ))
        ) : null}

        {(!donation.bukti_transfer_signed && (!donation.penyaluran || donation.penyaluran.length === 0)) && (
          <Card><p className="text-sm text-slate-500">Tidak ada bukti transfer atau penyaluran yang tersedia.</p></Card>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/verifikasi-donasi')}>Kembali</Button>
          <Button onClick={() => verify('verifikasi')}>Setujui & Verifikasi</Button>
          <Button variant="danger" onClick={() => verify('ditolak')}>Tolak</Button>
        </div>
      </div>
    </PageShell>
  );
}
