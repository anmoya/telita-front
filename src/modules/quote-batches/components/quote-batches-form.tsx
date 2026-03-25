"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { ModalActions } from "../../../shared/ui/primitives/modal-actions";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import { formatLocalDateTime } from "../../../shared/time/date-service";
import { createApiClient } from "../../../shared/api/client";
import { useQueryResource } from "../../../shared/hooks/use-query-resource";
import { useMutationAction } from "../../../shared/hooks/use-mutation-action";

type MenuKey = "dashboard" | "pricing" | "sales" | "cuts" | "scraps" | "labels" | "audit" | "settings" | "historial-cotizaciones";

type BatchLine = {
  id: string;
  skuCode: string;
  skuName: string;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  priceMethod: string;
  categoryId: string | null;
  categoryName: string | null;
  lineNote: string | null;
  displayOrder: number;
};

type QuoteBatch = {
  id: string;
  quoteNumber: number;
  quoteCode: string | null;
  status: "DRAFT" | "FINALIZED" | "EXPIRED" | "CANCELED";
  priceListName: string;
  customerId: string | null;
  customerName: string | null;
  customerReference: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  amountPaidPct: number;
  createdAt: string;
  createdBy: string;
  lines: BatchLine[];
};

type Props = {
  accessToken: string;
  apiUrl: string;
  onNavigate: (menu: MenuKey) => void;
  onEditBatch?: (batchId: string) => void;
};

