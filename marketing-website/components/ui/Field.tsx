import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClass =
  "w-full rounded-[var(--radius-control)] border border-rule-strong bg-paper-lift px-3.5 py-2.5 text-[15px] text-graphite placeholder:text-grey-light focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite transition-colors";

export function FieldShell({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-graphite-soft">
          {label}
          {required && <span className="text-stop"> *</span>}
        </span>
        {hint && <span className="text-xs text-grey">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${controlClass} appearance-none bg-no-repeat ${className}`} {...props}>
      {children}
    </select>
  );
}
