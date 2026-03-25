"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../shared/ui/primitives/button";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { Input } from "../../../shared/ui/primitives/input";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";
import { formatLocalDateTime } from "../../../shared/time/date-service";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";

type ScrapFilterStatus = "ALL" | "PENDING_INBOUND" | "PENDING_STORAGE" | "STORED" | "USED" | "DISCARDED";

type ScrapRow = {
  id: string;
  status: string;
  areaM2: number;
  widthM: number;
  heightM: number;
  skuCode: string;
  locationCode: string | null;
  quoteId: string | null;
  quoteCode: string | null;
  createdAt: string;
};

type ScrapsWorkbenchProps = {
  loadingMenu: boolean;
  scrapStatus: string;
  scraps: ScrapRow[];
  scrapFilterStatus: ScrapFilterStatus;
  scrapSearchQuery: string;
  scrapPage: number;
  scrapPageCount: number;
  totalScraps: number;
  selectedScrapIds: string[];
  scrapId: string;
  isAssignLocationOpen: boolean;
  modalLocationCode: string;
  modalStatus: string;
  loadingModal: boolean;
  getScrapStatusLabel: (status: string) => string;
  onSetScrapFilterStatus: (value: ScrapFilterStatus) => void;
  onScrapSearchQueryChange: (value: string) => void;
  onSelectScrap: (scrapId: string) => void;
  onPrevScrapPage: () => void;
  onNextScrapPage: () => void;
  onRefreshScraps: () => void;
  onPrintSelectedScrapLabels: () => void;
  onSetSelectedScrapIds: (ids: string[]) => void;
  onToggleScrapSelection: (id: string) => void;
  onOpenAssignLocation: (scrapId: string) => void;
  onCreateScrapLabel: (scrapId: string) => void;
  onModalLocationCodeChange: (value: string) => void;
  onConfirmAssignLocation: () => void;
  onCloseAssignLocation: () => void;
  labelPreviewHtml: string | null;
  onCloseLabelPreview: () => void;
  onNavigateToSale?: (quoteCode: string) => void;
};

