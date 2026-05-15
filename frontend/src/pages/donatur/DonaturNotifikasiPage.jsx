import { useAuth } from '../../context/AuthContext';
import useFirestoreCollection from '../../hooks/useFirestoreCollection';
import { Badge, Card, PageShell } from '../../components/UI';

export default function DonaturNotifikasiPage() {
  const { user } = useAuth();
  const { data: items } = useFirestoreCollection('notifikasi_donatur', {
    whereField: 'id_donatur',
    whereValue: user?.id_donatur,
    orderByField: 'created_at',
    limitCount: 30
  });

  return (
    <PageShell title="Notifikasi Real-time" subtitle="Notifikasi donatur diambil langsung dari Firestore collection notifikasi_donatur berdasarkan id_donatur akun aktif.">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Kotak notifikasi</h2>
          <Badge tone="ember">Live</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-ink">{item.judul || 'Notifikasi'}</p>
              <p className="text-sm text-slate-600">{item.pesan}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
