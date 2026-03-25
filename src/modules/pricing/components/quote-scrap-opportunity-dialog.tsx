"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TotalsSummary } from "../../../shared/ui/patterns/totals-summary";
import type { QuoteScrapOpportunityRow } from "../../operations/shared/workbench.types";

type QuoteScrapOpportunityDialogProps = {
  open: boolean;
  loading: boolean;
  status: string;
  recoveredValue: number;
  orderCoveragePct: number;
  linesWithOpportunity: number;
  items: QuoteScrapOpportunityRow[];
  onClose: () => void;
};

export function QuoteScrapOpportunityDialog({
  open,
  loading,
  status,
  recoveredValue,
  orderCoveragePct,
  linesWithOpportunity,
  items,
  onClose
}: QuoteScrapOpportunityDialogProps) {
  const pieceCount = items.length;

  return (
    <Dialog open={open} onClose={onClose} title="Retazos útiles para esta cotización" panelClassName="dialog-panel--wide">
      <div id="quote-scrap-opportunity-printable" className="ti-quote-opportunity-dialog">
        {loading ? (
          <div className="ti-quote-opportunity-dialog__loading">
            <Spinner size="md" />
            <p>Buscando retazos útiles para esta cotización...</p>
          </div>
        ) : items.length > 0 ? (
          <>
            <p className="ti-field-note" style={{ margin: 0 }}>
              {status}
            </p>
            <TotalsSummary
              className="ti-quote-opportunity-dialog__summary"
              rows={[
                { label: "Piezas reutilizables", value: String(pieceCount) },
                { label: "Líneas con oportunidad", value: String(linesWithOpportunity) }
              ]}
              totalLabel="Margen potencial recuperado"
              totalValue={`$${Math.round(recoveredValue).toLocaleString()}`}
              note={`Cobertura potencial de la orden: ${orderCoveragePct.toFixed(0)}%. Preview comercial; no asigna ni reserva retazos.`}
            />

            <DataTable className="ti-quote-opportunity-table">
              <thead>
                <tr>
                  <th>Línea</th>
                  <th>SKU</th>
                  <th>Medida</th>
                  <th>Retazo</th>
                  <th>Ubicación</th>
                  <th>Valor recuperable</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key}>
                    <td>{item.itemIndex}.{item.pieceIndex}</td>
                    <td>{item.skuCode}</td>
                    <td>{item.requestedWidthM.toFixed(1)} × {item.requestedHeightM.toFixed(1)} m</td>
                    <td>{item.scrapId.slice(0, 8)}</td>
                    <td>{item.locationCode ?? "Sin ubicación"}</td>
                    <td>${Math.round(item.recoveredValue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </>
        ) : (
          <EmptyState
            title={status || "Sin retazos útiles detectados"}
            description="Ajusta SKU, medidas o cantidad y vuelve a consultar para revisar el potencial comercial de los retazos."
          />
        )}
      </div>

      <div className="inline-actions" style={{ justifyContent: "space-between" }}>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button variant="primary" onClick={() => window.print()} disabled={loading || items.length === 0}>
          Imprimir
        </Button>
      </div>
    </Dialog>
  );
}
