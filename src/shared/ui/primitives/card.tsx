import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <article className={`t-card ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}
