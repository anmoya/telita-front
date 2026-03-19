"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { TotalsSummary } from "../../../shared/ui/patterns/totals-summary";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import { QuoteScrapOpportunityPanel } from "./quote-scrap-opportunity-panel";
import type { QuoteScrapOpportunityRow } from "./pricing-workbench.types";
import type { CustomerOption, PreviewResult, QuoteItem, QuoteItemCategory } from "./pricing-workbench.shared-types";

function QuoteRowIcon({ kind }: { kind: "calculate" | "remove" }) {
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
  activeQuoteItemSkuCode: string | null;
  activeQuoteItemOpportunityCount: number;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  quoteItemMatchesStatus: string;
  quoteOpportunitySummary: {
    pieces: number;
    lines: number;
    recoveredValue: number;
    orderCoveragePct: number;
  };
  loadingActionId: string | null;
  quoteHasCalcErrors: boolean;
  quoteSubtotal: number;
  operatorMargin: number;
  quoteTax: number;
  quoteTotal: number;
  pricingDocumentStatus: string;
  pricingDocumentTone: "success" | "draft";
  selectedPriceListName: string;
  loadingSelectors: boolean;
  customers: CustomerOption[];
  quoteCustomerId: string;
  quoteCustomerReference: string;
  quoteCustomerName: string;
  priceListOptions: PriceListOption[];
  quoteManualDiscountPct: string;
  quoteManualDiscountReason: string;
  categories: QuoteItemCategory[];
  newCategoryName: string;
  skuOptions: SkuOption[];
  loadingBatch: boolean;
  loadingPreview: boolean;
  loadingCreateDraft: boolean;
  quoteReady: boolean;
  status: string;
  onRefreshQuoteScrapOpportunities: () => void;
  onApplyQuoteCustomerSelection: (selectedId: string) => void;
  onQuoteCustomerReferenceChange: (value: string) => void;
  onQuoteCustomerNameChange: (value: string) => void;
  onSelectedPriceListNameChange: (value: string) => void;
  onOperatorMarginChange: (value: number) => void;
  onQuoteManualDiscountPctChange: (value: string) => void;
  onQuoteManualDiscountReasonChange: (value: string) => void;
  onAddQuoteItem: () => void;
  onCalculateAll: () => void;
  onFetchQuoteItemMatches: (itemId: string) => void;
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
};

