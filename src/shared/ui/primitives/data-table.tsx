import type { PropsWithChildren, TableHTMLAttributes } from "react";

type DataTableProps = PropsWithChildren<TableHTMLAttributes<HTMLTableElement>>;

export function DataTable({ className = "", children, ...props }: DataTableProps) {
  return (
    <div className="table-wrapper">
      <table className={`data-table ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  );
}
