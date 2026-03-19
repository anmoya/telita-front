import type { PropsWithChildren, ReactNode } from "react";

type WorkbenchLayoutProps = PropsWithChildren<{
  aside?: ReactNode;
  className?: string;
}>;

export function WorkbenchLayout({ aside, className = "", children }: WorkbenchLayoutProps) {
  return (
    <div className={`ti-workbench ${className}`.trim()}>
      <div className="ti-workbench__main">{children}</div>
      {aside ? <aside className="ti-workbench__aside">{aside}</aside> : null}
    </div>
  );
}
