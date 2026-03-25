"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../shared/ui/primitives/button";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { Input } from "../../../shared/ui/primitives/input";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";
import { formatLocalDateTime } from "../../../shared/time/date-service";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import type { BatchLabelResult, LabelRow } from "../../operations/shared/workbench.shared-types";

type LabelFilterType = "ALL" | "SALE_CUT" | "SCRAP";

type LabelsWorkbenchProps = {
  apiUrl: string;
  loadingMenu: boolean;
  loadingActionId: string | null;
  labelStatus: string;
  batchSaleId: string;
  batchResults: BatchLabelResult[];
  labelId: string;
  quoteResultAvailable: boolean;
  scrapId: string;
  labelList: LabelRow[];
  labelFilterType: LabelFilterType;
  labelPage: number;
  labelPageCount: number;
  totalLabels: number;
  selectedLabelIds: string[];
  onBatchSaleIdChange: (value: string) => void;
  onSetLabelFilterType: (value: LabelFilterType) => void;
  onPrevLabelPage: () => void;
  onNextLabelPage: () => void;
  onCreateBatchLabels: () => void;
  onOpenDocument: (url: string) => void;
  onCreateQuoteLabel: () => void;
  onCreateScrapLabel: () => void;
  onReprintCurrentLabel: () => void;
  onRefreshLabels: () => void;
  onPrintSelectedLabels: () => void;
  onSetSelectedLabelIds: (ids: string[]) => void;
  onToggleLabelSelection: (id: string) => void;
  onOpenLabelPreview: (id: string) => void;
  onReprintLabelById: (id: string) => void;
};

