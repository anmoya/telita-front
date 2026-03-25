"use client";

import { useMemo } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import type { QuoteItem } from "../../operations/shared/workbench.shared-types";

type MarginBreakdownDialogProps = {
  open: boolean;
  quoteItems: QuoteItem[];
  customerDiscountInfo: { text: string; pct: number };
  commercialAdjustmentPct: number;
  commercialAdjustmentAmount: number;
  installationAmount: number;
  amountPaid: number;
  onClose: () => void;
};

type BreakdownLine = {
  index: number;
  skuCode: string;
  roomAreaName: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type BreakdownGroup = {
  label: string;
  lines: BreakdownLine[];
  subtotal: number;
};

function groupByArea(lines: BreakdownLine[]): BreakdownGroup[] {
  const map = new Map<string, BreakdownLine[]>();
  for (const line of lines) {
    const key = line.roomAreaName || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(line);
  }
  const groups: BreakdownGroup[] = [];
  for (const [key, groupLines] of map) {
    groups.push({
      label: key || "Sin agrupador",
      lines: groupLines,
      subtotal: groupLines.reduce((sum, l) => sum + l.subtotal, 0),
    });
  }
  return groups;
}

export function MarginBreakdownDialog({
  open,
  quoteItems,
  customerDiscountInfo,
  commercialAdjustmentPct,
  commercialAdjustmentAmount,
  installationAmount,
  amountPaid,
  onClose,
}: MarginBreakdownDialogProps) {
  const calculatedItems = useMemo(
    () => quoteItems.filter((item) => item.calcStatus === "ok" && item.subtotal != null),
    [quoteItems]
  );

  const lines: BreakdownLine[] = useMemo(
    () =>
      calculatedItems.map((item, idx) => ({
        index: idx,
        skuCode: item.skuCode ?? "",
        roomAreaName: item.roomAreaName ?? "",
        categoryName: item.categoryName ?? "",
        quantity: Number(item.quantity) || 0,
        unitPrice: item.unitPrice ?? 0,
        subtotal: item.subtotal ?? 0,
      })),
    [calculatedItems]
  );

  const hasGroups = lines.some((l) => l.roomAreaName);
  const groups = useMemo(() => groupByArea(lines), [lines]);

  const baseSubtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const customerDiscountPct = Math.max(customerDiscountInfo.pct ?? 0, 0);
  const customerDiscountAmount = customerDiscountPct > 0
    ? Math.round(baseSubtotal * (customerDiscountPct / 100))
    : 0;
  const commercialAdj = Math.max(commercialAdjustmentAmount, 0);
  const installation = Math.max(installationAmount, 0);
  const totalAdjustments = commercialAdj + installation;
  const taxableSubtotal = Math.max(baseSubtotal - customerDiscountAmount, 0) + totalAdjustments;
  const tax = Math.round(taxableSubtotal * 0.19);
  const total = Math.round(taxableSubtotal + tax);
  const saldo = Math.max(total - amountPaid, 0);

  const skippedCount = quoteItems.length - calculatedItems.length;

  return (
    <Dialog open={open} onClose={onClose} title="Desglose interno" panelClassName="dialog-panel--wide">
      {skippedCount > 0 ? (
        <p style={{ color: "var(--warning)", fontSize: "0.85em", margin: "0 0 0.75rem" }}>
          {skippedCount} linea(s) sin calcular no se incluyen en el desglose.
        </p>
      ) : null}

      <table className="data-table" style={{ fontSize: "0.85em", marginBottom: "0.75rem", width: "100%", tableLayout: "auto" }}>
        <thead>
          <tr>
            <th>#</th>
            <th>SKU</th>
            <th>Categoria</th>
            <th>Cant.</th>
            <th>P. unit.</th>
            <th>Subtotal linea</th>
          </tr>
        </thead>
        <tbody>
          {hasGroups ? (
            groups.map((group) => (
              <GroupRows key={group.label} group={group} showGroupSubtotal={groups.length > 1} />
            ))
          ) : (
            lines.map((line) => <LineRow key={line.index} line={line} />)
          )}
        </tbody>
      </table>

      <div style={{ textAlign: "right", fontSize: "0.9em", lineHeight: "1.8" }}>
        <div>Subtotal lineas: <strong>${Math.round(baseSubtotal).toLocaleString()}</strong></div>
        {customerDiscountAmount > 0 ? (
          <div>Descuento cliente ({customerDiscountPct}%): <strong>-${Math.round(customerDiscountAmount).toLocaleString()}</strong></div>
        ) : null}
        {commercialAdj > 0 ? (
          <div>Recargo comercial ({commercialAdjustmentPct}%): <strong>${Math.round(commercialAdj).toLocaleString()}</strong></div>
        ) : null}
        {installation > 0 ? (
          <div>Instalacion: <strong>${Math.round(installation).toLocaleString()}</strong></div>
        ) : null}
        {totalAdjustments > 0 ? (
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.25rem", paddingTop: "0.25rem" }}>
            Total ajustes: <strong>${Math.round(totalAdjustments).toLocaleString()}</strong>
            <span style={{ color: "var(--muted)", marginLeft: "0.5rem", fontSize: "0.85em" }}>
              ({baseSubtotal > 0 ? ((totalAdjustments / baseSubtotal) * 100).toFixed(1) : "0.0"}% sobre subtotal)
            </span>
          </div>
        ) : null}
        <div>Subtotal afecto: <strong>${Math.round(taxableSubtotal).toLocaleString()}</strong></div>
        <div>IVA (19%): <strong>${tax.toLocaleString()}</strong></div>
        <div style={{ fontSize: "1.05em", fontWeight: 700 }}>
          Total: ${total.toLocaleString()}
        </div>
        {amountPaid > 0 ? (
          <>
            <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.25rem", paddingTop: "0.25rem" }}>
              Abonado: <strong>${Math.round(amountPaid).toLocaleString()}</strong>
              <span style={{ color: "var(--muted)", marginLeft: "0.25rem" }}>
                ({total > 0 ? ((amountPaid / total) * 100).toFixed(1) : "0.0"}%)
              </span>
            </div>
            <div style={{ fontWeight: 700 }}>
              Saldo: ${Math.round(saldo).toLocaleString()}
            </div>
          </>
        ) : null}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </Dialog>
  );
}

function LineRow({ line }: { line: BreakdownLine }) {
  return (
    <tr>
      <td>{line.index + 1}</td>
      <td>{line.skuCode || "—"}</td>
      <td style={{ fontSize: "0.85em", color: "var(--muted)" }}>{line.categoryName || "—"}</td>
      <td>{line.quantity}</td>
      <td>${(line.unitPrice).toLocaleString()}</td>
      <td>${(line.subtotal).toLocaleString()}</td>
    </tr>
  );
}

function GroupRows({ group, showGroupSubtotal }: { group: BreakdownGroup; showGroupSubtotal: boolean }) {
  return (
    <>
      <tr className="ti-group-header-row">
        <td colSpan={6} style={{ fontWeight: 600, fontSize: "0.9em", background: "var(--bg-b, #eee)", padding: "0.35rem 0.5rem" }}>
          {group.label}
        </td>
      </tr>
      {group.lines.map((line) => (
        <LineRow key={line.index} line={line} />
      ))}
      {showGroupSubtotal ? (
        <tr>
          <td colSpan={5} style={{ textAlign: "right", fontSize: "0.85em", fontWeight: 600 }}>
            Subtotal {group.label}:
          </td>
          <td style={{ fontWeight: 600 }}>${group.subtotal.toLocaleString()}</td>
        </tr>
      ) : null}
    </>
  );
}
