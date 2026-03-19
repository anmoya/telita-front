"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { Button } from "../../../shared/ui/primitives/button";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { TotalsSummary } from "../../../shared/ui/patterns/totals-summary";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import type { CustomerOption, QuoteItemCategory, SaleLineDraft, SaleLineRow, SaleRow, ScrapMatchRow } from "./pricing-workbench.shared-types";

type SkuOption = {
  code: string;
  name: string;
};

type SalesWorkbenchProps = {
  apiUrl: string;
  loadingMenu: boolean;
  sales: SaleRow[];
  salesStatus: string;
  salesSearchQuery: string;
  saleId: string;
  salesPage: number;
  salesPageCount: number;
  filteredSalesCount: number;
  pagedSales: SaleRow[];
  selectedSale: SaleRow | null;
  selectedSaleTone: "success" | "danger" | "draft";
  amountPaidInput: string;
  loadingActionId: string | null;
  saleLinesModalSale: SaleRow | null;
  isSaleLinesModalOpen: boolean;
  saleLinesStatus: string;
  saleLineDrafts: SaleLineDraft[];
  skuOptions: SkuOption[];
  categories: QuoteItemCategory[];
  newLineSkuCode: string;
  newLineQty: string;
  newLineWidth: string;
  newLineHeight: string;
  showOfferPreviewStatus: boolean;
  offerPreviewStatus: string;
  scrapSuggestions: ScrapMatchRow[];
  suggestionStatus: string;
  activeSuggestionLineId: string | null;
  activeSuggestionPieceId: string | null;
  getSaleStatusLabel: (status: string) => string;
  onSalesSearchQueryChange: (value: string) => void;
  customers: CustomerOption[];
  onSelectSale: (row: SaleRow) => void;
  onOpenSaleLinesModal: (row: SaleRow) => void;
  onRefreshSales: () => void;
  onUpdateSaleCustomer: (saleId: string, customerId: string) => void;
  onConfirmSale: (saleId: string) => void;
  onCancelSale: (saleId: string) => void;
  onPrintSaleLabels: (saleId: string) => void;
  onOpenDocument: (url: string) => void;
  onAmountPaidInputChange: (value: string) => void;
  onUpdatePaymentSummary: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onCloseSaleLinesModal: () => void;
  onOfferPreview: (saleId: string) => void;
  onFetchMatches: (saleId: string, line: SaleLineRow) => void;
  onAllocateScrap: (pieceId: string, scrapId: string) => void;
  onReleaseAllocation: (saleId: string, saleLineId: string, pieceId: string) => void;
  onUpdateSaleLineDraft: (lineId: string, patch: Partial<SaleLineDraft>) => void;
  onUpdateSaleLine: (saleId: string, draft: SaleLineDraft, displayOrder: number) => void;
  onRemoveSaleLine: (saleId: string, saleLineId: string) => void;
  onNewLineSkuCodeChange: (value: string) => void;
  onNewLineQtyChange: (value: string) => void;
  onNewLineWidthChange: (value: string) => void;
  onNewLineHeightChange: (value: string) => void;
  onAddSaleLine: (saleId: string) => void;
};

