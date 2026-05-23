import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, PageShell, SelectField, TextAreaField, TextField } from '../../components/UI';
import { formatCurrency } from '../../utils/format';

const emptyForm = { id_kebutuhan: '', jumlah_donasi: '', metode_bayar: 'Transfer Bank', catatan: '' };

export default function DonaturDonasiPage() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');

  // Checkout Wizard steps: 1 = Input quantity & method, 2 = QRIS/Bank Transfer details, 3 = Upload receipt
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(86399); // 24 hours countdown in seconds
  const [copiedText, setCopiedText] = useState('');
  const [activeGuideTab, setActiveGuideTab] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const selectedNeed = needs.find((item) => String(item.id) === String(form.id_kebutuhan));
  const sisaDonasi = Number(selectedNeed?.sisa_donasi || 0);
  const jumlahDonasi = Number(form.jumlah_donasi || 0);
  const totalHarga = selectedNeed ? Number(selectedNeed.harga_satuan || 0) * jumlahDonasi : 0;
  const isFulfilled = Boolean(selectedNeed) && sisaDonasi <= 0;
  const isOverLimit = Boolean(selectedNeed) && jumlahDonasi > sisaDonasi;
  const isBusy = submitState !== 'idle';

  // Fetch requirements catalog
  useEffect(() => {
    api.get('/donatur/donasi')
      .then((response) => {
        setNeeds(response.data.data);
        const params = new URLSearchParams(window.location.search);
        const pantiId = params.get('id_panti');
        if (pantiId) {
          const matchingNeed = response.data.data.find((item) => String(item.id_panti) === String(pantiId));
          if (matchingNeed) {
            setForm((prev) => ({ ...prev, id_kebutuhan: matchingNeed.id }));
          }
        }
      })
      .catch(() => setNeeds([]));
  }, []);

  // Countdown timer for Step 2
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Clean up object URL when file changes or component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 1500);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (selectedFile) {
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.id_kebutuhan) return;
    setSubmitError('');
    if (isFulfilled) {
      setSubmitError('Kebutuhan sudah terpenuhi. Pilih kebutuhan lain.');
      return;
    }
    if (isOverLimit) {
      setSubmitError('Jumlah pcs tidak boleh melebihi kebutuhan yang tersedia.');
      return;
    }
    if (!file) {
      setSubmitError('Bukti transfer / pembayaran wajib diunggah.');
      return;
    }

    setSubmitState('saving');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append('bukti_transfer', file);

    try {
      await api.post('/donasi', payload);
      setSubmitState('redirecting');
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate('/donatur/riwayat');
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Donasi gagal dikirim. Coba lagi.');
      setSubmitState('idle');
    }
  };

  const toggleGuideTab = (tab) => {
    setActiveGuideTab(activeGuideTab === tab ? null : tab);
  };

  return (
    <PageShell title="Donasi Kebutuhan" subtitle="Data kebutuhan diambil dari PostgreSQL dan menampilkan daftar aktif dari panti.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column: Needs List */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-slate-800">Daftar Kebutuhan</h2>
            <Badge tone="sea">Live DB</Badge>
          </div>
          <div className="mt-4 grid max-h-[70vh] gap-3 overflow-y-auto pr-2">
            {needs.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={step !== 1}
                onClick={() => setForm((prev) => ({ ...prev, id_kebutuhan: item.id }))}
                aria-pressed={String(form.id_kebutuhan) === String(item.id)}
                className={`rounded-3xl border p-5 text-left transition ${form.id_kebutuhan === item.id
                  ? 'border-ember bg-amber-50/40 ring-1 ring-ember'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                  } ${step !== 1 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-base">{item.nama_barang}</p>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{item.nama_panti || `Panti #${item.id_panti}`}</p>
                    <p className="text-sm text-slate-600 mt-2">
                      <span className="font-semibold text-slate-700">{formatCurrency(item.harga_satuan)}</span>
                      <span className="text-slate-400">/{item.satuan || 'unit'}</span>
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="text-slate-500">Total Kebutuhan: {item.jumlah_dibutuhkan} {item.satuan || 'unit'}</span>
                    </p>
                  </div>
                  <div className="text-left lg:text-right shrink-0">
                    <p className="text-sm font-bold text-ember bg-amber-50 px-3 py-1 rounded-full inline-block lg:block">
                      Sisa Kebutuhan: {item.sisa_donasi} {item.satuan || ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Urgensi: <span className="font-semibold text-slate-600">{item.tingkat_urgensi}</span></p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right column: Interactive Checkout Wizard */}
        <Card className="p-6 flex flex-col justify-between min-h-[500px]">
          <div>
            {/* Step Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="font-display text-xl font-bold text-slate-800">Donasi Digital</h2>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`px-2.5 py-1 rounded-full ${step === 1 ? 'bg-ember text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
                <span className="text-slate-300">/</span>
                <span className={`px-2.5 py-1 rounded-full ${step === 2 ? 'bg-ember text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
                <span className="text-slate-300">/</span>
                <span className={`px-2.5 py-1 rounded-full ${step === 3 ? 'bg-ember text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
              </div>
            </div>

            {/* Step 1: Selection Form */}
            {step === 1 && (
              <div className="space-y-4">
                {!selectedNeed ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 9.152c.582.448 1.148.89 1.676 1.345m-1.676-1.345c-.528-.407-1.148-.815-1.676-1.222m1.676 1.222a49.47 49.47 0 0 1 3.96 3.738m-3.96-3.738a49.466 49.466 0 0 0-3.96-3.567m3.96 3.567a49.461 49.461 0 0 1-3.96 3.955m3.96-3.955a49.483 49.483 0 0 0-3.96-3.738m0 7.693c.582.448 1.148.89 1.676 1.345m-1.676-1.345c-.528-.407-1.148-.815-1.676-1.222m1.676 1.222a49.47 49.47 0 0 1 3.96 3.738m-3.96-3.738a49.466 49.466 0 0 0-3.96-3.567m3.96 3.567a49.461 49.461 0 0 1-3.96 3.955m3.96-3.955a49.483 49.483 0 0 0-3.96-3.738" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm">Pilih Kebutuhan Terlebih Dahulu</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">Silakan pilih salah satu kebutuhan logistik aktif dari panti asuhan di panel sebelah kiri.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kebutuhan Terpilih</label>
                      <TextField
                        placeholder="Klik kebutuhan di daftar sebelah kiri"
                        value={`${selectedNeed.nama_barang} (${selectedNeed.nama_panti || `Panti #${selectedNeed.id_panti}`})`}
                        readOnly
                        className="bg-slate-50 border-slate-100 text-slate-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Donasi ({selectedNeed.satuan || 'unit'})</label>
                      <TextField
                        type="number"
                        min="1"
                        max={sisaDonasi}
                        disabled={isFulfilled}
                        placeholder="Masukkan jumlah donasi"
                        value={form.jumlah_donasi}
                        onChange={(e) => setForm((prev) => ({ ...prev, jumlah_donasi: e.target.value }))}
                        className="border-slate-200"
                      />
                      {isOverLimit && (
                        <p className="text-xs text-red-600 mt-1 font-medium">Jumlah donasi tidak boleh melebihi sisa kebutuhan.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metode Pembayaran</label>
                      <SelectField
                        value={form.metode_bayar}
                        disabled={isFulfilled || isOverLimit}
                        onChange={(e) => setForm((prev) => ({ ...prev, metode_bayar: e.target.value }))}
                        className="border-slate-200 font-medium"
                      >
                        <option>Transfer Bank</option>
                        <option>QRIS</option>
                        <option>Virtual Account</option>
                      </SelectField>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Catatan Tambahan (Opsional)</label>
                      <TextAreaField
                        rows="3"
                        placeholder="Berikan pesan hangat atau catatan khusus untuk anak-anak panti..."
                        value={form.catatan}
                        onChange={(e) => setForm((prev) => ({ ...prev, catatan: e.target.value }))}
                        className="border-slate-200"
                      />
                    </div>

                    {selectedNeed && jumlahDonasi > 0 && !isOverLimit && (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2 mt-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                          <span>Harga Satuan:</span>
                          <span>{formatCurrency(selectedNeed.harga_satuan)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                          <span>Jumlah Donasi:</span>
                          <span>{form.jumlah_donasi} {selectedNeed.satuan}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-700">Total Nominal:</span>
                          <span className="text-lg font-black text-[#ee4d2d]">{formatCurrency(totalHarga)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Payment guides */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Timer Banner */}
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-xs font-semibold">Selesaikan pembayaran dalam:</span>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-200">{formatTime(timeLeft)}</span>
                </div>

                {/* Total Payment Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Pembayaran</span>
                  <span className="text-2xl font-black text-[#ee4d2d]">{formatCurrency(totalHarga)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(totalHarga.toString(), 'amount')}
                    className="mt-2.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-sm bg-white border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <span>{copiedText === 'amount' ? '✓ Tersalin!' : 'Salin Jumlah'}</span>
                  </button>
                </div>

                {/* Bank / QRIS Content */}
                {form.metode_bayar === 'QRIS' && (
                  <div className="flex flex-col items-center justify-center py-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    {/* SVG QRIS Code Vector */}
                    <div className="w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-inner flex flex-col items-center">
                      {/* QRIS Header logos */}
                      <div className="flex justify-between items-center w-full border-b border-slate-100 pb-1.5 mb-2">
                        {/* QRIS Logo */}
                        <svg className="h-4" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4h4v12H4V4zm8 0h12v4H12V4zm0 8h12v4H12v-4zm16-8h4v12h-4V4zm8 0h12v4H36V4zm0 8h12v4H36v-4zm16-8h4v12h-4V4zm8 0h12v4H60V4zm0 8h12v4H60v-4z" fill="#0C1B33" />
                          <circle cx="16" cy="10" r="2" fill="#E84A5F" />
                          <circle cx="42" cy="10" r="2" fill="#E84A5F" />
                          <circle cx="66" cy="10" r="2" fill="#E84A5F" />
                        </svg>
                        {/* GPN / ALTO Icon */}
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-blue-800 border border-blue-800 rounded px-0.5">GPN</span>
                          <span className="text-[7px] font-black text-red-600 border border-red-600 rounded px-0.5">ALTO</span>
                        </div>
                      </div>

                      {/* QR Merchant details */}
                      <span className="text-[9px] font-extrabold text-slate-800 text-center uppercase tracking-wide">Yayasan Panti Asuhan</span>
                      <span className="text-[7px] font-medium text-slate-400 text-center">NMID: ID102030405060</span>

                      {/* SVG Simulated QR Grid */}
                      <svg className="w-[140px] h-[140px] my-3 border border-slate-100 p-1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        {/* Positional anchors */}
                        <rect x="2" y="2" width="20" height="20" fill="#000" />
                        <rect x="5" y="5" width="14" height="14" fill="#fff" />
                        <rect x="8" y="8" width="8" height="8" fill="#000" />

                        <rect x="78" y="2" width="20" height="20" fill="#000" />
                        <rect x="81" y="5" width="14" height="14" fill="#fff" />
                        <rect x="84" y="8" width="8" height="8" fill="#000" />

                        <rect x="2" y="78" width="20" height="20" fill="#000" />
                        <rect x="5" y="78" width="14" height="14" fill="#fff" />
                        <rect x="8" y="84" width="8" height="8" fill="#000" />

                        {/* Dummy QR bits */}
                        <rect x="30" y="5" width="6" height="6" fill="#000" />
                        <rect x="42" y="2" width="4" height="8" fill="#000" />
                        <rect x="52" y="4" width="8" height="4" fill="#000" />
                        <rect x="65" y="6" width="6" height="8" fill="#000" />

                        <rect x="25" y="25" width="8" height="4" fill="#000" />
                        <rect x="40" y="20" width="6" height="12" fill="#000" />
                        <rect x="60" y="22" width="10" height="6" fill="#000" />

                        <rect x="5" y="32" width="8" height="6" fill="#000" />
                        <rect x="18" y="40" width="12" height="4" fill="#000" />
                        <rect x="35" y="38" width="8" height="8" fill="#000" />
                        <rect x="50" y="45" width="6" height="10" fill="#000" />
                        <rect x="62" y="36" width="4" height="8" fill="#000" />
                        <rect x="75" y="40" width="12" height="6" fill="#000" />

                        <rect x="5" y="55" width="14" height="4" fill="#000" />
                        <rect x="25" y="50" width="6" height="12" fill="#000" />
                        <rect x="38" y="58" width="10" height="4" fill="#000" />
                        <rect x="55" y="60" width="8" height="12" fill="#000" />
                        <rect x="72" y="52" width="6" height="14" fill="#000" />

                        <rect x="30" y="78" width="8" height="6" fill="#000" />
                        <rect x="45" y="82" width="12" height="4" fill="#000" />
                        <rect x="62" y="75" width="6" height="10" fill="#000" />
                        <rect x="74" y="84" width="8" height="4" fill="#000" />

                        <rect x="90" y="30" width="8" height="8" fill="#000" />
                        <rect x="88" y="48" width="10" height="6" fill="#000" />
                        <rect x="92" y="65" width="6" height="10" fill="#000" />

                        {/* Center brand block */}
                        <rect x="38" y="38" width="24" height="24" rx="3" fill="#fff" stroke="#000" strokeWidth="2" />
                        <text x="50" y="52" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#0C1B33">QRIS</text>
                      </svg>

                      <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest text-center mt-1">Dicetak Oleh Yayasan Donasi</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-2 text-center">Scan QRIS menggunakan aplikasi E-Wallet atau M-Banking Anda</p>
                  </div>
                )}

                {form.metode_bayar === 'Transfer Bank' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">BCA</span>
                      <span>Bank Central Asia</span>
                    </div>
                    <div className="text-center mt-1.5">
                      <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Nomor Rekening</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">829-0123-456</span>
                      <span className="text-xs text-slate-500 font-medium">a.n. Yayasan Panti Asuhan</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('8290123456', 'account')}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-sm bg-white border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 mt-1"
                    >
                      <span>{copiedText === 'account' ? '✓ Tersalin!' : 'Salin Nomor Rekening'}</span>
                    </button>
                  </div>
                )}

                {form.metode_bayar === 'Virtual Account' && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <span className="bg-yellow-500 text-blue-900 px-2 py-0.5 rounded text-xs">Mandiri</span>
                      <span>Mandiri Virtual Account</span>
                    </div>
                    <div className="text-center mt-1.5">
                      <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Nomor Virtual Account</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">88912-3456-7890</span>
                      <span className="text-xs text-slate-500 font-medium">a.n. Yayasan Panti Asuhan</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('8891234567890', 'account')}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-sm bg-white border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 mt-1"
                    >
                      <span>{copiedText === 'account' ? '✓ Tersalin!' : 'Salin VA'}</span>
                    </button>
                  </div>
                )}

                {/* Accordion guides */}
                <div className="space-y-2 mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Petunjuk Pembayaran</label>

                  {form.metode_bayar === 'QRIS' && (
                    <div className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => toggleGuideTab('qris')}
                        className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50/50"
                      >
                        <span className="text-xs font-bold text-slate-700">Cara Bayar QRIS</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-all ${activeGuideTab === 'qris' ? 'rotate-180' : ''}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {activeGuideTab === 'qris' && (
                        <div className="px-4 pb-4 text-xs text-slate-600 space-y-2 bg-slate-50/30 border-t border-slate-50 pt-3">
                          <p className="font-semibold">Bisa menggunakan DANA, GoPay, OVO, ShopeePay, LinkAja, atau Mobile Banking.</p>
                          <ol className="list-decimal pl-4 space-y-1.5">
                            <li>Buka aplikasi e-wallet atau m-banking pilihan Anda.</li>
                            <li>Pilih menu scan/pindai barcode/pay QR.</li>
                            <li>Arahkan kamera ke barcode QRIS yang tercantum di atas.</li>
                            <li>Pastikan nama merchant tertera <strong>YAYASAN PANTI ASUHAN</strong>.</li>
                            <li>Masukkan nominal yang tepat: <strong>{formatCurrency(totalHarga)}</strong>.</li>
                            <li>Masukkan PIN pembayaran Anda dan selesaikan transaksi.</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {form.metode_bayar === 'Transfer Bank' && (
                    <div className="space-y-2">
                      {/* ATM Instruction */}
                      <div className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleGuideTab('atm')}
                          className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50/50"
                        >
                          <span className="text-xs font-bold text-slate-700">ATM BCA</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-all ${activeGuideTab === 'atm' ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {activeGuideTab === 'atm' && (
                          <div className="px-4 pb-4 text-xs text-slate-600 space-y-1.5 bg-slate-50/30 border-t border-slate-50 pt-3">
                            <ol className="list-decimal pl-4 space-y-1">
                              <li>Masukkan kartu ATM BCA & PIN Anda.</li>
                              <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rek BCA</strong>.</li>
                              <li>Masukkan nomor rekening BCA di atas: <strong>8290123456</strong>.</li>
                              <li>Masukkan nominal transfer: <strong>{formatCurrency(totalHarga)}</strong>.</li>
                              <li>Periksa nama penerima (Yayasan Panti Asuhan) lalu tekan <strong>Ya/Benar</strong>.</li>
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Mobile Banking Instruction */}
                      <div className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleGuideTab('mobile')}
                          className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50/50"
                        >
                          <span className="text-xs font-bold text-slate-700">m-BCA (BCA Mobile)</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-all ${activeGuideTab === 'mobile' ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {activeGuideTab === 'mobile' && (
                          <div className="px-4 pb-4 text-xs text-slate-600 space-y-1.5 bg-slate-50/30 border-t border-slate-50 pt-3">
                            <ol className="list-decimal pl-4 space-y-1">
                              <li>Buka aplikasi m-BCA dan masukkan kode akses Anda.</li>
                              <li>Pilih menu <strong>m-Transfer</strong> &gt; <strong>Antar Rekening</strong>.</li>
                              <li>Daftarkan nomor rekening di atas jika belum terdaftar.</li>
                              <li>Masukkan nomor rekening penerima <strong>8290123456</strong>.</li>
                              <li>Masukkan nominal transfer: <strong>{formatCurrency(totalHarga)}</strong>.</li>
                              <li>Konfirmasi transfer dengan memasukkan PIN m-BCA Anda.</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {form.metode_bayar === 'Virtual Account' && (
                    <div className="space-y-2">
                      {/* Mandiri ATM */}
                      <div className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleGuideTab('atm')}
                          className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50/50"
                        >
                          <span className="text-xs font-bold text-slate-700">ATM Mandiri</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-all ${activeGuideTab === 'atm' ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {activeGuideTab === 'atm' && (
                          <div className="px-4 pb-4 text-xs text-slate-600 space-y-1.5 bg-slate-50/30 border-t border-slate-50 pt-3">
                            <ol className="list-decimal pl-4 space-y-1">
                              <li>Masukkan kartu ATM Mandiri & PIN Anda.</li>
                              <li>Pilih menu <strong>Bayar/Beli</strong> &gt; <strong>Multipayment</strong>.</li>
                              <li>Masukkan kode institusi / penyedia jasa jika ditanya, lalu masukkan nomor VA: <strong>8891234567890</strong>.</li>
                              <li>Masukkan nominal pembayaran: <strong>{formatCurrency(totalHarga)}</strong>.</li>
                              <li>Periksa rincian pembayaran di layar lalu selesaikan transaksi.</li>
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Mandiri Online / Livin */}
                      <div className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleGuideTab('mobile')}
                          className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50/50"
                        >
                          <span className="text-xs font-bold text-slate-700">Livin' by Mandiri</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-all ${activeGuideTab === 'mobile' ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {activeGuideTab === 'mobile' && (
                          <div className="px-4 pb-4 text-xs text-slate-600 space-y-1.5 bg-slate-50/30 border-t border-slate-50 pt-3">
                            <ol className="list-decimal pl-4 space-y-1">
                              <li>Buka aplikasi Livin' by Mandiri dan masuk ke akun Anda.</li>
                              <li>Pilih menu <strong>Bayar</strong> &gt; cari/pilih <strong>Multipayment</strong> atau ketik nomor Virtual Account: <strong>8891234567890</strong>.</li>
                              <li>Pastikan detail tagihan (Yayasan Panti Asuhan) dan total nominal telah sesuai.</li>
                              <li>Lanjutkan pembayaran dan konfirmasi transaksi menggunakan PIN Anda.</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Receipt upload */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Transaction Summary Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Ringkasan Donasi</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Kebutuhan</span>
                      <span className="font-bold text-slate-700 font-semibold">{selectedNeed?.nama_barang}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Penerima</span>
                      <span className="font-bold text-slate-700 font-semibold">{selectedNeed?.nama_panti || `Panti #${selectedNeed?.id_panti}`}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Jumlah Donasi</span>
                      <span className="font-bold text-slate-800">{form.jumlah_donasi} {selectedNeed?.satuan || 'unit'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                      <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{form.metode_bayar}</span>
                    </div>
                    {form.catatan && (
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-medium shrink-0">Catatan Donatur</span>
                        <span className="text-slate-600 text-right italic max-w-[60%] truncate">"{form.catatan}"</span>
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800">Total Nominal</span>
                      <span className="font-black text-[#ee4d2d] text-lg">{formatCurrency(totalHarga)}</span>
                    </div>
                  </div>
                </div>

                {/* Drag and Drop style file selector with live preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Unggah Bukti Transfer / Pembayaran</label>

                  {!filePreview ? (
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-ember/50 transition rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group bg-slate-50/20">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isBusy}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 group-hover:text-ember transition mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-600">Klik atau Tarik File Bukti Pembayaran</span>
                      <span className="text-[10px] text-slate-400 mt-1">Hanya mendukung format Gambar (JPG, PNG, JPEG)</span>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 flex flex-col items-center">
                      <div className="relative max-w-[200px] rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                        <img
                          src={filePreview}
                          alt="Pratinjau Bukti Pembayaran"
                          className="max-h-[160px] object-contain mx-auto"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (filePreview) {
                            URL.revokeObjectURL(filePreview);
                            setFilePreview(null);
                          }
                        }}
                        disabled={isBusy}
                        className="mt-3 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-red-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        <span>Hapus & Ganti File</span>
                      </button>
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">{submitError}</p>
                )}

                {isBusy && (
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-ember" />
                    {submitState === 'saving' ? 'Menyimpan donasi...' : 'Mengalihkan ke riwayat donasi...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wizard Footer Controls */}
          {selectedNeed && (
            <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4 bg-white">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => setStep(step - 1)}
                  className="w-1/2 justify-center border-slate-200 text-slate-600"
                >
                  Kembali
                </Button>
              )}

              {step === 1 && (
                <Button
                  type="button"
                  disabled={!form.jumlah_donasi || jumlahDonasi <= 0 || isOverLimit || isFulfilled}
                  onClick={() => setStep(2)}
                  className="w-full justify-center"
                >
                  Lanjut ke Pembayaran
                </Button>
              )}

              {step === 2 && (
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/2 justify-center"
                >
                  Saya Sudah Bayar
                </Button>
              )}

              {step === 3 && (
                <Button
                  type="button"
                  disabled={!file || isBusy}
                  onClick={handleSubmit}
                  className="w-1/2 justify-center"
                >
                  Kirim Donasi
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}