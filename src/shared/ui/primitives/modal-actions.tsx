import type { HTMLAttributes, PropsWithChildren } from "react";

type ModalActionsProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function ModalActions({ className = "", children, ...props }: ModalActionsProps) {
  return (
    <div className={`dialog-actions ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
