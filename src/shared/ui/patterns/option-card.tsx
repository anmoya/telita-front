import type { ReactNode } from "react";

type OptionCardTone = "neutral" | "success" | "warning";

type OptionCardProps = {
  badge?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  tone?: OptionCardTone;
  className?: string;
};

export function OptionCard({
  badge,
  title,
  subtitle,
  meta,
  description,
  actions,
  footer,
  tone = "neutral",
  className = ""
}: OptionCardProps) {
  return (
    <article className={`ti-option-card ti-option-card--${tone} ${className}`.trim()}>
      <div className="ti-option-card__header">
        <div>
          <p className="ti-option-card__title">{title}</p>
          {subtitle ? <p className="ti-option-card__subtitle">{subtitle}</p> : null}
        </div>
        {badge ? <div className="ti-option-card__badge">{badge}</div> : null}
      </div>
      {meta ? <div className="ti-option-card__meta">{meta}</div> : null}
      {description ? <p className="ti-option-card__description">{description}</p> : null}
      {actions ? <div className="ti-option-card__actions">{actions}</div> : null}
      {footer ? <div className="ti-option-card__footer">{footer}</div> : null}
    </article>
  );
}
