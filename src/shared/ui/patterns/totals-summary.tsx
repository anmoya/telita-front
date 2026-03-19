import type { ReactNode } from "react";

type TotalsSummaryRow = {
  label: ReactNode;
  value: ReactNode;
  tone?: "neutral" | "success" | "muted";
};

type TotalsSummaryProps = {
  rows: TotalsSummaryRow[];
  totalLabel: ReactNode;
  totalValue: ReactNode;
  note?: ReactNode;
  className?: string;
};

export function TotalsSummary({ rows, totalLabel, totalValue, note, className = "" }: TotalsSummaryProps) {
  return (
    <section className={`ti-totals ${className}`.trim()}>
      {rows.map((row, index) => (
        <div key={index} className={`ti-totals__row ti-totals__row--${row.tone ?? "neutral"}`.trim()}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
      <div className="ti-totals__total">
        <span>{totalLabel}</span>
        <strong>{totalValue}</strong>
      </div>
      {note ? <p className="ti-totals__note">{note}</p> : null}
    </section>
  );
}
