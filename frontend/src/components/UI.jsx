export function PageShell({ title, subtitle, actions, children }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-sea/70">Sistem Donasi</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-3xl border border-white/70 bg-white/85 p-5 shadow-glow backdrop-blur ${className}`}>{children}</div>;
}

export function StatCard({ label, value, hint, tone = 'ember' }) {
  const toneClass = tone === 'sea' ? 'text-sea' : tone === 'moss' ? 'text-moss' : 'text-ember';
  const glowClass = tone === 'sea' ? 'bg-teal-100/70' : tone === 'moss' ? 'bg-emerald-100/70' : 'bg-amber-100/70';
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-y-0 right-0 w-24 ${glowClass}`} />
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`mt-3 text-3xl font-extrabold ${toneClass}`}>{value}</div>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function Button({ children, variant = 'primary', className = '', as: Component = 'button', ...props }) {
  const isDisabled = Boolean(props.disabled);
  const styles = {
    primary: 'bg-ink text-white hover:bg-slate-800',
    soft: 'bg-amber-50 text-ember hover:bg-amber-100',
    outline: 'border border-slate-200 bg-white text-ink hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const disabledStyle = 'cursor-not-allowed bg-slate-300 text-slate-500 hover:bg-slate-300 pointer-events-none';

  return (
    <Component
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold transition ${isDisabled ? disabledStyle : styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function TextField(props) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember ${props.className || ''}`} />;
}

export function SelectField(props) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember ${props.className || ''}`} />;
}

export function TextAreaField(props) {
  return <textarea {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember ${props.className || ''}`} />;
}

export function Badge({ children, tone = 'neutral' }) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700',
    ember: 'bg-amber-100 text-ember',
    sea: 'bg-teal-100 text-sea',
    moss: 'bg-emerald-100 text-moss',
    red: 'bg-red-100 text-red-700'
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${variants[tone]}`}>{children}</span>;
}
