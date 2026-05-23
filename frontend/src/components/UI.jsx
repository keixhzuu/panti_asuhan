import { useState } from 'react';

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

export function StatCard({ label, value, hint, tone = 'ember', className = '' }) {
  const toneClass = tone === 'sea' ? 'text-sea' : tone === 'moss' ? 'text-moss' : 'text-ember';
  const glowClass = tone === 'sea' ? 'bg-teal-100/70' : tone === 'moss' ? 'bg-emerald-100/70' : 'bg-amber-100/70';
  return (
    <Card className={`relative overflow-hidden min-w-0 ${className}`}>
      <div className={`absolute inset-y-0 right-0 w-24 ${glowClass} z-0`} />
      <div className="relative z-10 min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`mt-3 break-words text-2xl font-extrabold tabular-nums leading-tight tracking-tight sm:text-3xl lg:text-[1.7rem] ${toneClass}`}>
          {value}
        </div>
        {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      </div>
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
  const { type, className, ...rest } = props;
  const [showPassword, setShowPassword] = useState(false);

  if (type === 'password') {
    return (
      <div className="relative w-full">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-sm outline-none transition focus:border-ember ${className || ''}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <input
      type={type}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember ${className || ''}`}
      {...rest}
    />
  );
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

  return <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold leading-none ${variants[tone]}`}>{children}</span>;
}
