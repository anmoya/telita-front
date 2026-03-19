import type { ReactNode } from "react";

type ActionFooterProps = {
  left?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ActionFooter({ left, summary, actions, className = "" }: ActionFooterProps) {
  return (
    <div className={`ti-action-footer ${className}`.trim()}>
      <div className="ti-action-footer__left">{left}</div>
      <div className="ti-action-footer__summary">{summary}</div>
      <div className="ti-action-footer__actions">{actions}</div>
    </div>
  );
}
