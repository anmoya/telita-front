import type { PropsWithChildren } from "react";

type BadgeVariant = "neutral" | "success" | "danger";

type BadgeProps = PropsWithChildren<{
  variant?: BadgeVariant;
  className?: string;
}>;

export function Badge({ variant = "neutral", className = "", children }: BadgeProps) {
  const variantClass =
    variant === "success" ? "t-badge-success" : variant === "danger" ? "t-badge-danger" : "t-badge-neutral";

  return <span className={`t-badge ${variantClass} ${className}`.trim()}>{children}</span>;
}
