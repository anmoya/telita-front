import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "t-btn-primary" : "t-btn-secondary";

  return (
    <button className={`t-btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