type PagedQuoteBatches = {
  data: QuoteBatch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function QuoteBatchesForm({ accessToken, apiUrl, onNavigate, onEditBatch }: Props) {
  const [status, setStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterReference, setFilterReference] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const [detailBatch, setDetailBatch] = useState<QuoteBatch | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const api = useMemo(() => createApiClient(apiUrl, accessToken), [apiUrl, accessToken]);

  const {
    data: batchesData,
    loading,
    error: queryError,
    refetch: refetchBatches
  } = useQueryResource<PagedQuoteBatches>(
    async () => {
      const params = new URLSearchParams({ branchCode: "MAIN" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterCustomer) params.set("customerName", filterCustomer);
      if (filterReference) params.set("customerReference", filterReference);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      params.set("page", String(page));
      params.set("limit", "8");
      return api.get<PagedQuoteBatches>(`/quotes/batch?${params}`);
    },
    [api, filterStatus, filterCustomer, filterReference, filterFrom, filterTo, page]
  );

  const batches = batchesData?.data ?? [];
  const totalBatches = batchesData?.total ?? 0;
  const pageCount = Math.max(1, batchesData?.totalPages ?? 1);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterCustomer, filterReference, filterFrom, filterTo]);

  useEffect(() => {
    if (batches.length === 0) {
      setSelectedBatchId(null);
      return;
    }
    if (!selectedBatchId || !batches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const duplicateMutation = useMutationAction(async (id: string) =>
    api.post<{ id?: string; quoteCode?: string | null }>(`/quotes/batch/${id}/duplicate`, {})
  );

  const cancelMutation = useMutationAction(async (id: string) =>
    api.post(`/quotes/batch/${id}/cancel`, {})
  );

  async function handleDuplicate(id: string) {
    setLoadingActionId(`dup-${id}`);
    try {
      const data = await duplicateMutation.run(id);
      setStatus(`Cotización duplicada: ${data.quoteCode ?? data.id?.slice(0, 8) ?? "?"}`);
      await refetchBatches();
    } catch {
      setStatus("Error al duplicar");
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("¿Anular esta cotización? No podrá editarse ni convertirse en venta.")) return;
    setLoadingActionId(`fin-${id}`);
    try {
      await cancelMutation.run(id);
      setStatus("Cotización anulada.");
      await refetchBatches();
    } catch {
      setStatus("Error al anular");
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCreateDraft(batch: QuoteBatch) {
    setLoadingActionId(`sale-${batch.id}`);
    try {
      const data = await api.post<{ quoteCode?: string; message?: string }>(
        "/sales/from-quote",
        {
          quoteBatchId: batch.id,
          branchCode: "MAIN",
          priceListName: batch.priceListName,
          customerId: batch.customerId ?? undefined,
          customerName: batch.customerName ?? undefined,
          customerReference: batch.customerReference ?? undefined,
          amountPaid: batch.amountPaid > 0 ? batch.amountPaid : undefined,
          items: batch.lines.map((l) => ({
            skuCode: l.skuCode,
            requestedWidthM: l.requestedWidthM,
            requestedHeightM: l.requestedHeightM,
            quantity: l.quantity,
            categoryId: l.categoryId ?? undefined,
            lineNote: l.lineNote ?? undefined,
            displayOrder: l.displayOrder
          }))
        }
      );
      // Finalizar la cotización tras crear venta
      if (batch.status === "DRAFT") {
        void api.post(`/quotes/batch/${batch.id}/finalize`, {});
      }
      setStatus(`Venta creada: ${data.quoteCode ?? "?"}`);
      onNavigate("sales");
    } catch {
      setStatus("Error al crear venta");
    } finally {
      setLoadingActionId(null);
    }
  }

  function openDetail(batch: QuoteBatch) {
    setDetailBatch(batch);
    setDetailOpen(true);
  }

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? null;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: "Borrador",
      FINALIZED: "Finalizada",
      EXPIRED: "Expirada",
      CANCELED: "Anulada"
    };
    return map[s] ?? s;
  };

  return (
    <article className="flow-card ti-quote-batches-shell">
      <WorkbenchLayout
        className="ti-workbench--quote-batches"
        aside={
          <>
            <WorkbenchSection title="Cotización seleccionada">
              {selectedBatch ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Cotización</span>
                      <strong>{selectedBatch.quoteCode ?? selectedBatch.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Estado</span>
                      <StatusPill tone={selectedBatch.status === "FINALIZED" ? "success" : selectedBatch.status === "EXPIRED" || selectedBatch.status === "CANCELED" ? "neutral" : "draft"}>
                        {statusBadge(selectedBatch.status)}
                      </StatusPill>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Cliente</span>
                      <strong>{selectedBatch.customerName ?? "Sin cliente"}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Lista</span>
                      <strong>{selectedBatch.priceListName}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Líneas</span>
                      <strong>{selectedBatch.lines.length}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Total</span>
                      <strong>${Math.round(selectedBatch.totalAmount).toLocaleString()}</strong>
                    </div>
                    {selectedBatch.amountPaid > 0 ? (
                      <>
                        <div className="ti-sales-summary__row">
                          <span>Abonado</span>
                          <strong>${Math.round(selectedBatch.amountPaid).toLocaleString()} ({selectedBatch.amountPaidPct}%)</strong>
                        </div>
                        <div className="ti-sales-summary__row">
                          <span>Saldo</span>
                          <strong style={{ color: "var(--warning)" }}>${Math.round(selectedBatch.balanceDue).toLocaleString()}</strong>
                        </div>
                      </>
                    ) : null}
                    <div className="ti-sales-summary__row">
                      <span>Creada</span>
                      <strong>{formatLocalDateTime(selectedBatch.createdAt)}</strong>
                    </div>
                  </div>

                  <div className="ti-section__actions">
                    {selectedBatch.status === "DRAFT" && onEditBatch ? (
                      <Button variant="primary" onClick={() => onEditBatch(selectedBatch.id)}>
                        Editar
                      </Button>
                    ) : null}
                    <Button variant="secondary" onClick={() => openDetail(selectedBatch)}>
                      Ver detalle
                    </Button>
                    {selectedBatch.status === "DRAFT" ? (
                      <>
                        <Button variant="secondary" onClick={() => void handleDuplicate(selectedBatch.id)} disabled={loadingActionId === `dup-${selectedBatch.id}`}>
                          {loadingActionId === `dup-${selectedBatch.id}` ? <><Spinner size="sm" /> Duplicando...</> : "Duplicar"}
                        </Button>
                        <Button variant="secondary" onClick={() => void handleCancel(selectedBatch.id)} disabled={loadingActionId === `fin-${selectedBatch.id}`}>
                          {loadingActionId === `fin-${selectedBatch.id}` ? <><Spinner size="sm" /> Anulando...</> : "Anular"}
                        </Button>
                        <Button variant="primary" onClick={() => void handleCreateDraft(selectedBatch)} disabled={loadingActionId === `sale-${selectedBatch.id}`}>
                          {loadingActionId === `sale-${selectedBatch.id}` ? <><Spinner size="sm" /> Creando venta...</> : "Crear venta"}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Sin cotización seleccionada"
                  description="Selecciona una fila del historial para revisar su resumen y operar sobre ella."
                />
              )}
            </WorkbenchSection>
          </>
        }
      >
        <WorkbenchSection
          title={`Historial de cotizaciones (${totalBatches})`}
          className="ti-quote-batches-list-section"
          actions={null}
        >
          {status ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{status}</p> : null}
          {queryError ? <p className="status-note" style={{ color: "var(--danger)", margin: "0 0 0.75rem" }}>{queryError}</p> : null}

          <div className="ti-qb-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <Button variant={filterStatus === "" ? "primary" : "secondary"} onClick={() => setFilterStatus("")}>Todas</Button>
              <Button variant={filterStatus === "DRAFT" ? "primary" : "secondary"} onClick={() => setFilterStatus("DRAFT")}>Borrador</Button>
              <Button variant={filterStatus === "CANCELED" ? "primary" : "secondary"} onClick={() => setFilterStatus("CANCELED")}>Anulada</Button>
              <Button variant={filterStatus === "EXPIRED" ? "primary" : "secondary"} onClick={() => setFilterStatus("EXPIRED")}>Expirada</Button>
            </div>
            <Input
              placeholder="Cliente"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              style={{ maxWidth: "10rem" }}
            />
            <Input
              placeholder="Referencia"
              value={filterReference}
              onChange={(e) => setFilterReference(e.target.value)}
              style={{ maxWidth: "10rem" }}
            />
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              title="Desde"
              style={{ maxWidth: "9rem" }}
            />
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              title="Hasta"
              style={{ maxWidth: "9rem" }}
            />
            <Button variant="secondary" onClick={() => void refetchBatches()} disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Buscar"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterStatus("");
                setFilterCustomer("");
                setFilterReference("");
                setFilterFrom("");
                setFilterTo("");
              }}
            >
              Limpiar
            </Button>
          </div>

          <div className="ti-quote-batches-list-region">
            {batches.length === 0 && !loading ? (
              <EmptyState title="Sin cotizaciones en el historial." description="Ajusta filtros o genera nuevas cotizaciones para poblar esta vista." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cotización</th>
                    <th>Cliente</th>
                    <th>Lista</th>
                    <th>Líneas</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      className={batch.id === selectedBatchId ? "ti-row-selected" : undefined}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedBatchId(batch.id)}
                    >
                      <td style={{ fontSize: "0.82em" }}>{formatLocalDateTime(batch.createdAt)}</td>
                      <td
                        style={{
                          fontSize: "0.82em",
                          fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                          letterSpacing: "0.08em"
                        }}
                        title={batch.id}
                      >
                        {batch.quoteCode ?? batch.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td>{batch.customerName ?? "—"}</td>
                      <td style={{ fontSize: "0.82em" }}>{batch.priceListName}</td>
                      <td>{batch.lines.length}</td>
                      <td>${Math.round(batch.totalAmount).toLocaleString()}</td>
                      <td>
                        <StatusPill tone={batch.status === "FINALIZED" ? "success" : batch.status === "EXPIRED" || batch.status === "CANCELED" ? "neutral" : "draft"}>
                          {statusBadge(batch.status)}
                        </StatusPill>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {batch.status === "DRAFT" && onEditBatch ? (
                            <button
                              type="button"
                              className="t-btn t-btn-secondary ti-icon-button"
                              title="Editar"
                              aria-label="Editar"
                              onClick={(event) => {
                                event.stopPropagation();
                                onEditBatch(batch.id);
                              }}
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M11.5 2.5a2 2 0 0 1 2.83 2.83L5.75 13.9 2 15l1.1-3.75Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="t-btn t-btn-secondary ti-icon-button"
                            title="Ver"
                            aria-label="Ver"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedBatchId(batch.id);
                              openDetail(batch);
                            }}
                          >
                            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>
                          </button>
                          {batch.status === "DRAFT" ? (
                            <>
                              <button
                                type="button"
                                className="t-btn t-btn-secondary ti-icon-button"
                                title="Duplicar"
                                aria-label="Duplicar"
                                disabled={loadingActionId === `dup-${batch.id}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedBatchId(batch.id);
                                  void handleDuplicate(batch.id);
                                }}
                              >
                                {loadingActionId === `dup-${batch.id}` ? <Spinner size="sm" /> : <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M3 10.5c-.7 0-1.2-.5-1.2-1.2v-6c0-.7.5-1.2 1.2-1.2h6c.7 0 1.2.5 1.2 1.2" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>}
                              </button>
                              <button
                                type="button"
                                className="t-btn t-btn-secondary ti-icon-button"
                                title="Anular"
                                aria-label="Anular"
                                disabled={loadingActionId === `fin-${batch.id}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedBatchId(batch.id);
                                  void handleCancel(batch.id);
                                }}
                              >
                                {loadingActionId === `fin-${batch.id}` ? <Spinner size="sm" /> : <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                              </button>
                              <button
                                type="button"
                                className="t-btn t-btn-primary ti-icon-button ti-icon-button--accent"
                                title="Crear venta"
                                aria-label="Crear venta"
                                disabled={loadingActionId === `sale-${batch.id}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedBatchId(batch.id);
                                  void handleCreateDraft(batch);
                                }}
                              >
                                {loadingActionId === `sale-${batch.id}` ? <Spinner size="sm" /> : <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8h9M8 3.5v9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </div>
        </WorkbenchSection>
      </WorkbenchLayout>

      <ActionFooter
        left={<span className="ti-sales-footer-note">Historial persistido para duplicar, anular o convertir cotizaciones en venta.</span>}
        summary={(
          <div className="ti-pricing-footer-summary">
            <span className="ti-pricing-footer-summary__meta">Página {page} de {pageCount}</span>
            <span className="ti-pricing-footer-summary__meta">{totalBatches} cotización(es)</span>
            {selectedBatch ? <span className="ti-pricing-footer-summary__meta">Seleccionada: {selectedBatch.quoteCode ?? selectedBatch.id.slice(0, 8).toUpperCase()}</span> : null}
          </div>
        )}
        actions={(
          <>
            <Button variant="secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1 || loading}>
              {loading ? <Spinner size="sm" /> : "Anterior"}
            </Button>
            <Button variant="secondary" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount || loading}>
              {loading ? <Spinner size="sm" /> : "Siguiente"}
            </Button>
          </>
        )}
      />

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle cotización">
        {detailBatch ? (
          <>
            <div className="card" style={{ marginBottom: "0.75rem", fontSize: "0.9em", lineHeight: "1.7" }}>
              <div>Cotización: <strong>{detailBatch.quoteCode ?? detailBatch.id.slice(0, 8).toUpperCase()}</strong></div>
              <div>Cliente: <strong>{detailBatch.customerName ?? "Sin cliente"}</strong></div>
              <div>Lista: <strong>{detailBatch.priceListName}</strong></div>
              {detailBatch.customerReference ? <div>Referencia: <strong>{detailBatch.customerReference}</strong></div> : null}
              <div>Estado: <strong>{statusBadge(detailBatch.status)}</strong></div>
              <div>Creado: <strong>{formatLocalDateTime(detailBatch.createdAt)}</strong></div>
              <div>Por: <strong>{detailBatch.createdBy}</strong></div>
            </div>

            <DataTable style={{ fontSize: "0.85em" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Medida</th>
                  <th>Cant.</th>
                  <th>Precio unit.</th>
                  <th>Subtotal</th>
                  <th>Categoría</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {detailBatch.lines.map((l, i) => (
                  <tr key={l.id}>
                    <td>{i + 1}</td>
                    <td>{l.skuCode}</td>
                    <td>{l.requestedWidthM} × {l.requestedHeightM}</td>
                    <td>{l.quantity}</td>
                    <td>${l.unitPrice.toLocaleString()}</td>
                    <td>${l.lineSubtotal.toLocaleString()}</td>
                    <td>{l.categoryName ?? "—"}</td>
                    <td style={{ color: "var(--muted)", fontSize: "0.88em" }}>{l.lineNote ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            <div className="card" style={{ marginTop: "0.75rem", fontSize: "0.9em", lineHeight: "1.8" }}>
              <div>Subtotal: <strong>${detailBatch.subtotalAmount.toLocaleString()}</strong></div>
              <div>IVA (19%): <strong>${Math.round(detailBatch.taxAmount).toLocaleString()}</strong></div>
              <div>Total: <strong>${Math.round(detailBatch.totalAmount).toLocaleString()} CLP</strong></div>
              {detailBatch.amountPaid > 0 ? (
                <>
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.25rem", paddingTop: "0.25rem" }}>
                    Abonado: <strong>${Math.round(detailBatch.amountPaid).toLocaleString()}</strong>
                    <span style={{ color: "var(--muted)", marginLeft: "0.25rem" }}>({detailBatch.amountPaidPct}%)</span>
                  </div>
                  <div>Saldo: <strong style={{ color: "var(--warning)" }}>${Math.round(detailBatch.balanceDue).toLocaleString()}</strong></div>
                </>
              ) : null}
            </div>

            {detailBatch.status === "DRAFT" ? (
              <ModalActions style={{ marginTop: "1rem", justifyContent: "flex-start" }}>
                <Button variant="primary" disabled={loadingActionId === `sale-${detailBatch.id}`} onClick={() => { setDetailOpen(false); void handleCreateDraft(detailBatch); }}>
                  {loadingActionId === `sale-${detailBatch.id}` ? <><Spinner size="sm" /> Creando venta...</> : "Crear Venta"}
                </Button>
                <Button variant="secondary" disabled={loadingActionId === `dup-${detailBatch.id}`} onClick={() => { setDetailOpen(false); void handleDuplicate(detailBatch.id); }}>
                  {loadingActionId === `dup-${detailBatch.id}` ? <><Spinner size="sm" /> Duplicando...</> : "Duplicar"}
                </Button>
              </ModalActions>
            ) : null}
          </>
        ) : null}
      </Dialog>
    </article>
  );
}