function SalesWorkbenchIcon({ kind }: { kind: "calculate" | "remove" | "view-lines" | "search" }) {
  if (kind === "remove") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M4 4l8 8M12 4L4 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "view-lines") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M3.5 4.5h9M3.5 8h9M3.5 11.5h9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="2.5" cy="4.5" r="0.7" fill="currentColor" />
        <circle cx="2.5" cy="8" r="0.7" fill="currentColor" />
        <circle cx="2.5" cy="11.5" r="0.7" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "search") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="7" cy="7" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.2 10.2l2.8 2.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="3" y="2.5" width="10" height="11" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.2 6.1h5.6M5.2 8.4h2.1M8.6 8.4h2.2M5.2 10.7h2.1M8.6 10.7h2.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SalesWorkbench({
  apiUrl,
  loadingMenu,
  sales,
  salesStatus,
  salesSearchQuery,
  saleId,
  salesPage,
  salesPageCount,
  filteredSalesCount,
  pagedSales,
  selectedSale,
  selectedSaleTone,
  amountPaidInput,
  loadingActionId,
  saleLinesModalSale,
  isSaleLinesModalOpen,
  saleLinesStatus,
  saleLineDrafts,
  skuOptions,
  categories,
  newLineSkuCode,
  newLineQty,
  newLineWidth,
  newLineHeight,
  showOfferPreviewStatus,
  offerPreviewStatus,
  scrapSuggestions,
  suggestionStatus,
  activeSuggestionLineId,
  activeSuggestionPieceId,
  customers,
  getSaleStatusLabel,
  onSalesSearchQueryChange,
  onSelectSale,
  onOpenSaleLinesModal,
  onRefreshSales,
  onUpdateSaleCustomer,
  onConfirmSale,
  onCancelSale,
  onPrintSaleLabels,
  onOpenDocument,
  onAmountPaidInputChange,
  onUpdatePaymentSummary,
  onPrevPage,
  onNextPage,
  onCloseSaleLinesModal,
  onOfferPreview,
  onFetchMatches,
  onAllocateScrap,
  onReleaseAllocation,
  onUpdateSaleLineDraft,
  onUpdateSaleLine,
  onRemoveSaleLine,
  onNewLineSkuCodeChange,
  onNewLineQtyChange,
  onNewLineWidthChange,
  onNewLineHeightChange,
  onAddSaleLine
}: SalesWorkbenchProps) {
  const [expandedAssignedLineId, setExpandedAssignedLineId] = useState<string | null>(null);
  const [selectedSuggestionPieceId, setSelectedSuggestionPieceId] = useState("");

  const activeSuggestionLine = useMemo(
    () => saleLinesModalSale?.lines.find((line) => line.id === activeSuggestionLineId) ?? null,
    [activeSuggestionLineId, saleLinesModalSale]
  );
  const activeSuggestionFreePieces = useMemo(
    () => activeSuggestionLine?.pieces.filter((piece) => !piece.allocation) ?? [],
    [activeSuggestionLine]
  );
  const selectedSaleHasCustomer = Boolean(
    selectedSale?.customerId ||
    selectedSale?.customer?.id ||
    selectedSale?.customerName?.trim() ||
    selectedSale?.customer?.fullName?.trim()
  );

  useEffect(() => {
    if (activeSuggestionFreePieces.length === 0) {
      setSelectedSuggestionPieceId("");
      return;
    }
    if (activeSuggestionPieceId && activeSuggestionFreePieces.some((piece) => piece.id === activeSuggestionPieceId)) {
      setSelectedSuggestionPieceId(activeSuggestionPieceId);
      return;
    }
    if (!activeSuggestionFreePieces.some((piece) => piece.id === selectedSuggestionPieceId)) {
      setSelectedSuggestionPieceId(activeSuggestionFreePieces[0].id);
    }
  }, [activeSuggestionFreePieces, activeSuggestionPieceId, selectedSuggestionPieceId]);

  return (
    <>
      <article className="flow-card ti-sales-shell" id="section-sales">
        <WorkbenchLayout
          className="ti-workbench--sales"
          aside={
            <WorkbenchSection title="Venta seleccionada">
              {selectedSale ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Documento</span>
                      <strong>{selectedSale.quoteCode ?? selectedSale.id.slice(0, 8)}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Estado</span>
                      <StatusPill tone={selectedSaleTone}>{getSaleStatusLabel(selectedSale.status)}</StatusPill>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Cliente</span>
                      {selectedSale.status === "DRAFT" ? (
                        <Select
                          value={selectedSale.customerId ?? ""}
                          onChange={(e) => {
                            if (e.target.value) onUpdateSaleCustomer(selectedSale.id, e.target.value);
                          }}
                          style={{ minWidth: "160px" }}
                        >
                          <option value="">{selectedSale.customerName ?? "— Seleccionar cliente —"}</option>
                          {customers.filter((c) => c.isActive).map((c) => (
                            <option key={c.id} value={c.id}>{c.fullName}{c.companyOrReference ? ` (${c.companyOrReference})` : ""}</option>
                          ))}
                        </Select>
                      ) : (
                        <strong>{selectedSale.customer?.fullName ?? selectedSale.customerName ?? "—"}</strong>
                      )}
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Referencia</span>
                      <strong>{selectedSale.customer?.companyOrReference ?? selectedSale.customerReference ?? "—"}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Descuento</span>
                      <strong>{selectedSale.discountPctApplied ? `${selectedSale.discountPctApplied}%` : "—"}</strong>
                    </div>
                  </div>

                  <TotalsSummary
                    rows={[
                      { label: "Subtotal", value: `$${Math.round(selectedSale.subtotalAmount).toLocaleString()}` },
                      { label: "Impuesto (19%)", value: `$${Math.round(selectedSale.taxAmount).toLocaleString()}` },
                      { label: "Abonado", value: `$${Math.round(selectedSale.amountPaid).toLocaleString()}`, tone: selectedSale.amountPaid > 0 ? "success" : "muted" }
                    ]}
                    totalLabel="Total"
                    totalValue={`$${Math.round(selectedSale.totalAmount).toLocaleString()}`}
                    note={`Saldo pendiente: $${Math.round(selectedSale.balanceDue).toLocaleString()}`}
                  />

                  {selectedSale.status === "DRAFT" ? (
                    <>
                      <div className="ti-section__actions">
                        <Button
                          variant="primary"
                          onClick={() => onConfirmSale(selectedSale.id)}
                          disabled={loadingActionId === selectedSale.id || !selectedSaleHasCustomer}
                          title={!selectedSaleHasCustomer ? "Asigna un cliente antes de confirmar la venta." : undefined}
                        >
                          {loadingActionId === selectedSale.id ? <Spinner size="sm" /> : "Confirmar"}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => onCancelSale(selectedSale.id)}
                          disabled={loadingActionId === selectedSale.id}
                        >
                          {loadingActionId === selectedSale.id ? <Spinner size="sm" /> : "Anular"}
                        </Button>
                      </div>
                      {!selectedSaleHasCustomer ? (
                        <p className="ti-field-note" style={{ margin: 0, color: "var(--danger)" }}>
                          Debes completar el cliente antes de confirmar esta venta.
                        </p>
                      ) : null}
                    </>
                  ) : selectedSale.status === "CONFIRMED" ? (
                    <div className="ti-section__actions">
                      <Button
                        variant="secondary"
                        onClick={() => onPrintSaleLabels(selectedSale.id)}
                        disabled={loadingActionId === selectedSale.id}
                      >
                        {loadingActionId === selectedSale.id ? <Spinner size="sm" /> : "Etiquetas"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => onOpenDocument(`${apiUrl}/sales/${selectedSale.id}/print/sale/html`)}
                      >
                        Venta
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => onOpenDocument(`${apiUrl}/sales/${selectedSale.id}/print/work-order/html`)}
                      >
                        OT
                      </Button>
                    </div>
                  ) : null}

                  {selectedSale.status === "DRAFT" ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Registrar abono</span>
                        <Input
                          type="number"
                          value={amountPaidInput}
                          onChange={(e) => onAmountPaidInputChange(e.target.value)}
                          placeholder="0"
                          min="0"
                          style={{ width: "140px" }}
                        />
                      </label>
                      <Button variant="secondary" onClick={onUpdatePaymentSummary}>
                        Guardar
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="Sin venta seleccionada"
                  description="Selecciona una venta del listado para ver su resumen y sus lineas."
                />
              )}
            </WorkbenchSection>
          }
        >
          <WorkbenchSection
            title="Ventas"
            className="ti-sales-list-section"
          >
            <div className="ti-sales-toolbar">
              <Input
                value={salesSearchQuery}
                onChange={(e) => onSalesSearchQueryChange(e.target.value)}
                placeholder="Buscar por cliente, codigo o referencia"
                style={{ maxWidth: "280px" }}
              />
              <p className="ti-field-note" style={{ margin: 0 }}>
                Las ventas se originan desde una cotizacion. Aqui se consultan y gestionan.
              </p>
            </div>

            {salesStatus ? <p className="status-note" style={{ margin: "0.75rem 0 0" }}>{salesStatus}</p> : null}

            <div className="ti-sales-list-region">
              {loadingMenu && sales.length === 0 ? (
                <TableSkeleton rows={6} cols={6} />
              ) : pagedSales.length > 0 ? (
                <DataTable>
                  <thead>
                    <tr><th>COT</th><th>Cliente</th><th>Referencia</th><th>Estado</th><th>Lineas</th><th>Total</th><th>Detalle</th></tr>
                  </thead>
                  <tbody>
                    {pagedSales.map((row) => (
                      <tr
                        key={row.id}
                        className={row.id === saleId ? "ti-row-selected" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={() => onSelectSale(row)}
                        onDoubleClick={() => onOpenSaleLinesModal(row)}
                      >
                        <td>{row.quoteCode ?? "—"}</td>
                        <td>
                          <div className="table-cell-primary">
                            <strong>{row.customer?.fullName ?? row.customerName ?? "—"}</strong>
                            <div className="table-cell-meta">{row.customer?.code ?? "Sin codigo cliente"}</div>
                          </div>
                        </td>
                        <td>{row.customer?.companyOrReference ?? row.customerReference ?? "—"}</td>
                        <td>
                          <StatusPill tone={row.status === "CONFIRMED" ? "success" : row.status === "CANCELED" ? "danger" : "draft"}>
                            {getSaleStatusLabel(row.status)}
                          </StatusPill>
                        </td>
                        <td>{row.lines.length}</td>
                        <td>${Math.round(row.totalAmount).toLocaleString()}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="t-btn t-btn-secondary ti-icon-button"
                            onClick={() => onOpenSaleLinesModal(row)}
                            title="Ver y editar lineas"
                            aria-label={`Ver lineas de ${row.quoteCode ?? row.id}`}
                          >
                            <SalesWorkbenchIcon kind="view-lines" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState
                  className="ti-sales-empty-state"
                  title={salesSearchQuery ? "Sin resultados para esa busqueda" : "Sin ventas registradas"}
                  description="Las ventas apareceran aqui cuando se creen desde una cotizacion."
                />
              )}
            </div>
          </WorkbenchSection>
        </WorkbenchLayout>

        <ActionFooter
          left={<span className="ti-sales-footer-note">La creacion de ventas ocurre desde Cotizacion.</span>}
          summary={
            <div className="ti-pricing-footer-summary">
              <span className="ti-pricing-footer-summary__meta">Pagina {salesPage} de {salesPageCount}</span>
              <span className="ti-pricing-footer-summary__meta">{filteredSalesCount} resultado(s)</span>
              {selectedSale ? <span className="ti-pricing-footer-summary__meta">Seleccionada: {selectedSale.quoteCode ?? selectedSale.id.slice(0, 8)}</span> : null}
            </div>
          }
          actions={
            <>
              <Button variant="secondary" onClick={onPrevPage} disabled={salesPage === 1}>
                Anterior
              </Button>
              <Button variant="secondary" onClick={onNextPage} disabled={salesPage >= salesPageCount}>
                Siguiente
              </Button>
            </>
          }
        />
      </article>

      <Dialog
        open={isSaleLinesModalOpen}
        onClose={onCloseSaleLinesModal}
        title={saleLinesModalSale ? `Lineas de venta ${saleLinesModalSale.quoteCode ?? saleLinesModalSale.id.slice(0, 8)}` : "Lineas de venta"}
        panelClassName="ti-dialog-panel ti-sales-lines-dialog"
        bodyClassName="ti-sales-lines-dialog__body"
      >
        {saleLinesModalSale ? (
          <>
            <div className="ti-sales-lines-dialog__summary">
              <div className="ti-sales-summary">
                <div className="ti-sales-summary__row">
                  <span>Cliente</span>
                  <strong>{saleLinesModalSale.customer?.fullName ?? saleLinesModalSale.customerName ?? "—"}</strong>
                </div>
                <div className="ti-sales-summary__row">
                  <span>Referencia</span>
                  <strong>{saleLinesModalSale.customer?.companyOrReference ?? saleLinesModalSale.customerReference ?? "—"}</strong>
                </div>
                <div className="ti-sales-summary__row">
                  <span>Estado</span>
                  <StatusPill tone={saleLinesModalSale.status === "CONFIRMED" ? "success" : saleLinesModalSale.status === "CANCELED" ? "danger" : "draft"}>
                    {getSaleStatusLabel(saleLinesModalSale.status)}
                  </StatusPill>
                </div>
              </div>
              {saleLinesModalSale.status === "DRAFT" && saleLinesModalSale.lines.some((line) => line.pieces.some((piece) => !piece.allocation)) ? (
                <Button
                  variant="secondary"
                  onClick={() => onOfferPreview(saleLinesModalSale.id)}
                  disabled={loadingActionId === `offer-${saleLinesModalSale.id}`}
                >
                  {loadingActionId === `offer-${saleLinesModalSale.id}` ? <Spinner size="sm" /> : "Calcular autoasignacion"}
                </Button>
              ) : null}
            </div>

            {saleLinesStatus ? <p className="status-note" style={{ margin: 0 }}>{saleLinesStatus}</p> : null}
            {showOfferPreviewStatus ? (
              <p className="status-note" style={{ margin: 0 }}>{offerPreviewStatus}</p>
            ) : null}

            <div className="ti-sales-lines-table">
              <DataTable>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>Agrupador</th>
                    <th>Categoria</th>
                    <th>Cant.</th>
                    <th>Ancho</th>
                    <th>Alto</th>
                    <th>P. Unit</th>
                    <th>Total</th>
                    <th>Retazos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {saleLinesModalSale.lines.map((line, index) => {
                    const draft = saleLineDrafts.find((entry) => entry.id === line.id);
                    const hasAssignedPieces = line.pieces.some((piece) => piece.allocation);
                    const hasFreePieces = line.pieces.some((piece) => !piece.allocation);
                    const isDraftEditable = saleLinesModalSale.status === "DRAFT" && !hasAssignedPieces;
                    const isActiveSuggestionLine = activeSuggestionLineId === line.id;
                    const isExpanded = expandedAssignedLineId === line.id;
                    return (
                      <Fragment key={line.id}>
                        <tr key={line.id} className={isActiveSuggestionLine ? "ti-row-selected" : undefined}>
                          <td>{index + 1}</td>
                          <td>
                            {isDraftEditable && draft ? (
                              <Select
                                value={draft.skuCode}
                                onChange={(e) => onUpdateSaleLineDraft(line.id, { skuCode: e.target.value })}
                                style={{ minWidth: "180px" }}
                              >
                                <option value="">Selecciona SKU</option>
                                {skuOptions.map((sku) => (
                                  <option key={sku.code} value={sku.code}>{sku.code} · {sku.name}</option>
                                ))}
                              </Select>
                            ) : (
                              <div className="table-cell-primary">
                                <strong>{line.skuCode}</strong>
                              </div>
                            )}
                          </td>
                          <td>{line.roomAreaName ?? "—"}</td>
                          <td>
                            {isDraftEditable && draft ? (
                              <Select
                                value={draft.categoryId}
                                onChange={(e) => onUpdateSaleLineDraft(line.id, { categoryId: e.target.value })}
                                style={{ minWidth: "160px" }}
                              >
                                <option value="">Sin categoria</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </Select>
                            ) : (
                              line.categoryName ?? "—"
                            )}
                          </td>
                          <td>
                            {isDraftEditable && draft ? (
                              <Input
                                type="number"
                                min="1"
                                value={draft.quantity}
                                onChange={(e) => onUpdateSaleLineDraft(line.id, { quantity: e.target.value })}
                                style={{ width: "72px" }}
                              />
                            ) : (
                              line.quantity
                            )}
                          </td>
                          <td>
                            {isDraftEditable && draft ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={draft.widthM}
                                onChange={(e) => onUpdateSaleLineDraft(line.id, { widthM: e.target.value })}
                                style={{ width: "88px" }}
                              />
                            ) : (
                              line.requestedWidthM
                            )}
                          </td>
                          <td>
                            {isDraftEditable && draft ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={draft.heightM}
                                onChange={(e) => onUpdateSaleLineDraft(line.id, { heightM: e.target.value })}
                                style={{ width: "88px" }}
                              />
                            ) : (
                              line.requestedHeightM
                            )}
                          </td>
                          <td>${Math.round(line.unitPrice).toLocaleString()}</td>
                          <td>${Math.round(line.lineTotal).toLocaleString()}</td>
                          <td>
                            {line.allocatedScrapPositions.length > 0 ? (
                              <span className="ti-sale-line-lock">{line.allocatedScrapPositions.join(", ")}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <div className="actions-cell">
                              {hasAssignedPieces ? (
                                <button
                                  type="button"
                                  className="t-btn t-btn-secondary ti-icon-button"
                                  onClick={() => setExpandedAssignedLineId((current) => (current === line.id ? null : line.id))}
                                  title={isExpanded ? "Ocultar retazos asignados" : "Ver retazos asignados"}
                                  aria-label={isExpanded ? "Ocultar retazos asignados" : "Ver retazos asignados"}
                                >
                                  <SalesWorkbenchIcon kind="view-lines" />
                                </button>
                              ) : null}
                              {saleLinesModalSale.status === "DRAFT" && hasFreePieces ? (
                                <button
                                  type="button"
                                  className="t-btn t-btn-secondary ti-icon-button"
                                  onClick={() => onFetchMatches(saleLinesModalSale.id, line)}
                                  disabled={loadingActionId === `match-${line.id}`}
                                  title="Buscar retazos compatibles"
                                  aria-label="Buscar retazos compatibles"
                                >
                                  {loadingActionId === `match-${line.id}` ? <Spinner size="sm" /> : <SalesWorkbenchIcon kind="search" />}
                                </button>
                              ) : null}
                              {isDraftEditable && draft ? (
                                <>
                                  <button
                                    type="button"
                                    className="t-btn t-btn-secondary ti-icon-button"
                                    onClick={() => onUpdateSaleLine(saleLinesModalSale.id, draft, index)}
                                    disabled={loadingActionId === `sale-line-save-${line.id}`}
                                    title="Guardar y recalcular linea"
                                    aria-label="Guardar linea"
                                  >
                                    {loadingActionId === `sale-line-save-${line.id}` ? <Spinner size="sm" /> : <SalesWorkbenchIcon kind="calculate" />}
                                  </button>
                                  <button
                                    type="button"
                                    className="t-btn t-btn-secondary ti-icon-button ti-icon-button--danger"
                                    onClick={() => onRemoveSaleLine(saleLinesModalSale.id, line.id)}
                                    disabled={loadingActionId === `sale-line-remove-${line.id}`}
                                    title="Quitar linea"
                                    aria-label="Quitar linea"
                                  >
                                    {loadingActionId === `sale-line-remove-${line.id}` ? <Spinner size="sm" /> : <SalesWorkbenchIcon kind="remove" />}
                                  </button>
                                </>
                              ) : (
                                <span className="ti-sale-line-lock">
                                  {saleLinesModalSale.status === "DRAFT" && hasAssignedPieces ? "Con retazos" : "Solo lectura"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr key={`${line.id}-allocations`} className="ti-sales-line-piece-row">
                            <td colSpan={10}>
                              <div className="ti-sales-line-piece-detail">
                                <div className="ti-sales-line-piece-detail__header">
                                  <strong>Retazos asignados por pieza</strong>
                                  <span>{line.skuCode} · {line.quantity} unidad(es)</span>
                                </div>
                                <DataTable>
                                  <thead>
                                    <tr><th>Pieza</th><th>Medida</th><th>Retazo</th><th>Posicion</th><th>Accion</th></tr>
                                  </thead>
                                  <tbody>
                                    {line.pieces.map((piece) => (
                                      <tr key={piece.id}>
                                        <td>{piece.pieceIndex} / {piece.pieceTotal}</td>
                                        <td>{piece.requestedWidthM} x {piece.requestedHeightM}</td>
                                        <td>{piece.allocation ? piece.allocation.scrapId.slice(0, 8) : "—"}</td>
                                        <td>{piece.allocation?.locationCode ?? "—"}</td>
                                        <td>
                                          {saleLinesModalSale.status === "DRAFT" && piece.allocation ? (
                                            <Button
                                              variant="secondary"
                                              onClick={() => onReleaseAllocation(saleLinesModalSale.id, line.id, piece.id)}
                                              disabled={loadingActionId === piece.id}
                                            >
                                              {loadingActionId === piece.id ? <Spinner size="sm" /> : "Liberar"}
                                            </Button>
                                          ) : (
                                            <span className="ti-sale-line-lock">{piece.allocation ? "Asignado" : "Sin retazo"}</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </DataTable>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </DataTable>
            </div>

            <div className="ti-sales-line-suggestions">
              <div className="ti-sales-line-suggestions__header">
                <strong>Retazos compatibles</strong>
                <span>{suggestionStatus || "Selecciona una linea draft para buscar retazos compatibles."}</span>
              </div>
              {activeSuggestionLine ? (
                <div className="ti-sales-line-suggestions__target">
                  <strong>Pieza objetivo</strong>
                  {activeSuggestionFreePieces.length > 0 ? (
                    <Select
                      value={selectedSuggestionPieceId}
                      onChange={(e) => setSelectedSuggestionPieceId(e.target.value)}
                      style={{ width: "220px" }}
                    >
                      {activeSuggestionFreePieces.map((piece) => (
                        <option key={piece.id} value={piece.id}>
                          Pieza {piece.pieceIndex} de {piece.pieceTotal}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="ti-sale-line-lock">Sin piezas libres</span>
                  )}
                </div>
              ) : null}
              {scrapSuggestions.length > 0 ? (
                <DataTable>
                  <thead>
                    <tr><th>Retazo</th><th>Medida</th><th>Area</th><th>Excedente</th><th>Ubicacion</th><th>Accion</th></tr>
                  </thead>
                  <tbody>
                    {scrapSuggestions.map((scrap) => (
                      <tr key={scrap.id}>
                        <td>{scrap.labelCode ?? scrap.id.slice(0, 8)}</td>
                        <td>{scrap.widthM} x {scrap.heightM}</td>
                        <td>{scrap.areaM2.toFixed(2)} m²</td>
                        <td>{scrap.excessAreaM2.toFixed(2)} m²</td>
                        <td>{scrap.locationCode ?? "—"}</td>
                        <td>
                          <Button
                            variant="secondary"
                            onClick={() => selectedSuggestionPieceId && onAllocateScrap(selectedSuggestionPieceId, scrap.id)}
                            disabled={loadingActionId === scrap.id || !selectedSuggestionPieceId}
                          >
                            {loadingActionId === scrap.id ? <Spinner size="sm" /> : "Asignar"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <p className="status-note" style={{ margin: 0 }}>Sin retazos listados para esta linea.</p>
              )}
            </div>

            {saleLinesModalSale.status === "DRAFT" ? (
              <div className="ti-sale-line-composer">
                <div className="ti-sale-line-composer__header">
                  <strong>Nueva linea</strong>
                  <span>Usalo para ajustar el draft sin volver a la cotizacion.</span>
                </div>
                <div className="ti-sale-line-composer__grid">
                  <Select value={newLineSkuCode} onChange={(e) => onNewLineSkuCodeChange(e.target.value)}>
                    <option value="">Selecciona SKU</option>
                    {skuOptions.map((sku) => (
                      <option key={sku.code} value={sku.code}>{sku.code} · {sku.name}</option>
                    ))}
                  </Select>
                  <Input type="number" min="1" value={newLineQty} onChange={(e) => onNewLineQtyChange(e.target.value)} placeholder="Cantidad" />
                  <Input type="number" min="0" step="0.1" value={newLineWidth} onChange={(e) => onNewLineWidthChange(e.target.value)} placeholder="Ancho" />
                  <Input type="number" min="0" step="0.1" value={newLineHeight} onChange={(e) => onNewLineHeightChange(e.target.value)} placeholder="Alto" />
                  <Button variant="primary" onClick={() => onAddSaleLine(saleLinesModalSale.id)}>
                    Agregar linea
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="Venta no encontrada"
            description="Cierra este popup y vuelve a seleccionar la venta."
          />
        )}
      </Dialog>
    </>
  );
}
