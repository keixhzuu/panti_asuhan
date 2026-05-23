import { useState } from 'react';

export default function TransactionChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Tidak ada data grafik transaksi.
      </div>
    );
  }

  // Dimensions
  const width = 500;
  const height = 220;
  const paddingLeft = 50;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value calculation
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.total_masuk || 0, d.total_keluar || 0)),
    50000 // default min height scale
  );
  const chartMax = maxVal * 1.15; // 15% padding at top

  // Axis mapping helpers
  const getX = (idx) => paddingLeft + (idx * chartWidth) / (data.length - 1);
  const getY = (val) => height - paddingBottom - (val * chartHeight) / chartMax;

  // Paths
  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.total_masuk || 0)}`);
  const incomePath = `M ${incomePoints.join(' L ')}`;
  const incomeFillPath = `${incomePath} L ${getX(data.length - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`;

  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.total_keluar || 0)}`);
  const expensePath = `M ${expensePoints.join(' L ')}`;
  const expenseFillPath = `${expensePath} L ${getX(data.length - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`;

  // Grid line levels
  const gridLevels = [0, chartMax * 0.33, chartMax * 0.66, chartMax];

  // Formatting Y Axis
  const formatYLabel = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')}jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val;
  };

  // Label indices to display on X Axis
  const xLabelIndices = [
    0,
    Math.floor((data.length - 1) * 0.25),
    Math.floor((data.length - 1) * 0.5),
    Math.floor((data.length - 1) * 0.75),
    data.length - 1,
  ];

  const formatXLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    
    // Convert relative clientX on actual bounding width to SVG coordinate system width
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;
    
    // Find closest index
    const relativeX = svgX - paddingLeft;
    const xPct = Math.max(0, Math.min(1, relativeX / chartWidth));
    const idx = Math.round(xPct * (data.length - 1));
    
    setHoveredIndex(idx);
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="relative w-full h-full select-none">
      {/* Legend */}
      <div className="flex gap-4 justify-end mb-2 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-[#0F766E]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
          <span>Pemasukan</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#DC2626]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
          <span>Pengeluaran</span>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute pointer-events-none rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-glow backdrop-blur-sm z-30 flex flex-col gap-1 text-xs"
          style={{
            left: `${(getX(hoveredIndex) / width) * 100}%`,
            top: '0px',
            transform: hoveredIndex > data.length / 2 ? 'translateX(-110%)' : 'translateX(10%)',
            transition: 'left 0.1s ease-out, transform 0.1s ease-out',
          }}
        >
          <p className="font-semibold text-slate-500">
            {(() => {
              const d = data[hoveredIndex].tanggal.split('-');
              const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ];
              return `${parseInt(d[2], 10)} ${months[parseInt(d[1], 10) - 1]} ${d[0]}`;
            })()}
          </p>
          <div className="flex items-center gap-1.5 text-[#0F766E] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            <span>Masuk: Rp {Number(data[hoveredIndex].total_masuk).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#DC2626] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>Keluar: Rp {Number(data[hoveredIndex].total_keluar).toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}

      {/* SVG Line Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines and Y labels */}
        {gridLevels.map((val, idx) => {
          const yPos = getY(val);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="#E2E8F0"
                strokeWidth={0.75}
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={yPos + 3}
                textAnchor="end"
                className="fill-slate-400 font-medium text-[9px]"
              >
                {formatYLabel(val)}
              </text>
            </g>
          );
        })}

        {/* Shaded Areas */}
        <path d={incomeFillPath} fill="url(#incomeGrad)" />
        <path d={expenseFillPath} fill="url(#expenseGrad)" />

        {/* Line Paths */}
        <path
          d={incomePath}
          fill="none"
          stroke="#0F766E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={expensePath}
          fill="none"
          stroke="#DC2626"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X Axis Labels */}
        {xLabelIndices.map((idx) => {
          if (idx >= data.length || idx < 0) return null;
          const xPos = getX(idx);
          return (
            <g key={idx}>
              <text
                x={xPos}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-400 font-medium text-[9px]"
              >
                {formatXLabel(data[idx].tanggal)}
              </text>
            </g>
          );
        })}

        {/* Guideline and interactive hover circles */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <g>
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={height - paddingBottom}
              stroke="#94A3B8"
              strokeWidth={1}
              strokeDasharray="3"
            />
            <circle
              cx={getX(hoveredIndex)}
              cy={getY(data[hoveredIndex].total_masuk || 0)}
              r={4.5}
              fill="#0F766E"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <circle
              cx={getX(hoveredIndex)}
              cy={getY(data[hoveredIndex].total_keluar || 0)}
              r={4.5}
              fill="#DC2626"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