export function LabelsWorkbench({
  apiUrl,
  loadingMenu,
  loadingActionId,
  labelStatus,
  batchSaleId,
  batchResults,
  labelId,
  quoteResultAvailable,
  scrapId,
  labelList,
  labelFilterType,
  labelPage,
  labelPageCount,
  totalLabels,
  selectedLabelIds,
  onBatchSaleIdChange,
  onSetLabelFilterType,
  onPrevLabelPage,
  onNextLabelPage,
  onCreateBatchLabels,
  onOpenDocument,
  onCreateQuoteLabel,
  onCreateScrapLabel,
  onReprintCurrentLabel,
  onRefreshLabels,
  onPrintSelectedLabels,
  onSetSelectedLabelIds,
  onToggleLabelSelection,
  onOpenLabelPreview,
  onReprintLabelById
}: LabelsWorkbenchProps) {
  const [selectedLabelRowId, setSelectedLabelRowId] = useState<string | null>(null);

  useEffect(() => {
    if (labelList.length === 0) {
      setSelectedLabelRowId(null);
      return;
    }
    if (labelId && labelList.some((label) => label.id === labelId)) {
      setSelectedLabelRowId(labelId);
      return;
    }
    if (!selectedLabelRowId || !labelList.some((label) => label.id === selectedLabelRowId)) {
      setSelectedLabelRowId(labelList[0].id);
    }
  }, [labelId, labelList, selectedLabelRowId]);

  const selectedLabel = useMemo(
    () => labelList.find((label) => label.id === selectedLabelRowId) ?? null,
    [labelList, selectedLabelRowId]
  );

  const selectedLabelTone: "draft" | "success" = selectedLabel?.lastPrintedAt ? "success" : "draft";

  function getLabelTypeLabel(type: string) {
    if (type === "SCRAP") return "Retazo";
    if (type === "SALE_CUT") return "Corte / cotización";
    return type;
  }

  function getLabelOrigin(row: LabelRow) {
    if (row.quoteCode) return { title: "OC", value: row.quoteCode };
    if (row.scrapId) return { title: "Retazo", value: row.scrapId.slice(0, 8).toUpperCase() };
    if (row.saleLineId) return { title: "Línea", value: row.saleLineId.slice(0, 8).toUpperCase() };
    return { title: "Origen", value: "Sin vínculo" };
  }

  return (
    <article className="flow-card ti-labels-shell">
      <WorkbenchLayout
        className="ti-workbench--labels"
        aside={
          <>
            <WorkbenchSection title="Emisión rápida">
              <div style={{ display: "grid", gap: "0.9rem" }}>
                <label className="field">
                  <span>Venta para lote</span>
                  <Input
                    value={batchSaleId}
                    onChange={(e) => onBatchSaleIdChange(e.target.value)}
                    placeholder="UUID de la venta"
                  />
                </label>
                <div className="ti-section__actions">
                  <Button onClick={onCreateBatchLabels} disabled={loadingMenu || !batchSaleId}>
                    {loadingMenu ? <Spinner size="sm" /> : "Emitir lote"}
                  </Button>
                  <Button variant="secondary" onClick={onCreateQuoteLabel} disabled={!quoteResultAvailable}>
                    Etiqueta cotización
                  </Button>
                  <Button variant="secondary" onClick={onCreateScrapLabel} disabled={!scrapId}>
                    Etiqueta retazo
                  </Button>
                  <Button variant="secondary" onClick={onReprintCurrentLabel} disabled={!labelId}>
                    Reimprimir actual
                  </Button>
                  {labelId ? (
                    <Button variant="secondary" onClick={() => onOpenDocument(`${apiUrl}/labels/${labelId}/pdf`)}>
                      Ver actual
                    </Button>
                  ) : null}
                </div>
                <p className="status-note" style={{ margin: 0 }}>
                  Etiqueta activa: {labelId ? labelId.slice(0, 8).toUpperCase() : "Sin generar"}
                </p>
              </div>
            </WorkbenchSection>

            <WorkbenchSection title="Etiqueta seleccionada">
              {selectedLabel ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Etiqueta</span>
                      <strong>{selectedLabel.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Tipo</span>
                      <StatusPill tone={selectedLabelTone}>{getLabelTypeLabel(selectedLabel.type)}</StatusPill>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>{getLabelOrigin(selectedLabel).title}</span>
                      <strong>{getLabelOrigin(selectedLabel).value}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Creada</span>
                      <strong>{formatLocalDateTime(selectedLabel.createdAt)}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Última impresión</span>
                      <strong>{selectedLabel.lastPrintedAt ? formatLocalDateTime(selectedLabel.lastPrintedAt) : "Pendiente"}</strong>
                    </div>
                  </div>

                  <div className="ti-section__actions">
                    <Button variant="secondary" onClick={() => onOpenLabelPreview(selectedLabel.id)}>
                      Vista previa
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => onReprintLabelById(selectedLabel.id)}
                      disabled={loadingActionId === selectedLabel.id}
                    >
                      {loadingActionId === selectedLabel.id ? <Spinner size="sm" /> : "Imprimir"}
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Sin etiqueta seleccionada"
                  description="Selecciona una etiqueta del historial para ver su detalle operativo."
                />
              )}
            </WorkbenchSection>

            {batchResults.length > 0 ? (
              <WorkbenchSection title="Último lote emitido">
                <DataTable>
                  <thead>
                    <tr>
                      <th>Etiqueta</th>
                      <th>SKU</th>
                      <th>Pieza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.slice(0, 4).map((result) => (
                      <tr key={result.labelId}>
                        <td>{result.labelId.slice(0, 8).toUpperCase()}</td>
                        <td>{result.skuCode}</td>
                        <td>{result.pieceIndex} de {result.pieceTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              </WorkbenchSection>
            ) : null}
          </>
        }
      >
        <WorkbenchSection
          title="Historial de etiquetas"
          className="ti-labels-list-section"
          actions={(
            <>
              <Button variant={labelFilterType === "ALL" ? "primary" : "secondary"} onClick={() => onSetLabelFilterType("ALL")}>
                Todas
              </Button>
              <Button variant={labelFilterType === "SALE_CUT" ? "primary" : "secondary"} onClick={() => onSetLabelFilterType("SALE_CUT")}>
                Corte / cotiz.
              </Button>
              <Button variant={labelFilterType === "SCRAP" ? "primary" : "secondary"} onClick={() => onSetLabelFilterType("SCRAP")}>
                Retazos
              </Button>
              <Button variant="secondary" onClick={onRefreshLabels} disabled={loadingMenu}>
                {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
              </Button>
              <Button variant="primary" onClick={onPrintSelectedLabels} disabled={selectedLabelIds.length === 0 || loadingMenu}>
                {loadingMenu ? <Spinner size="sm" /> : `Imprimir (${selectedLabelIds.length})`}
              </Button>
            </>
          )}
        >
          {labelStatus ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{labelStatus}</p> : null}
          <div className="ti-labels-list-region">
            {loadingMenu && labelList.length === 0 ? (
              <TableSkeleton rows={4} cols={6} />
            ) : labelList.length > 0 ? (
              <DataTable>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        title="Seleccionar todas las visibles"
                        checked={labelList.length > 0 && labelList.every((label) => selectedLabelIds.includes(label.id))}
                        onChange={(event) => onSetSelectedLabelIds(event.target.checked ? labelList.map((label) => label.id) : [])}
                      />
                    </th>
                    <th>Etiqueta</th>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th>Creada</th>
                    <th>Última impresión</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {labelList.map((label) => {
                    const origin = getLabelOrigin(label);
                    return (
                      <tr
                        key={label.id}
                        className={label.id === selectedLabelRowId ? "ti-row-selected" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedLabelRowId(label.id)}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLabelIds.includes(label.id)}
                            onChange={() => onToggleLabelSelection(label.id)}
                          />
                        </td>
                        <td>{label.id.slice(0, 8).toUpperCase()}</td>
                        <td>
                          <StatusPill tone={label.lastPrintedAt ? "success" : "draft"}>
                            {getLabelTypeLabel(label.type)}
                          </StatusPill>
                        </td>
                        <td>
                          {origin.title}: {origin.value}
                        </td>
                        <td>{formatLocalDateTime(label.createdAt)}</td>
                        <td>{label.lastPrintedAt ? formatLocalDateTime(label.lastPrintedAt) : "Pendiente"}</td>
                        <td>
                          <div className="actions-cell">
                            <Button
                              variant="secondary"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedLabelRowId(label.id);
                                onOpenLabelPreview(label.id);
                              }}
                            >
                              Vista previa
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedLabelRowId(label.id);
                                onReprintLabelById(label.id);
                              }}
                              disabled={loadingActionId === label.id}
                            >
                              {loadingActionId === label.id ? <Spinner size="sm" /> : "Imprimir"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState
                title="Sin etiquetas para este filtro"
                description="Genera etiquetas desde ventas, cotización o retazos para poblar este historial."
              />
            )}
          </div>
        </WorkbenchSection>
      </WorkbenchLayout>

      <ActionFooter
        left={<span className="ti-sales-footer-note">Emisión, reimpresión y consulta de etiquetas desde una misma mesa de trabajo.</span>}
        summary={(
          <div className="ti-pricing-footer-summary">
            <span className="ti-pricing-footer-summary__meta">Página {labelPage} de {labelPageCount}</span>
            <span className="ti-pricing-footer-summary__meta">{totalLabels} etiqueta(s)</span>
            {selectedLabel ? <span className="ti-pricing-footer-summary__meta">Seleccionada: {selectedLabel.id.slice(0, 8).toUpperCase()}</span> : null}
          </div>
        )}
        actions={(
          <>
            <Button variant="secondary" onClick={onPrevLabelPage} disabled={labelPage === 1}>
              Anterior
            </Button>
            <Button variant="secondary" onClick={onNextLabelPage} disabled={labelPage >= labelPageCount}>
              Siguiente
            </Button>
          </>
        )}
      />
    </article>
  );
}
