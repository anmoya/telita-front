"use client";

import { useMemo } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import type { PreviewLine, PreviewResult } from "./pricing-workbench.shared-types";

type QuotePreviewDialogProps = {
  open: boolean;
  previewMode: "CUSTOMER" | "INTERNAL";
  previewData: PreviewResult | null;
  amountPaid?: number;
  onClose: () => void;
  onSwitchMode: (mode: "CUSTOMER" | "INTERNAL") => void;
};

type LineGroup = { label: string; lines: PreviewLine[]; subtotal: number };

function groupLinesByArea(lines: PreviewLine[]): LineGroup[] {
  const map = new Map<string, PreviewLine[]>();
  for (const line of lines) {
    const key = line.roomAreaName || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(line);
  }
  const groups: LineGroup[] = [];
  for (const [key, groupLines] of map) {
    groups.push({
      label: key || "Sin agrupador",
      lines: groupLines,
      subtotal: groupLines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0)
    });
  }
  return groups;
}

export function QuotePreviewDialog({
  open,
  previewMode,
  previewData,
  amountPaid = 0,
  onClose,
  onSwitchMode
}: QuotePreviewDialogProps) {
  const groups = useMemo(
    () => (previewData ? groupLinesByArea(previewData.lines) : []),
    [previewData]
  );

  const hasAnyGroup = previewData?.lines.some((l) => l.roomAreaName) ?? false;
  const colCount = 6 + (previewMode === "INTERNAL" ? 2 : 0);

  return (
    <Dialog open={open} onClose={onClose} title={`Vista previa — ${previewMode === "CUSTOMER" ? "Cliente" : "Interna"}`} panelClassName="dialog-panel--wide">
        {previewData ? (
          <div id="quote-preview-printable" style={{ fontFamily: "sans-serif", fontSize: "0.9em", lineHeight: "1.6", overflowX: "auto" }}>
            <div style={{ marginBottom: "1rem", borderBottom: "2px solid #333", paddingBottom: "0.5rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1em" }}>{previewData.header.branchName}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.85em" }}>
                {new Date(previewData.header.date).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
                {" · "}Lista: {previewData.header.priceListName}
              </div>
            </div>

            {(previewData.customer.name || previewData.customer.reference) ? (
              <div style={{ marginBottom: "0.75rem", fontSize: "0.88em" }}>
                {previewData.customer.name ? <div>Cliente: <strong>{previewData.customer.name}</strong></div> : null}
                {previewData.customer.reference ? <div>Referencia: <strong>{previewData.customer.reference}</strong></div> : null}
              </div>
            ) : null}

            <table className="data-table" style={{ fontSize: "0.85em", marginBottom: "0.75rem", width: "100%", tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Descripción</th>
                  {previewMode === "INTERNAL" ? <th>SKU</th> : null}
                  <th>Medida (m)</th>
                  <th>Cant.</th>
                  <th>P. unit.</th>
                  <th>Subtotal</th>
                  {previewMode === "INTERNAL" ? <th>Método</th> : null}
                </tr>
              </thead>
              <tbody>
                {hasAnyGroup ? (
                  groups.map((group) => (
                    <>
                      <tr key={`group-${group.label}`} className="ti-group-header-row">
                        <td colSpan={colCount} style={{ fontWeight: 600, fontSize: "0.9em", background: "var(--bg-b, #eee)", padding: "0.35rem 0.5rem" }}>
                          {group.label}
                        </td>
                      </tr>
                      {group.lines.map((line) => (
                        <PreviewLineRow key={line.index} line={line} previewMode={previewMode} />
                      ))}
                      {groups.length > 1 ? (
                        <tr key={`subtotal-${group.label}`}>
                          <td colSpan={colCount - 1} style={{ textAlign: "right", fontSize: "0.85em", fontWeight: 600 }}>
                            Subtotal {group.label}:
                          </td>
                          <td style={{ fontWeight: 600 }}>${group.subtotal.toLocaleString()}</td>
                        </tr>
                      ) : null}
                    </>
                  ))
                ) : (
                  previewData.lines.map((line) => (
                    <PreviewLineRow key={line.index} line={line} previewMode={previewMode} />
                  ))
                )}
              </tbody>
            </table>

            <div style={{ textAlign: "right", fontSize: "0.9em", lineHeight: "1.8" }}>
              <div>Subtotal: <strong>${previewData.totals.subtotal.toLocaleString()}</strong></div>
              <div>IVA (19%): <strong>${Math.round(previewData.totals.tax).toLocaleString()}</strong></div>
              <div style={{ fontSize: "1.05em", fontWeight: 700 }}>
                Total: ${Math.round(previewData.totals.total).toLocaleString()} {previewData.totals.currencyCode}
              </div>
              {amountPaid > 0 ? (
                <>
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.25rem", paddingTop: "0.25rem" }}>
                    Abonado: <strong>${Math.round(amountPaid).toLocaleString()}</strong>
                    <span style={{ color: "var(--muted)", marginLeft: "0.25rem" }}>
                      ({((amountPaid / previewData.totals.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    Saldo: ${Math.round(Math.max(previewData.totals.total - amountPaid, 0)).toLocaleString()}
                  </div>
                </>
              ) : null}
            </div>

            {previewMode === "CUSTOMER" ? (
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => window.print()}>Imprimir</Button>
                <Button variant="secondary" onClick={() => onSwitchMode("INTERNAL")}>Ver vista interna</Button>
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              </div>
            ) : (
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => onSwitchMode("CUSTOMER")}>Ver vista cliente</Button>
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              </div>
            )}
          </div>
        ) : null}
    </Dialog>
  );
}

function PreviewLineRow({ line, previewMode }: { line: PreviewLine; previewMode: "CUSTOMER" | "INTERNAL" }) {
  return (
    <tr>
      <td>{line.index + 1}</td>
      <td>
        {line.description}
        {line.categoryName ? <span style={{ color: "var(--muted)", fontSize: "0.85em" }}> [{line.categoryName}]</span> : null}
        {line.error ? <span style={{ color: "var(--error, red)" }}> ⚠ {line.error}</span> : null}
      </td>
      {previewMode === "INTERNAL" ? <td style={{ fontSize: "0.82em" }}>{line.skuCode}</td> : null}
      <td>{line.requestedWidthM} × {line.requestedHeightM}</td>
      <td>{line.quantity}</td>
      <td>${(line.unitPrice ?? 0).toLocaleString()}</td>
      <td>${(line.subtotal ?? 0).toLocaleString()}</td>
      {previewMode === "INTERNAL" ? (
        <td style={{ fontSize: "0.8em", color: "var(--muted)" }}>
          {line.priceMethod === "TABLE_LOOKUP" ? "Tabla" : `${(line.linearMeters ?? 0).toFixed(2)} m`}
        </td>
      ) : null}
    </tr>
  );
}
