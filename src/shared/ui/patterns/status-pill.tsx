import type { PropsWithChildren } from "react";

type StatusPillTone = "neutral" | "draft" | "success" | "warning" | "danger";

type StatusPillProps = PropsWithChildren<{
  tone?: StatusPillTone;
  className?: string;
}>;

export function StatusPill({ tone = "neutral", className = "", children }: StatusPillProps) {
  return <span className={`ti-pill ti-pill--${tone} ${className}`.trim()}>{children}</span>;
}
