import type { HTMLAttributes } from "react";

type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: "sm" | "md";
};

export function Spinner({ size = "sm", className = "", ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando..."
      aria-busy="true"
      className={`t-spinner t-spinner-${size}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
