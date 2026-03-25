"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import type { AutoScrapAssignmentPreview } from "../../operations/shared/workbench.types";

type AutoScrapAssignmentDialogProps = {
  open: boolean;
  preview: AutoScrapAssignmentPreview | null;
  loadingActionId: string | null;
  onClose: () => void;
  onGeneratePickList: (saleId: string, items: Array<{ saleLineId: string; scrapId: string }>) => void;
  onCommit: (saleId: string) => void;
};

export function AutoScrapAssignmentDialog({
  open,
  preview,
  loadingActionId,
  onClose,
  onGeneratePickList,
  onCommit
}: AutoScrapAssignmentDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Autoasignacion de retazos">
      {preview && preview.items.length > 0 ? (
        <>
          <p className="status-note" style={{ marginTop: 0 }}>
            Estrategia: {preview.strategy}. Revisa la propuesta antes de aplicarla. La confirmación corre en modo all-or-nothing.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>SKU</th><th>Pieza</th><th>Objetivo</th><th>Retazo</th><th>Ubicacion</th><th>Excedente m²</th></tr>
            </thead>
            <tbody>
              {preview.items.map((item) => (
                <tr key={`${item.saleLinePieceId}-${item.scrapId}`}>
                  <td>{item.skuCode}</td>
                  <td>{item.pieceIndex}/{item.pieceTotal}</td>
                  <td>{item.requestedWidthM} x {item.requestedHeightM}</td>
                  <td>{item.labelCode}</td>
                  <td><strong>{item.locationCode ?? "—"}</strong></td>
                  <td>{item.excessAreaM2.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.unmatchedPieces.length > 0 ? (
            <div style={{ marginTop: "1rem" }}>
              <p className="status-note" style={{ marginBottom: "0.35rem" }}>
                {preview.unmatchedPieces.length} pieza(s) quedarían para corte nuevo si aplicas esta propuesta.
              </p>
              <table className="data-table">
                <thead>
                  <tr><th>SKU</th><th>Pieza</th><th>Medida</th></tr>
                </thead>
                <tbody>
                  {preview.unmatchedPieces.map((piece) => (
                    <tr key={piece.saleLinePieceId}>
                      <td>{piece.skuCode}</td>
                      <td>{piece.pieceIndex}/{piece.pieceTotal}</td>
                      <td>{piece.requestedWidthM} x {piece.requestedHeightM}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="inline-actions">
            <Button
              variant="secondary"
              onClick={() => onGeneratePickList(preview.saleId, preview.items.map((item) => ({ saleLineId: item.saleLineId, scrapId: item.scrapId })))}
            >
              Generar lista para buscar
            </Button>
            <Button
              variant="primary"
              onClick={() => onCommit(preview.saleId)}
              disabled={loadingActionId === `offer-commit-${preview.saleId}`}
            >
              {loadingActionId === `offer-commit-${preview.saleId}` ? <Spinner size="sm" /> : "Aplicar autoasignacion"}
            </Button>
            <Button variant="secondary" onClick={onClose}>Seguir sin autoasignar</Button>
          </div>
        </>
      ) : (
        <p className="status-note">Sin retazos compatibles para autoasignar.</p>
      )}
    </Dialog>
  );
}