export function ScrapsWorkbench({
  loadingMenu,
  scrapStatus,
  scraps,
  scrapFilterStatus,
  scrapSearchQuery,
  scrapPage,
  scrapPageCount,
  totalScraps,
  selectedScrapIds,
  scrapId,
  isAssignLocationOpen,
  modalLocationCode,
  modalStatus,
  loadingModal,
  getScrapStatusLabel,
  onSetScrapFilterStatus,
  onScrapSearchQueryChange,
  onSelectScrap,
  onPrevScrapPage,
  onNextScrapPage,
  onRefreshScraps,
  onPrintSelectedScrapLabels,
  onSetSelectedScrapIds,
  onToggleScrapSelection,
  onOpenAssignLocation,
  onCreateScrapLabel,
  onModalLocationCodeChange,
  onConfirmAssignLocation,
  onCloseAssignLocation,
  labelPreviewHtml,
  onCloseLabelPreview,
  onNavigateToSale
}: ScrapsWorkbenchProps) {
  const [selectedScrapRowId, setSelectedScrapRowId] = useState<string | null>(null);

  useEffect(() => {
    if (scraps.length === 0) {
      setSelectedScrapRowId(null);
      return;
    }
    if (!selectedScrapRowId || !scraps.some((row) => row.id === selectedScrapRowId)) {
      setSelectedScrapRowId(scraps[0].id);
    }
  }, [scraps, selectedScrapRowId]);

  const selectedScrap = useMemo(
    () => scraps.find((row) => row.id === selectedScrapRowId) ?? null,
    [scraps, selectedScrapRowId]
  );

  useEffect(() => {
    if (selectedScrap && scrapId !== selectedScrap.id) {
      onSelectScrap(selectedScrap.id);
    }
  }, [onSelectScrap, scrapId, selectedScrap]);

  const selectedScrapTone: "draft" | "warning" | "success" | "neutral" =
    selectedScrap?.status === "STORED"
      ? "success"
      : selectedScrap?.status === "PENDING_INBOUND" || selectedScrap?.status === "PENDING_STORAGE"
        ? "warning"
        : selectedScrap?.status === "DISCARDED"
          ? "neutral"
          : "draft";

  return (
    <>
      <article className="flow-card ti-scraps-shell" id="section-scraps">
        <WorkbenchLayout
          className="ti-workbench--scraps"
          aside={
            <WorkbenchSection title="Retazo seleccionado">
              {selectedScrap ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Retazo</span>
                      <strong>{selectedScrap.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Estado</span>
                      <StatusPill tone={selectedScrapTone}>{getScrapStatusLabel(selectedScrap.status)}</StatusPill>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>SKU</span>
                      <strong>{selectedScrap.skuCode}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Medida</span>
                      <strong>{selectedScrap.widthM} x {selectedScrap.heightM} m</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Área</span>
                      <strong>{selectedScrap.areaM2.toFixed(2)} m²</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Ubicación</span>
                      <strong>{selectedScrap.locationCode ?? "Sin ubicación"}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Origen</span>
                      <strong>{selectedScrap.quoteCode ?? (selectedScrap.quoteId ? selectedScrap.quoteId.slice(0, 8) : "Sin cotización")}</strong>
                      {selectedScrap.quoteCode && onNavigateToSale ? (
                        <Button
                          variant="secondary"
                          onClick={() => onNavigateToSale(selectedScrap.quoteCode!)}
                          style={{ padding: "0.1rem 0.5rem", fontSize: "0.78em", marginLeft: "0.4rem" }}
                        >
                          Ver venta
                        </Button>
                      ) : null}
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Generado</span>
                      <strong>{formatLocalDateTime(selectedScrap.createdAt)}</strong>
                    </div>
                  </div>

                  <div className="ti-section__actions">
                    {(selectedScrap.status === "PENDING_INBOUND" || selectedScrap.status === "PENDING_STORAGE") ? (
                      <Button
                        variant="primary"
                        onClick={() => {
                          onSelectScrap(selectedScrap.id);
                          onOpenAssignLocation(selectedScrap.id);
                        }}
                      >
                        Ubicar ahora
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={() => onCreateScrapLabel(selectedScrap.id)}
                      disabled={!selectedScrap}
                    >
                      Crear etiqueta
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Sin retazo seleccionado"
                  description="Selecciona un retazo del listado para ver su estado operativo."
                />
              )}
            </WorkbenchSection>
          }
        >
          <WorkbenchSection
            title="Retazos"
            className="ti-scraps-list-section"
            actions={(
              <>
                <Input
                  value={scrapSearchQuery}
                  onChange={(e) => onScrapSearchQueryChange(e.target.value)}
                  placeholder="Buscar por COT-N"
                  style={{ maxWidth: "160px" }}
                />
                <Button variant={scrapFilterStatus === "ALL" ? "primary" : "secondary"} onClick={() => onSetScrapFilterStatus("ALL")}>
                  Todos
                </Button>
                <Button variant={scrapFilterStatus === "PENDING_INBOUND" ? "primary" : "secondary"} onClick={() => onSetScrapFilterStatus("PENDING_INBOUND")}>
                  Pend. ingreso
                </Button>
                <Button variant={scrapFilterStatus === "PENDING_STORAGE" ? "primary" : "secondary"} onClick={() => onSetScrapFilterStatus("PENDING_STORAGE")}>
                  Pend. ubicar
                </Button>
                <Button variant={scrapFilterStatus === "STORED" ? "primary" : "secondary"} onClick={() => onSetScrapFilterStatus("STORED")}>
                  Almacenados
                </Button>
                <Button variant={scrapFilterStatus === "USED" ? "primary" : "secondary"} onClick={() => onSetScrapFilterStatus("USED")}>
                  Utilizados
                </Button>
                <Button variant={scrapFilterStatus === "DISCARDED" ? "primary" : "secondary"} onClick={() => onSetScrapFilterStatus("DISCARDED")}>
                  Descartados
                </Button>
                <Button variant="secondary" onClick={onRefreshScraps} disabled={loadingMenu}>
                  {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
                </Button>
                <Button
                  variant="primary"
                  onClick={onPrintSelectedScrapLabels}
                  disabled={selectedScrapIds.length === 0 || loadingMenu}
                >
                  {loadingMenu ? <Spinner size="sm" /> : `Imprimir (${selectedScrapIds.length})`}
                </Button>
              </>
            )}
          >
            {scrapStatus ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{scrapStatus}</p> : null}
            <div className="ti-scraps-list-region">
              {loadingMenu && scraps.length === 0 ? (
                <TableSkeleton rows={4} cols={8} />
              ) : scraps.length > 0 ? (
                <DataTable>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          title="Seleccionar todos los almacenados"
                          checked={
                            scraps.filter((row) => row.status === "STORED").length > 0 &&
                            scraps.filter((row) => row.status === "STORED").every((row) => selectedScrapIds.includes(row.id))
                          }
                          onChange={(event) => {
                            const storedIds = scraps.filter((row) => row.status === "STORED").map((row) => row.id);
                            onSetSelectedScrapIds(event.target.checked ? storedIds : []);
                          }}
                        />
                      </th>
                      <th>Retazo</th><th>Origen</th><th>Estado</th><th>SKU</th><th>Medida</th><th>Área</th><th>Ubicación</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scraps.map((row) => (
                      <tr
                        key={row.id}
                        className={row.id === selectedScrapRowId ? "ti-row-selected" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedScrapRowId(row.id);
                          onSelectScrap(row.id);
                        }}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          {row.status === "STORED" ? (
                            <input
                              type="checkbox"
                              checked={selectedScrapIds.includes(row.id)}
                              onChange={() => onToggleScrapSelection(row.id)}
                            />
                          ) : null}
                        </td>
                        <td>{row.id.slice(0, 8).toUpperCase()}</td>
                        <td style={{ fontSize: "0.85em" }}>{row.quoteCode ?? "—"}</td>
                        <td>
                          <StatusPill tone={row.status === "STORED" ? "success" : row.status === "PENDING_INBOUND" || row.status === "PENDING_STORAGE" ? "warning" : "neutral"}>
                            {getScrapStatusLabel(row.status)}
                          </StatusPill>
                        </td>
                        <td>{row.skuCode}</td>
                        <td>{row.widthM} x {row.heightM} m</td>
                        <td>{row.areaM2.toFixed(2)} m²</td>
                        <td>{row.locationCode ?? "—"}</td>
                        <td>
                          <div className="actions-cell">
                            {row.status === "PENDING_INBOUND" || row.status === "PENDING_STORAGE" ? (
                              <Button
                                variant="secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedScrapRowId(row.id);
                                  onSelectScrap(row.id);
                                  onOpenAssignLocation(row.id);
                                }}
                              >
                                Ubicar
                              </Button>
                            ) : row.status === "STORED" ? (
                              <span className="ti-sale-line-lock">Listo</span>
                            ) : (
                              <span className="ti-sale-line-lock">Solo lectura</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState
                  title="Sin retazos para este filtro"
                  description="Cambia el estado o genera nuevos retazos desde cotización o corte."
                />
              )}
            </div>
          </WorkbenchSection>
        </WorkbenchLayout>

        <ActionFooter
          left={<span className="ti-sales-footer-note">Ubicación, lectura e impresión de retazos desde una misma mesa de trabajo.</span>}
          summary={
            <div className="ti-pricing-footer-summary">
              <span className="ti-pricing-footer-summary__meta">Página {scrapPage} de {scrapPageCount}</span>
              <span className="ti-pricing-footer-summary__meta">{totalScraps} retazo(s)</span>
              {selectedScrap ? <span className="ti-pricing-footer-summary__meta">Seleccionado: {selectedScrap.id.slice(0, 8).toUpperCase()}</span> : null}
            </div>
          }
          actions={(
            <>
              <Button variant="secondary" onClick={onPrevScrapPage} disabled={scrapPage === 1}>
                Anterior
              </Button>
              <Button variant="secondary" onClick={onNextScrapPage} disabled={scrapPage >= scrapPageCount}>
                Siguiente
              </Button>
            </>
          )}
        />
      </article>

      <Dialog
        open={isAssignLocationOpen}
        onClose={onCloseAssignLocation}
        title="Asignar ubicacion al retazo"
      >
        <p className="status-note">
          Indica el codigo de posicion donde se almacenara este retazo.
        </p>
        <label className="field">
          <span>Codigo de posicion</span>
          <Input
            value={modalLocationCode}
            onChange={(e) => onModalLocationCodeChange(e.target.value)}
            placeholder="ej. A-01"
          />
        </label>
        {modalStatus ? <p className="status-note" style={{ color: "var(--danger)" }}>{modalStatus}</p> : null}
        <div className="inline-actions">
          <Button onClick={onConfirmAssignLocation} disabled={!modalLocationCode || loadingModal}>
            {loadingModal ? <Spinner size="sm" /> : "Asignar ubicacion"}
          </Button>
          <Button variant="secondary" onClick={onCloseAssignLocation} disabled={loadingModal}>Cancelar</Button>
        </div>
      </Dialog>

      <Dialog
        open={labelPreviewHtml !== null}
        onClose={onCloseLabelPreview}
        title="Vista previa de etiqueta"
        panelClassName="dialog-panel--wide"
      >
        {labelPreviewHtml ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <iframe
              id="scrap-label-preview-iframe"
              srcDoc={labelPreviewHtml}
              style={{ width: "100%", height: "280px", border: "1px solid var(--border)", borderRadius: "6px", background: "#fff" }}
              title="Etiqueta preview"
            />
            <div className="inline-actions">
              <Button
                variant="primary"
                onClick={() => {
                  const iframe = document.getElementById("scrap-label-preview-iframe") as HTMLIFrameElement | null;
                  iframe?.contentWindow?.print();
                }}
              >
                Imprimir
              </Button>
              <Button variant="secondary" onClick={onCloseLabelPreview}>Cerrar</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
