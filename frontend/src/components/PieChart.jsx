import { useState } from 'react';

const PALETTE = [
  '#0F766E', '#0284C7', '#7C3AED', '#D97706', '#DC2626',
  '#059669', '#2563EB', '#9333EA', '#EA580C', '#E11D48',
];

export default function PieChart({ data, emptyText = 'Belum ada data penyaluran per panti.' }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
        {emptyText}
      </div>
    );
  }

  const total = data.reduce((s, d) => s + Number(d.total), 0);
  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
        {emptyText}
      </div>
    );
  }

  // Build pie slices — donut: cx=160 cy=160 r=140 innerR=70
  const cx = 160, cy = 160, r = 140, innerR = 70;
  let currentAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const fraction = Number(d.total) / total;
    const startAngle = currentAngle;
    const endAngle = startAngle + fraction * 2 * Math.PI;
    currentAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);

    const largeArc = fraction > 0.5 ? 1 : 0;

    const pathD = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    return {
      pathD,
      color: PALETTE[i % PALETTE.length],
      kategori: d.kategori,
      total: Number(d.total),
      fraction,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 mt-4">
      {/* SVG Donut */}
      <div className="relative">
        <svg width="320" height="320" viewBox="0 0 320 320">
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.pathD}
              fill={s.color}
              opacity={hovered === null || hovered === i ? 1 : 0.35}
              stroke="white"
              strokeWidth={hovered === i ? 3 : 1.5}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s, stroke-width 0.15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center label */}
          {hovered !== null ? (
            <>
              <text x="160" y="150" textAnchor="middle" fontSize="14" fill="#64748B" fontWeight="600">
                {slices[hovered].kategori.length > 16
                  ? slices[hovered].kategori.slice(0, 16) + '…'
                  : slices[hovered].kategori}
              </text>
              <text x="160" y="172" textAnchor="middle" fontSize="22" fill="#0F766E" fontWeight="800">
                {(slices[hovered].fraction * 100).toFixed(1)}%
              </text>
              <text x="160" y="192" textAnchor="middle" fontSize="12" fill="#94A3B8" fontWeight="500">
                {slices[hovered].total >= 1000000
                  ? `Rp ${(slices[hovered].total / 1000000).toFixed(1)}jt`
                  : `Rp ${(slices[hovered].total / 1000).toFixed(0)}k`}
              </text>
            </>
          ) : (
            <>
              <text x="160" y="152" textAnchor="middle" fontSize="14" fill="#64748B" fontWeight="600">
                Total Tersalurkan
              </text>
              <text x="160" y="178" textAnchor="middle" fontSize="18" fill="#1e293b" fontWeight="800">
                {total >= 1000000
                  ? `Rp ${(total / 1000000).toFixed(1)}jt`
                  : `Rp ${(total / 1000).toFixed(0)}k`}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 w-full max-w-lg">
        {slices.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ opacity: hovered === null || hovered === i ? 1 : 0.35, transition: 'opacity 0.2s' }}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-slate-700 font-medium">{s.kategori}</span>
            <span className="text-sm font-bold" style={{ color: s.color }}>
              {(s.fraction * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
