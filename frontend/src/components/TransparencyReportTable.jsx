import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, Badge } from "./UI";
import { formatCurrency } from "../utils/format";

function isEndOfMonth() {
  const today = new Date();
  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);
  return today.getMonth() !== nextDay.getMonth();
}

function canDownloadThisMonth() {
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  return today.getDate() >= lastDay - 4;
}

function groupByMonth(reports) {
  const grouped = {};
  reports.forEach((report) => {
    const date = new Date(report.periode_bulan);
    const key = date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(report);
  });
  return grouped;
}

export default function TransparencyReportTable() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get("/laporan");
      setReports(response.data.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report) => {
    if (!canDownloadThisMonth()) {
      const today = new Date();
      const lastDay = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();
      const daysLeft = lastDay - today.getDate();
      alert(
        `Download hanya tersedia di akhir bulan. Tersisa ${daysLeft} hari.`,
      );
      return;
    }

    if (!report.file_laporan_url) {
      alert("File laporan belum tersedia.");
      return;
    }

    try {
      setDownloading(report.id);
      const link = document.createElement("a");
      link.href = report.file_laporan_url;
      link.download = `laporan-${report.periode_bulan}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Gagal mengunduh file.");
    } finally {
      setDownloading(null);
    }
  };

  const grouped = groupByMonth(reports);
  const months = Object.keys(grouped).sort((a, b) => {
    return (
      new Date(`${b.split(" ")[1]} ${b.split(" ")[0]}`) -
      new Date(`${a.split(" ")[1]} ${a.split(" ")[0]}`)
    );
  });

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">
          Laporan Transparansi
        </h2>
        <Badge tone="sea">Dikelompokkan per bulan</Badge>
      </div>

      {loading ? (
        <div className="mt-4 text-center text-slate-500">Loading...</div>
      ) : months.length === 0 ? (
        <div className="mt-4 text-center text-slate-500">
          Belum ada laporan transparansi.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {months.map((month) => (
            <div key={month}>
              <h3 className="mb-3 text-lg font-semibold text-ink">{month}</h3>
              <div className="space-y-2">
                {grouped[month].map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Dana Masuk</p>
                          <p className="font-semibold text-ink">
                            {formatCurrency(report.total_dana_masuk)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Dana Keluar</p>
                          <p className="font-semibold text-ink">
                            {formatCurrency(report.total_dana_keluar)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Saldo Akhir</p>
                          <p className="font-semibold text-moss">
                            {formatCurrency(report.saldo_akhir)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(report)}
                      disabled={
                        downloading === report.id || !canDownloadThisMonth()
                      }
                      className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all ${
                        canDownloadThisMonth()
                          ? "bg-sea text-white hover:bg-sea/90 disabled:opacity-50"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {downloading === report.id
                        ? "Downloading..."
                        : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!canDownloadThisMonth() && reports.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-900">
            ℹ️ Download laporan hanya tersedia di akhir bulan (tanggal 25+).
          </p>
        </div>
      )}
    </Card>
  );
}
