import type { ReactNode } from "react";

type DocumentHeaderProps = {
  title: ReactNode;
  code?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function DocumentHeader({ title, code, status, actions, className = "" }: DocumentHeaderProps) {
  return (
    <header className={`ti-doc-header ${className}`.trim()}>
      <div className="ti-doc-header__main">
        <div className="ti-doc-header__title-row">
          <h2 className="ti-doc-header__title">{title}</h2>
          {code ? <span className="ti-doc-header__code">{code}</span> : null}
          {status ? <div className="ti-doc-header__status">{status}</div> : null}
        </div>
      </div>
      {actions ? <div className="ti-doc-header__actions">{actions}</div> : null}
    </header>
  );
}
