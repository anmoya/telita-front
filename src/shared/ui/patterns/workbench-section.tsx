import type { PropsWithChildren, ReactNode } from "react";

type WorkbenchSectionProps = PropsWithChildren<{
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}>;

export function WorkbenchSection({ title, actions, className = "", children }: WorkbenchSectionProps) {
  return (
    <section className={`ti-section ${className}`.trim()}>
      <div className="ti-section__header">
        <p className="ti-section__title">{title}</p>
        {actions ? <div className="ti-section__actions">{actions}</div> : null}
      </div>
      <div className="ti-section__body">{children}</div>
    </section>
  );
}
