"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import type { PreviewResult } from "./pricing-workbench.shared-types";

type QuotePreviewDialogProps = {
  open: boolean;
  previewMode: "CUSTOMER" | "INTERNAL";
  previewData: PreviewResult | null;
  onClose: () => void;
  onSwitchMode: (mode: "CUSTOMER" | "INTERNAL") => void;
};

export function QuotePreviewDialog({
  open,
  previewMode,
  previewData,
  onClose,
  onSwitchMode
}: QuotePreviewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Vista previa de cotización">
      <div className="dialog-header">
        <span className="dialog-title">Vista previa — {previewMode === "CUSTOMER" ? "Cliente" : "Interna"}</span>
        <button className="dialog-close" onClick={onClose}>✕</button>
      </div>
      <div className="dialog-body">
        {previewData ? (
          <div id="quote-preview-printable" style={{ fontFamily: "sans-serif", fontSize: "0.9em", lineHeight: "1.6" }}>
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

            <table className="data-table" style={{ fontSize: "0.85em", marginBottom: "0.75rem" }}>
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
                {previewData.lines.map((line) => (
                  <tr key={line.index}>
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
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: "right", fontSize: "0.9em", lineHeight: "1.8" }}>
              <div>Subtotal: <strong>${previewData.totals.subtotal.toLocaleString()}</strong></div>
              <div>IVA (19%): <strong>${Math.round(previewData.totals.tax).toLocaleString()}</strong></div>
              <div style={{ fontSize: "1.05em", fontWeight: 700 }}>
                Total: ${Math.round(previewData.totals.total).toLocaleString()} {previewData.totals.currencyCode}
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Button variant="primary" onClick={() => window.print()}>Imprimir</Button>
              {previewMode === "CUSTOMER" ? (
                <Button variant="secondary" onClick={() => onSwitchMode("INTERNAL")}>Ver vista interna</Button>
              ) : (
                <Button variant="secondary" onClick={() => onSwitchMode("CUSTOMER")}>Ver vista cliente</Button>
              )}
              <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
