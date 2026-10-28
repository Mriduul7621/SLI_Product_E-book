import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { IconCheck, IconClose, IconSearch } from "@/components/icons";

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  as: Tag = "div",
  interactive,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-charcoal/10 bg-white shadow-card",
        interactive &&
          "transition duration-300 hover:-translate-y-0.5 hover:border-olive/40 hover:shadow-lift",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="mt-1.5 text-[1.35rem] font-extrabold tracking-tight text-charcoal-deep sm:text-[1.55rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-charcoal-soft">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "olive" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
};

const buttonStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-charcoal text-white hover:bg-charcoal-deep shadow-sm",
  accent: "bg-sunset text-white hover:bg-sunset-deep shadow-sm",
  olive: "bg-olive text-white hover:bg-olive-deep shadow-sm",
  outline: "border border-charcoal/20 bg-white text-charcoal hover:border-olive hover:bg-olive-wash",
  ghost: "text-charcoal-soft hover:bg-charcoal/5 hover:text-charcoal-deep",
  danger: "border border-clay/25 bg-clay-tint text-clay hover:bg-clay hover:text-white",
};

const buttonSizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-[12px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[13px] gap-2 rounded-xl",
  lg: "h-12 px-6 text-[14px] gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-bold transition duration-200 disabled:pointer-events-none disabled:opacity-45",
        buttonStyles[variant],
        buttonSizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Pills & badges                                                      */
/* ------------------------------------------------------------------ */

export type Tone = "olive" | "sunset" | "charcoal" | "steel" | "plum" | "forest" | "clay";

const toneStyles: Record<Tone, string> = {
  olive: "bg-olive-tint text-olive-deep border-olive/25",
  sunset: "bg-sunset-soft text-sunset-deep border-sunset/25",
  charcoal: "bg-charcoal/5 text-charcoal border-charcoal/15",
  steel: "bg-steel-soft text-steel border-steel/25",
  plum: "bg-plum-soft text-plum border-plum/25",
  forest: "bg-forest-tint text-forest border-forest/25",
  clay: "bg-clay-tint text-clay border-clay/25",
};

export function Badge({
  children,
  tone = "charcoal",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  tone = "olive",
  className,
  label,
}: {
  value: number;
  tone?: "olive" | "sunset" | "steel" | "plum" | "forest";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const bar: Record<string, string> = {
    olive: "bg-olive",
    sunset: "bg-sunset",
    steel: "bg-steel",
    plum: "bg-plum",
    forest: "bg-forest",
  };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bar[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 132,
  stroke = 10,
  caption,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  caption?: string;
  sub?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const gid = useId().replace(/:/g, "");
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#978C21" />
            <stop offset="100%" stopColor="#F37021" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(60,60,59,0.10)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <p className="font-latin text-[1.55rem] font-extrabold leading-none text-charcoal-deep">
          {new Intl.NumberFormat("bn-BD").format(pct)}%
        </p>
        {caption && <p className="mt-1 text-[11px] font-bold text-charcoal-soft">{caption}</p>}
        {sub && <p className="text-[10.5px] text-charcoal/45">{sub}</p>}
      </div>
    </div>
  );
}

export function Stat({
  value,
  label,
  hint,
  tone = "charcoal",
  icon,
}: {
  value: string;
  label: string;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-latin text-[1.45rem] font-extrabold leading-none text-charcoal-deep">{value}</p>
        {icon && <span className={cn("grid h-7 w-7 place-items-center rounded-lg border", toneStyles[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-[11.5px] font-bold text-charcoal-soft">{label}</p>
      {hint && <p className="mt-0.5 text-[10.5px] text-charcoal/45">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-charcoal">
        {label}
        {required && <span className="text-sunset">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[10.5px] leading-relaxed text-charcoal/50">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] font-semibold text-clay">{error}</span>}
    </label>
  );
}

const controlClass =
  "h-10 w-full rounded-lg border border-charcoal/20 bg-white px-3 text-[13px] text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-olive focus:ring-2 focus:ring-olive/20";

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, "pl-9")}
      />
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-charcoal/10 bg-white/70 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold transition",
            value === t.id
              ? "bg-charcoal text-white shadow-sm"
              : "text-charcoal-soft hover:bg-charcoal/5 hover:text-charcoal-deep",
          )}
        >
          {t.label}
          {t.badge && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-latin text-[10px] tabular-nums",
                value === t.id ? "bg-white/20 text-white" : "bg-charcoal/10 text-charcoal-soft",
              )}
            >
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-olive-tint text-olive-deep">{icon}</div>}
      <p className="text-[14px] font-extrabold text-charcoal-deep">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-charcoal-soft">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="লোড হচ্ছে"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-charcoal/20 border-t-olive",
        className,
      )}
    />
  );
}

export function Alert({
  tone = "olive",
  title,
  children,
  action,
}: {
  tone?: "olive" | "sunset" | "clay" | "steel";
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const map = {
    olive: "border-olive/30 bg-olive-wash text-charcoal",
    sunset: "border-sunset/30 bg-sunset-soft text-charcoal",
    clay: "border-clay/30 bg-clay-tint text-charcoal",
    steel: "border-steel/25 bg-steel-soft text-charcoal",
  };
  return (
    <div className={cn("flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-[12.5px] leading-relaxed", map[tone])}>
      <div className="min-w-0 flex-1">
        {title && <p className="font-extrabold text-charcoal-deep">{title}</p>}
        {children && <div className={cn(title && "mt-1", "text-charcoal-soft")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>("input,select,textarea,button");
    first?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-charcoal-deep/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-shell shadow-lift sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-charcoal/10 bg-shell/95 px-5 py-4 backdrop-blur">
          <h3 className="text-[15px] font-extrabold text-charcoal-deep">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="grid h-8 w-8 place-items-center rounded-lg border border-charcoal/15 text-charcoal transition hover:bg-charcoal/5"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-charcoal/10 bg-shell/95 px-5 py-3 backdrop-blur">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
let toasts: Toast[] = [];
const toastListeners = new Set<() => void>();
let toastSeq = 1;

function emitToasts() {
  toastListeners.forEach((fn) => fn());
}

export function toast(message: string, tone: Toast["tone"] = "success") {
  const item = { id: toastSeq++, message, tone };
  toasts = [...toasts, item];
  emitToasts();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== item.id);
    emitToasts();
  }, 3800);
}

export function Toaster() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    toastListeners.add(fn);
    return () => {
      toastListeners.delete(fn);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-semibold shadow-lift",
            t.tone === "success" && "border-forest/25 bg-forest text-white",
            t.tone === "error" && "border-clay/30 bg-clay text-white",
            t.tone === "info" && "border-charcoal/20 bg-charcoal text-white",
          )}
        >
          {t.tone === "success" && <IconCheck className="h-4 w-4 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
