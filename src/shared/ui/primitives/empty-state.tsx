import type { PropsWithChildren } from "react";

type EmptyStateProps = PropsWithChildren<{
  title: string;
  description?: string;
  className?: string;
}>;

export function EmptyState({ title, description, className = "", children }: EmptyStateProps) {
  return (
    <div className={`t-empty-state ${className}`.trim()}>
      <p className="t-empty-title">{title}</p>
      {description ? <p className="t-empty-description">{description}</p> : null}
      {children}
    </div>
  );
}
