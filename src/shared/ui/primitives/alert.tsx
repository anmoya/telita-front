import type { PropsWithChildren } from "react";

type AlertVariant = "error" | "success" | "info";

type AlertProps = PropsWithChildren<{
  variant?: AlertVariant;
  onClose?: () => void;
  className?: string;
}>;

export function Alert({ variant = "info", onClose, className = "", children }: AlertProps) {
  const variantClass =
    variant === "error"
      ? "t-alert-error"
      : variant === "success"
        ? "t-alert-success"
        : "t-alert-info";

  return (
    <div className={`t-alert ${variantClass} ${className}`.trim()} role="status" aria-live="polite">
      <span className="t-alert-content">{children}</span>
      {onClose ? (
        <button type="button" className="t-alert-close" onClick={onClose} aria-label="Cerrar alerta">
          ×
        </button>
      ) : null}
    </div>
  );
}
