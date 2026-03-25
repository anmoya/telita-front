"use client";

import { Fragment, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { TotalsSummary } from "../../../shared/ui/patterns/totals-summary";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import { QuoteScrapOpportunityDialog } from "./quote-scrap-opportunity-dialog";
import type { QuoteScrapOpportunityRow } from "../../operations/shared/workbench.types";
import type { CustomerOption, PreviewResult, QuoteItem, QuoteItemCategory } from "../../operations/shared/workbench.shared-types";

function QuoteRowIcon({ kind }: { kind: "calculate" | "duplicate" | "remove" }) {
  if (kind === "duplicate") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="5" y="3" width="7" height="9" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4.5 5.5H3.8A1.3 1.3 0 0 0 2.5 6.8v5.4a1.3 1.3 0 0 0 1.3 1.3h4.4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "remove") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M4 4l8 8M12 4L4 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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

type PriceListOption = {
  name: string;
  isActive: boolean;
};

type SkuOption = {
  code: string;
  name: string;
};

type PricingWorkbenchProps = {
  quoteItems: QuoteItem[];
  activeQuoteItemId: string | null;
  quoteOpportunityEligibleCount: number;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  quoteItemMatchesStatus: string;
  quoteOpportunitySummary: {
    pieces: number;
    lines: number;
    recoveredValue: number;
    orderCoveragePct: number;
  };
  quoteOpportunityOpen: boolean;
  loadingActionId: string | null;
  quoteHasCalcErrors: boolean;
  quoteSubtotal: number;
  commercialAdjustmentPct: number;
  commercialAdjustmentAmount: number;
  installationAmount: number;
  quoteTax: number;
  quoteTotal: number;
  quoteAmountPaid: number;
  onQuoteAmountPaidChange: (value: number) => void;
  quoteBatchId: string | null;
  pricingDocumentStatus: string;
  pricingDocumentTone: "success" | "draft";
  selectedPriceListName: string;
  loadingSelectors: boolean;
  customers: CustomerOption[];
  quoteCustomerId: string;
  quoteCustomerReference: string;
  quoteCustomerName: string;
  customerDiscountInfo: { text: string; pct: number };
  priceListOptions: PriceListOption[];
  quoteManualDiscountPct: string;
  quoteManualDiscountReason: string;
  categories: QuoteItemCategory[];
  newCategoryName: string;
  skuOptions: SkuOption[];
  loadingBatch: boolean;
  loadingPreview: boolean;
  loadingCreateDraft: boolean;
  loadingSave: boolean;
  quoteDirty: boolean;
  quoteReady: boolean;
  status: string;
  statusTone: "success" | "danger" | null;
  onOpenQuoteOpportunity: () => void;
  onCloseQuoteOpportunity: () => void;
  onApplyQuoteCustomerSelection: (selectedId: string) => void;
  onQuoteCustomerReferenceChange: (value: string) => void;
  onQuoteCustomerNameChange: (value: string) => void;
  onSelectedPriceListNameChange: (value: string) => void;
  onCommercialAdjustmentPctChange: (value: number) => void;
  onInstallationAmountChange: (value: number) => void;
  onQuoteManualDiscountPctChange: (value: string) => void;
  onQuoteManualDiscountReasonChange: (value: string) => void;
  onAddQuoteItem: () => void;
  onDuplicateQuoteItem: (itemId: string) => void;
  onCalculateAll: () => void;
  onSelectQuoteItem: (itemId: string) => void;
  onMoveItemUp: (itemId: string) => void;
  onMoveItemDown: (itemId: string) => void;
  onUpdateQuoteItem: (itemId: string, patch: Partial<QuoteItem>) => void;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategoryForItem: (itemId: string, name: string) => void;
  onCalculateItem: (itemId: string) => void;
  onRemoveQuoteItem: (itemId: string) => void;
  onResetQuoteWorkbench: () => void;
  onSaveToHistory: () => void;
  onPreviewCustomer: () => void;
  onCreateDraftFromQuote: () => void;
  onShowBreakdown: () => void;
};

export function PricingWorkbench({
  quoteItems,
  activeQuoteItemId,
  quoteOpportunityEligibleCount,
  quoteItemMatches,
  quoteItemMatchesStatus,
  quoteOpportunitySummary,
  quoteOpportunityOpen,
  loadingActionId,
  quoteHasCalcErrors,
  quoteSubtotal,
  commercialAdjustmentPct,
  commercialAdjustmentAmount,
  installationAmount,
  quoteTax,
  quoteTotal,
  quoteAmountPaid,
  onQuoteAmountPaidChange,
  quoteBatchId,
  pricingDocumentStatus,
  pricingDocumentTone,
  selectedPriceListName,
  loadingSelectors,
  customers,
  quoteCustomerId,
  quoteCustomerReference,
  quoteCustomerName,
  customerDiscountInfo,
  priceListOptions,
  quoteManualDiscountPct,
  quoteManualDiscountReason,
  categories,
  newCategoryName,
  skuOptions,
  loadingBatch,
  loadingPreview,
  loadingCreateDraft,
  loadingSave,
  quoteDirty,
  quoteReady,
  status,
  statusTone,
  onOpenQuoteOpportunity,
  onCloseQuoteOpportunity,
  onApplyQuoteCustomerSelection,
  onQuoteCustomerReferenceChange,
  onQuoteCustomerNameChange,
  onSelectedPriceListNameChange,
  onCommercialAdjustmentPctChange,
  onInstallationAmountChange,
  onQuoteManualDiscountPctChange,
  onQuoteManualDiscountReasonChange,
  onAddQuoteItem,
  onDuplicateQuoteItem,
  onCalculateAll,
  onSelectQuoteItem,
  onMoveItemUp,
  onMoveItemDown,
  onUpdateQuoteItem,
  onNewCategoryNameChange,
  onCreateCategoryForItem,
  onCalculateItem,
  onRemoveQuoteItem,
  onResetQuoteWorkbench,
  onSaveToHistory,
  onPreviewCustomer,
  onCreateDraftFromQuote,
  onShowBreakdown
}: PricingWorkbenchProps) {
  const [customerContextOpen, setCustomerContextOpen] = useState(false);
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === quoteCustomerId) ?? null,
    [customers, quoteCustomerId]
  );
  const showPricingBanner = Boolean(status || quoteBatchId || quoteDirty || selectedPriceListName || quoteItems.length);

  return (
    <>
      <article className="flow-card ti-pricing-shell" id="section-pricing">
        {showPricingBanner ? (
          <section className="ti-pricing-banner">
            <div className="ti-pricing-banner__status">
              <StatusPill tone={pricingDocumentTone}>{pricingDocumentStatus}</StatusPill>
              {quoteBatchId ? <StatusPill tone="warning">Editando borrador</StatusPill> : null}
              {quoteDirty ? <StatusPill tone="danger">Cambios sin guardar</StatusPill> : null}
              {status ? <StatusPill tone={statusTone ?? "neutral"}>{status}</StatusPill> : null}
            </div>
            <div className="ti-pricing-banner__meta">
              <span>{selectedPriceListName || "Sin lista de precios"}</span>
              <span>{quoteItems.length} línea(s)</span>
              {quoteCustomerName ? <span>Cliente visible: {quoteCustomerName}</span> : null}
            </div>
          </section>
        ) : null}

        <WorkbenchLayout
        className="ti-workbench--pricing"
        aside={
          <>
            <WorkbenchSection title="Retazos útiles" className="ti-pricing-opportunity-launcher">
              <div className="ti-pricing-opportunity-launcher__body">
                <p className="ti-field-note" style={{ margin: 0 }}>
                  Consulta el potencial comercial de los retazos disponibles para esta cotización.
                </p>
                <div className="ti-pricing-opportunity-launcher__meta">
                  {quoteOpportunityEligibleCount > 0 ? (
                    <StatusPill tone={quoteItemMatches.length > 0 ? "success" : "neutral"}>
                      {quoteItemMatches.length > 0
                        ? `Potencial $${Math.round(quoteOpportunitySummary.recoveredValue).toLocaleString()}`
                        : `${quoteOpportunityEligibleCount} línea(s) listas`}
                    </StatusPill>
                  ) : (
                    <StatusPill tone="neutral">Sin líneas elegibles</StatusPill>
                  )}
                  <Button
                    variant="primary"
                    onClick={onOpenQuoteOpportunity}
                    disabled={quoteOpportunityEligibleCount === 0 || loadingActionId === "quote-opportunity"}
                  >
                    {loadingActionId === "quote-opportunity" ? <Spinner size="sm" /> : "Ver retazos útiles"}
                  </Button>
                </div>
              </div>
            </WorkbenchSection>

            <WorkbenchSection title="Totales" className="ti-pricing-totals-section">
                {quoteHasCalcErrors ? (
                  <p className="status-note" style={{ margin: 0, color: "var(--danger)" }}>
                    Total bloqueado: corrige los items con error antes de cerrar la cotizacion.
                  </p>
                ) : (
                  <>
                    {(() => {
                      const discPct = customerDiscountInfo.pct;
                      const baseSubtotal = quoteSubtotal - commercialAdjustmentAmount - installationAmount;
                      const discountAmount = discPct > 0 ? Math.round(baseSubtotal * discPct / 100) : 0;
                      const subtotalAfterDiscount = baseSubtotal - discountAmount + commercialAdjustmentAmount + installationAmount;
                      const taxAfterDiscount = Math.round(subtotalAfterDiscount * 0.19);
                      const totalAfterDiscount = Math.round(subtotalAfterDiscount + taxAfterDiscount);
                      const showDiscount = discPct > 0;

                      const rows = [
                        { label: "Subtotal base", value: `$${Math.round(baseSubtotal).toLocaleString()}` },
                        ...(showDiscount ? [{ label: `Descuento cliente (${discPct}%)`, value: `-$${discountAmount.toLocaleString()}`, tone: "success" as const }] : []),
                        ...(commercialAdjustmentAmount > 0 ? [{ label: `Recargo comercial (${commercialAdjustmentPct}%)`, value: `$${Math.round(commercialAdjustmentAmount).toLocaleString()}` }] : []),
                        ...(installationAmount > 0 ? [{ label: "Instalación", value: `$${Math.round(installationAmount).toLocaleString()}` }] : []),
                        { label: "Impuesto (19%)", value: `$${(showDiscount ? taxAfterDiscount : quoteTax).toLocaleString()}` }
                      ];

                      return (
                        <TotalsSummary
                          className="ti-pricing-totals-summary"
                          rows={rows}
                          totalLabel="Total"
                          totalValue={`$${(showDiscount ? totalAfterDiscount : quoteTotal).toLocaleString()}`}
                          note={
                            showDiscount
                              ? "Total estimado con descuento del cliente. El descuento definitivo se aplica al crear la venta."
                              : undefined
                          }
                        />
                      );
                    })()}
                    <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                      <label className="ti-field-label" style={{ display: "block", marginBottom: "0.25rem" }}>Abono del cliente</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Input
                          type="number"
                          min={0}
                          max={quoteTotal}
                          value={quoteAmountPaid || ""}
                          placeholder="0"
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!isNaN(v) && v >= 0 && v <= quoteTotal) onQuoteAmountPaidChange(v);
                            else if (e.target.value === "") onQuoteAmountPaidChange(0);
                          }}
                          style={{ maxWidth: "10rem" }}
                        />
                        {quoteAmountPaid > 0 && quoteTotal > 0 ? (
                          <span style={{ fontSize: "0.85em", color: "var(--muted)" }}>
                            ({((quoteAmountPaid / quoteTotal) * 100).toFixed(1)}%)
                          </span>
                        ) : null}
                      </div>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
                        <strong>Saldo por pagar: </strong>
                        {quoteAmountPaid > 0
                          ? <span style={{ color: "var(--warning)" }}>${Math.round(Math.max(quoteTotal - quoteAmountPaid, 0)).toLocaleString()}</span>
                          : <span style={{ color: "var(--muted)" }}>Sin abono</span>
                        }
                      </div>
                    </div>
                  </>
                )}
              </WorkbenchSection>
            </>
          }
        >
        <WorkbenchSection title="Cliente y contexto" className="ti-pricing-context-section">
          <div className="ti-pricing-context-summary">
            <div className="ti-pricing-context-summary__main">
              <div className="ti-pricing-context-summary__row">
                <span className="ti-pricing-context-summary__label">Cliente</span>
                <strong>{selectedCustomer?.fullName ?? "Sin cliente seleccionado"}</strong>
                {selectedCustomer?.rut ? <span className="ti-pricing-context-summary__meta">RUT {selectedCustomer.rut}</span> : null}
              </div>
              <div className="ti-pricing-context-summary__row">
                <span className="ti-pricing-context-summary__label">Visible</span>
                <span>{quoteCustomerName || "Sin nombre visible"}</span>
                <span className="ti-pricing-context-summary__meta">Ref. {quoteCustomerReference || "Sin referencia"}</span>
              </div>
              {customerDiscountInfo.text ? (
                <div className="ti-pricing-context-summary__discount">{customerDiscountInfo.text}</div>
              ) : null}
            </div>
            <Button variant="secondary" onClick={() => setCustomerContextOpen(true)}>
              {selectedCustomer ? "Cambiar" : "Seleccionar cliente"}
            </Button>
          </div>

          <div className="ti-meta-form-grid ti-pricing-context-grid ti-pricing-context-grid--compact">
            <label className="ti-form-span-3">
              <span className="ti-field-label">Lista de precios</span>
              {loadingSelectors ? (
                <div className="ti-field-note"><Spinner size="sm" /> Cargando opciones...</div>
              ) : (
                <Select value={selectedPriceListName} onChange={(e) => onSelectedPriceListNameChange(e.target.value)}>
                  <option value="">Selecciona lista</option>
                  {priceListOptions.map((pl) => (
                    <option key={pl.name} value={pl.name}>
                      {pl.name}
                    </option>
                  ))}
                </Select>
              )}
            </label>
            <label>
              <span className="ti-field-label">Recargo comercial %</span>
              <Input
                type="number"
                value={commercialAdjustmentPct || ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onCommercialAdjustmentPctChange(!isNaN(v) && v >= 0 && v <= 100 ? v : 0);
                }}
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
              />
            </label>
            <label>
              <span className="ti-field-label">Instalación</span>
              <Input
                type="number"
                value={installationAmount || ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onInstallationAmountChange(!isNaN(v) && v >= 0 ? v : 0);
                }}
                min="0"
                placeholder="0"
              />
            </label>
            <label>
              <span className="ti-field-label">Desc. manual %</span>
              <Input
                type="number"
                value={quoteManualDiscountPct}
                onChange={(e) => onQuoteManualDiscountPctChange(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </label>
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          title="Lineas de cotizacion"
          className="ti-lines-section"
          actions={
            <>
              <Button variant="secondary" onClick={onAddQuoteItem} className="ti-pricing-lines-action">
                + Nueva linea
              </Button>
              <Button
                variant="primary"
                className="ti-pricing-lines-action"
                onClick={onCalculateAll}
                disabled={loadingBatch || !selectedPriceListName}
                title="Calcula todos los ítems en una sola operación"
              >
                {loadingBatch ? <Spinner size="sm" /> : "Calcular todo"}
              </Button>
            </>
          }
        >
          <DataTable className="ti-pricing-lines-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Producto</th>
                <th>Agrupador</th>
                <th>Cant.</th>
                <th>Medida</th>
                <th>Unit.</th>
                <th>Total</th>
                <th>Est.</th>
                <th>Acc.</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, idx) => (
                <Fragment key={item.id}>
                  <tr
                    className={activeQuoteItemId === item.id ? "ti-row-selected" : undefined}
                    onClick={() => onSelectQuoteItem(item.id)}
                  >
                    <td>
                      <div className="ti-pricing-line-order">
                        <button
                          className="ti-pricing-line-order__btn"
                          onClick={(e) => { e.stopPropagation(); onMoveItemUp(item.id); }}
                          disabled={idx === 0}
                          title="Subir"
                        >
                          ▲
                        </button>
                        <span className="ti-pricing-line-order__index">{idx + 1}</span>
                        <button
                          className="ti-pricing-line-order__btn"
                          onClick={(e) => { e.stopPropagation(); onMoveItemDown(item.id); }}
                          disabled={idx === quoteItems.length - 1}
                          title="Bajar"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="ti-quote-line-sku">
                        <Select
                          className="ti-pricing-line-sku-select"
                          value={item.skuCode ?? ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateQuoteItem(item.id, { skuCode: e.target.value, calcStatus: undefined })}
                        >
                          <option value="">Selecciona SKU</option>
                          {skuOptions.map((sku) => (
                            <option key={sku.code} value={sku.code}>
                              {sku.code}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                    <td>
                      <Input
                        value={item.roomAreaName ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateQuoteItem(item.id, { roomAreaName: e.target.value })}
                        placeholder="Ej: Living, Dormitorio"
                        style={{ width: "132px", fontSize: "0.8em" }}
                        list="agrupador-suggestions"
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={item.quantity}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateQuoteItem(item.id, { quantity: e.target.value })}
                        min="1"
                        style={{ width: "64px" }}
                      />
                    </td>
                    <td>
                      <div className="ti-quote-line-size">
                        <Input
                          className="ti-pricing-line-dimension-input"
                          type="number"
                          value={item.widthM}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateQuoteItem(item.id, { widthM: e.target.value })}
                          step="0.1"
                          min="0"
                          style={{ width: "72px" }}
                        />
                        <Input
                          className="ti-pricing-line-dimension-input"
                          type="number"
                          value={item.heightM}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateQuoteItem(item.id, { heightM: e.target.value })}
                          step="0.1"
                          min="0"
                          style={{ width: "72px" }}
                        />
                      </div>
                    </td>
                    <td>{item.unitPrice ? `$${item.unitPrice.toLocaleString()}` : "—"}</td>
                    <td>{item.subtotal ? `$${item.subtotal.toLocaleString()}` : "—"}</td>
                    <td>
                      <span
                        className={`ti-quote-status ${
                          item.calcStatus === "ok" ? "ti-quote-status--ok" : item.calcStatus === "error" ? "ti-quote-status--error" : ""
                        }`.trim()}
                        title={item.calcError}
                      >
                        <span className="ti-quote-status__dot" />
                        <span>
                          {item.calcStatus === "ok"
                            ? "OK"
                            : item.calcStatus === "error"
                              ? "Error"
                              : item.calcStatus === "pending"
                                ? "Pendiente"
                                : "Cotización"}
                        </span>
                      </span>
                    </td>
                    <td className="ti-pricing-lines-actions-cell">
                      <div className="actions-cell">
                        <Button
                          variant="secondary"
                          className="ti-icon-button"
                          onClick={(e) => { e.stopPropagation(); onDuplicateQuoteItem(item.id); }}
                          title="Duplicar línea"
                          aria-label="Duplicar línea"
                        >
                          <QuoteRowIcon kind="duplicate" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="ti-icon-button"
                          onClick={(e) => { e.stopPropagation(); onCalculateItem(item.id); }}
                          disabled={loadingActionId === item.id}
                          title="Calcular linea"
                          aria-label="Calcular linea"
                        >
                          {loadingActionId === item.id ? <Spinner size="sm" /> : <QuoteRowIcon kind="calculate" />}
                        </Button>
                        {quoteItems.length > 1 ? (
                          <Button
                            variant="secondary"
                            className="ti-icon-button ti-icon-button--danger"
                            onClick={(e) => { e.stopPropagation(); onRemoveQuoteItem(item.id); }}
                            title="Quitar linea"
                            aria-label="Quitar linea"
                          >
                            <QuoteRowIcon kind="remove" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {item.calcStatus === "error" && item.calcError ? (
                    <tr className="ti-pricing-line-error-row">
                      <td colSpan={9}>
                        <div className="ti-field-note ti-pricing-line-error" style={{ color: "var(--danger)" }}>
                          {item.calcError}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </DataTable>
          <datalist id="agrupador-suggestions">
            {[...new Set(quoteItems.map((i) => i.roomAreaName).filter(Boolean))].map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </WorkbenchSection>

        </WorkbenchLayout>

        <ActionFooter
          className="ti-pricing-footer"
          left={
            <Button variant="secondary" onClick={() => {
              if (quoteBatchId) {
                if (!confirm("Vas a descartar los cambios del borrador. ¿Continuar?")) return;
              }
              onResetQuoteWorkbench();
            }}>
              {quoteBatchId ? "Nuevo" : "Reiniciar"}
            </Button>
          }
          summary={
            <div className="ti-pricing-footer-summary">
              <span className="ti-pricing-footer-summary__meta">{selectedPriceListName || "Sin lista"}</span>
              <span className="ti-pricing-footer-summary__meta">({quoteItems.length} lineas)</span>
              <span className="ti-pricing-footer-summary__metric">Total <strong>${quoteTotal.toLocaleString()}</strong></span>
            </div>
          }
          actions={
            <>
              <Button
                variant="secondary"
                onClick={onSaveToHistory}
                disabled={loadingSave || loadingBatch || !selectedPriceListName || !quoteReady}
                title="Guarda la cotización en el historial sin crear venta"
              >
                {loadingSave ? <><Spinner size="sm" /> Guardando...</> : quoteBatchId ? "Guardar cambios" : "Guardar cotización"}
              </Button>
              <Button
                variant="secondary"
                onClick={onShowBreakdown}
                disabled={!quoteReady}
                title="Ver desglose interno de la cotizacion"
              >
                Ver desglose
              </Button>
              <Button
                variant="secondary"
                onClick={onPreviewCustomer}
                disabled={loadingPreview || !selectedPriceListName || !quoteReady}
                title="Vista previa para el cliente"
              >
                {loadingPreview ? <Spinner size="sm" /> : "Generar PDF"}
              </Button>
              <Button
                variant="primary"
                onClick={onCreateDraftFromQuote}
                disabled={loadingCreateDraft || !selectedPriceListName || !quoteReady || quoteDirty}
                title={quoteDirty ? "Guarda la cotización antes de crear la venta" : "Crea la venta con todos los ítems calculados"}
              >
                {loadingCreateDraft ? <Spinner size="sm" /> : "Crear venta"}
              </Button>
            </>
          }
        />
      </article>

      <QuoteScrapOpportunityDialog
        open={quoteOpportunityOpen}
        loading={loadingActionId === "quote-opportunity"}
        status={quoteItemMatchesStatus}
        recoveredValue={quoteOpportunitySummary.recoveredValue}
        orderCoveragePct={quoteOpportunitySummary.orderCoveragePct}
        linesWithOpportunity={quoteOpportunitySummary.lines}
        items={quoteItemMatches}
        onClose={onCloseQuoteOpportunity}
      />

      <Dialog open={customerContextOpen} onClose={() => setCustomerContextOpen(false)} title="Cliente y contexto">
        <div className="ti-meta-form-grid">
          <label className="ti-form-span-2">
            <span className="ti-field-label">Cliente / Empresa</span>
            <Select value={quoteCustomerId} onChange={(e) => onApplyQuoteCustomerSelection(e.target.value)}>
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.code} - {customer.fullName}{customer.rut ? ` (${customer.rut})` : ""}
                </option>
              ))}
            </Select>
            {selectedCustomer?.rut ? <span className="ti-field-note">RUT: {selectedCustomer.rut}</span> : null}
            {customerDiscountInfo.text ? (
              <span className="ti-field-note" style={{ color: "var(--color-accent)", fontWeight: 500 }}>
                {customerDiscountInfo.text}
              </span>
            ) : null}
          </label>
          <label className="ti-form-span-2">
            <span className="ti-field-label">Cliente visible</span>
            <Input
              value={quoteCustomerName}
              onChange={(e) => onQuoteCustomerNameChange(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </label>
          <label className="ti-form-span-2">
            <span className="ti-field-label">Referencia del proyecto</span>
            <Input
              value={quoteCustomerReference}
              onChange={(e) => onQuoteCustomerReferenceChange(e.target.value)}
              placeholder="Obra / referencia"
            />
          </label>
        </div>
      </Dialog>
    </>
  );
}