export function PricingWorkbench({
  quoteItems,
  activeQuoteItemId,
  activeQuoteItemSkuCode,
  activeQuoteItemOpportunityCount,
  quoteItemMatches,
  quoteItemMatchesStatus,
  quoteOpportunitySummary,
  loadingActionId,
  quoteHasCalcErrors,
  quoteSubtotal,
  operatorMargin,
  quoteTax,
  quoteTotal,
  pricingDocumentStatus,
  pricingDocumentTone,
  selectedPriceListName,
  loadingSelectors,
  customers,
  quoteCustomerId,
  quoteCustomerReference,
  quoteCustomerName,
  priceListOptions,
  quoteManualDiscountPct,
  quoteManualDiscountReason,
  categories,
  newCategoryName,
  skuOptions,
  loadingBatch,
  loadingPreview,
  loadingCreateDraft,
  quoteReady,
  status,
  onRefreshQuoteScrapOpportunities,
  onApplyQuoteCustomerSelection,
  onQuoteCustomerReferenceChange,
  onQuoteCustomerNameChange,
  onSelectedPriceListNameChange,
  onOperatorMarginChange,
  onQuoteManualDiscountPctChange,
  onQuoteManualDiscountReasonChange,
  onAddQuoteItem,
  onCalculateAll,
  onFetchQuoteItemMatches,
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
  onCreateDraftFromQuote
}: PricingWorkbenchProps) {
  return (
    <article className="flow-card ti-pricing-shell" id="section-pricing">
      <WorkbenchLayout
        className="ti-workbench--pricing"
        aside={
          <>
            <QuoteScrapOpportunityPanel
              quoteItemsCount={quoteItems.length}
              activeQuoteItemSkuCode={activeQuoteItemSkuCode}
              activeQuoteItemOpportunityCount={activeQuoteItemOpportunityCount}
              quoteItemMatches={quoteItemMatches}
              quoteItemMatchesStatus={quoteItemMatchesStatus}
              quoteOpportunitySummary={quoteOpportunitySummary}
              loading={Boolean(loadingActionId?.startsWith("quote-match-"))}
              onRefresh={onRefreshQuoteScrapOpportunities}
            />

            <WorkbenchSection title="Totales">
              {quoteHasCalcErrors ? (
                <p className="status-note" style={{ margin: 0, color: "var(--danger)" }}>
                  Total bloqueado: corrige los items con error antes de cerrar la cotizacion.
                </p>
              ) : (
                <TotalsSummary
                  rows={[
                    { label: "Subtotal", value: `$${Math.round(quoteSubtotal).toLocaleString()}` },
                    { label: "Ajuste operador", value: operatorMargin > 0 ? `${operatorMargin}%` : "—", tone: "muted" },
                    { label: "Impuesto (19%)", value: `$${quoteTax.toLocaleString()}` }
                  ]}
                  totalLabel="Total"
                  totalValue={`$${quoteTotal.toLocaleString()}`}
                  note={operatorMargin > 0 ? "Total ajustado con margen operador. No se persiste en BD." : "Totales listos para crear venta draft."}
                />
              )}
            </WorkbenchSection>
          </>
        }
      >
        <WorkbenchSection title="Cliente y contexto">
          <div className="ti-meta-form-grid">
            <label className="ti-form-span-2">
              <span className="ti-field-label">Cliente / Empresa</span>
              <Select value={quoteCustomerId} onChange={(e) => onApplyQuoteCustomerSelection(e.target.value)}>
                <option value="">Seleccionar cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.code} - {customer.fullName}
                  </option>
                ))}
              </Select>
            </label>
            <label className="ti-form-span-2">
              <span className="ti-field-label">Referencia del proyecto</span>
              <Input
                value={quoteCustomerReference}
                onChange={(e) => onQuoteCustomerReferenceChange(e.target.value)}
                placeholder="Obra / referencia"
              />
            </label>
            <label className="ti-form-span-2">
              <span className="ti-field-label">Cliente visible</span>
              <Input
                value={quoteCustomerName}
                onChange={(e) => onQuoteCustomerNameChange(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </label>
            <label>
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
              <span className="ti-field-label">Margen operador %</span>
              <Input
                type="number"
                value={operatorMargin}
                onChange={(e) => onOperatorMarginChange(Math.max(0, Math.min(100, Number(e.target.value))))}
                min="0"
                max="100"
                step="0.1"
              />
              <span className="ti-field-note">Solo vista operador</span>
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
            <label className="ti-form-span-2">
              <span className="ti-field-label">Motivo desc.</span>
              <Input
                value={quoteManualDiscountReason}
                onChange={(e) => onQuoteManualDiscountReasonChange(e.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          title="Lineas de cotizacion"
          className="ti-lines-section"
          actions={
            <>
              <Button variant="secondary" onClick={onAddQuoteItem}>
                + Nueva linea
              </Button>
              <Button
                variant="primary"
                onClick={onCalculateAll}
                disabled={loadingBatch || !selectedPriceListName}
                title="Calcula todos los ítems en una sola operación"
              >
                {loadingBatch ? <Spinner size="sm" /> : "Calcular todo"}
              </Button>
            </>
          }
        >
          <DataTable>
            <thead>
              <tr>
                <th>Orden</th>
                <th>SKU / Producto</th>
                <th>Categoria</th>
                <th>Cantidad</th>
                <th>Ancho / Alto</th>
                <th>P. Unit</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className={activeQuoteItemId === item.id ? "ti-row-selected" : undefined}
                  onClick={() => onFetchQuoteItemMatches(item.id)}
                >
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: "0.75em" }}
                        onClick={(e) => { e.stopPropagation(); onMoveItemUp(item.id); }}
                        disabled={idx === 0}
                        title="Subir"
                      >
                        ▲
                      </button>
                      <span style={{ textAlign: "center", fontSize: "0.8em" }}>{idx + 1}</span>
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: "0.75em" }}
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
                        style={{ width: "170px", fontSize: "0.82em" }}
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
                    <div className="ti-quote-line-description">
                      <Select
                        style={{ width: "148px", fontSize: "0.8em" }}
                        value={item.categoryId || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const cat = categories.find((category) => category.id === e.target.value);
                          onUpdateQuoteItem(item.id, {
                            categoryId: e.target.value || undefined,
                            categoryName: cat?.name ?? undefined
                          });
                        }}
                      >
                        <option value="">Sin categoría</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                        <option value="__new__">+ Nueva...</option>
                      </Select>
                      {item.categoryId === "__new__" ? (
                        <div style={{ display: "flex", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => onNewCategoryNameChange(e.target.value)}
                            placeholder="Nombre"
                            style={{ width: "90px", fontSize: "0.8em" }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onCreateCategoryForItem(item.id, newCategoryName);
                              }
                            }}
                          />
                          <Button variant="secondary" onClick={() => onCreateCategoryForItem(item.id, newCategoryName)}>
                            OK
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={item.quantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateQuoteItem(item.id, { quantity: e.target.value })}
                      min="1"
                      style={{ width: "72px" }}
                    />
                  </td>
                  <td>
                    <div className="ti-quote-line-size">
                      <Input
                        type="number"
                        value={item.widthM}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateQuoteItem(item.id, { widthM: e.target.value })}
                        step="0.1"
                        min="0"
                        style={{ width: "74px" }}
                      />
                      <Input
                        type="number"
                        value={item.heightM}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateQuoteItem(item.id, { heightM: e.target.value })}
                        step="0.1"
                        min="0"
                        style={{ width: "74px" }}
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
                    {item.calcStatus === "error" && item.calcError ? (
                      <div className="ti-field-note" style={{ marginTop: "0.3rem", maxWidth: "180px", color: "var(--danger)" }}>
                        {item.calcError}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div className="actions-cell">
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
              ))}
            </tbody>
          </DataTable>
        </WorkbenchSection>

        {status ? <p className="status-note" style={{ marginTop: 0 }}>{status}</p> : null}

      </WorkbenchLayout>

      <ActionFooter
        className="ti-pricing-footer"
        left={
          <Button variant="secondary" onClick={onResetQuoteWorkbench}>
            Reiniciar
          </Button>
        }
        summary={
          <div className="ti-pricing-footer-summary">
            <StatusPill tone={pricingDocumentTone}>{pricingDocumentStatus}</StatusPill>
            <span className="ti-pricing-footer-summary__meta">{selectedPriceListName || "Sin lista"}</span>
            <span className="ti-pricing-footer-summary__meta">({quoteItems.length} lineas)</span>
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={onSaveToHistory}
              disabled={loadingBatch || !selectedPriceListName || !quoteReady}
              title="Guarda la cotización en el historial sin crear venta"
            >
              Guardar cotización
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
              disabled={loadingCreateDraft || !selectedPriceListName || !quoteReady}
              title="Crea venta draft con todos los ítems calculados"
            >
              {loadingCreateDraft ? <Spinner size="sm" /> : "Crear venta"}
            </Button>
          </>
        }
      />
    </article>
  );
}
