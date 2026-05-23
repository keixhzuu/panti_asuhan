import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button, Card, PageShell } from '../../components/UI';
import { useToast } from '../../components/ToastProvider';
import { formatCurrency } from '../../utils/format';

export default function AdminDonationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [alasanDitolak, setAlasanDitolak] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { queueToast } = useToast();

  const load = async () => {
    const res = await api.get(`/donasi/${id}`);
    const d = res.data.data;
    console.log('Loaded donation detail:', d);
    setDonation(d);
  };

  useEffect(() => { load().catch(() => {}); }, [id]);

  const verify = async (status, reason = '') => {
    if (status === 'ditolak' && !reason.trim()) {
      alert('Alasan penolakan wajib diisi jika donasi ditolak.');
      return;
    }
    setIsVerifying(true);
    try {
      await api.put(`/donasi/${id}/verify`, { status, alasan_ditolak: reason });
      queueToast({
        title: status === 'verifikasi' ? 'Donasi Diverifikasi' : 'Donasi Ditolak',
        message: status === 'verifikasi' ? 'Donasi telah berhasil diverifikasi.' : 'Donasi ditolak dan donatur diberitahu.',
        tone: 'success',
        duration: 5000,
      });
      navigate('/admin/verifikasi-donasi');
    } catch (err) {
      queueToast({ title: 'Gagal', message: err.response?.data?.message || 'Gagal memproses verifikasi.', tone: 'danger', duration: 5000 });
      setIsVerifying(false);
    }
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
              <img src={donation.bukti_transfer_signed} alt="Bukti transfer" className="w-full max-w-md md:max-w-lg h-auto rounded border border-slate-200 shadow-sm" />
            </div>
          </Card>
        ) : null}

        {donation.penyaluran && donation.penyaluran.length > 0 ? (
          donation.penyaluran.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col items-start gap-2">
                <p className="font-medium">Bukti Penyaluran ({new Date(p.tanggal_salur).toLocaleDateString()})</p>
                {p.bukti_signed ? (
                  <img src={p.bukti_signed} alt={`Bukti penyaluran ${p.id}`} className="w-full max-w-md md:max-w-lg h-auto rounded border border-slate-200 shadow-sm" />
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
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isVerifying}>
            Kembali
          </Button>
          {donation.status === 'pending' && (
            <>
              <Button onClick={() => verify('verifikasi')} disabled={isVerifying}>
                {isVerifying ? 'Memproses...' : 'Setujui & Verifikasi'}
              </Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={isVerifying}>
                Tolak
              </Button>
            </>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Alasan Penolakan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Silakan tulis alasan mengapa Anda menolak donasi ini. Alasan ini akan dikirimkan ke donatur sebagai notifikasi untuk pemberitahuan.
            </p>
            <textarea
              value={alasanDitolak}
              onChange={(e) => setAlasanDitolak(e.target.value)}
              placeholder="Contoh: Bukti transfer kurang jelas atau tidak sesuai nominal..."
              className="w-full min-h-[100px] p-3 border border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm transition mb-6"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowRejectModal(false);
                setAlasanDitolak('');
              }} disabled={isVerifying}>
                Batal
              </Button>
              <Button 
                variant="danger" 
                onClick={() => verify('ditolak', alasanDitolak)}
                disabled={!alasanDitolak.trim() || isVerifying}
              >
                {isVerifying ? 'Memproses...' : 'Konfirmasi Tolak'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
