import type { PropsWithChildren, ReactNode } from "react";

type FormFieldProps = PropsWithChildren<{
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
}>;

export function FormField({ label, hint, error, className = "", children }: FormFieldProps) {
  return (
    <label className={`t-form-field ${className}`.trim()}>
      {label ? <span className="t-form-label">{label}</span> : null}
      {children}
      {hint ? <span className="t-form-hint">{hint}</span> : null}
      {error ? <span className="t-form-error">{error}</span> : null}
    </label>
  );
}
