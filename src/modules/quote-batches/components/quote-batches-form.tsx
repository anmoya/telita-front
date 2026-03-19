"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
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
  status: "DRAFT" | "FINALIZED" | "EXPIRED";
  priceListName: string;
  customerName: string | null;
  customerReference: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  createdBy: string;
  lines: BatchLine[];
};

type Props = {
  accessToken: string;
  apiUrl: string;
  onNavigate: (menu: MenuKey) => void;
};

type PagedQuoteBatches = {
  data: QuoteBatch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function QuoteBatchesForm({ accessToken, apiUrl, onNavigate }: Props) {
  const [status, setStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [page, setPage] = useState(1);

  const [detailBatch, setDetailBatch] = useState<QuoteBatch | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

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
      params.set("page", String(page));
      params.set("limit", "8");
      return api.get<PagedQuoteBatches>(`/quotes/batch?${params}`);
    },
    [api, filterStatus, filterCustomer, page]
  );

  const batches = batchesData?.data ?? [];
  const totalBatches = batchesData?.total ?? 0;
  const pageCount = Math.max(1, batchesData?.totalPages ?? 1);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterCustomer]);

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
    api.post<{ id?: string }>(`/quotes/batch/${id}/duplicate`, {})
  );

  const finalizeMutation = useMutationAction(async (id: string) =>
    api.post(`/quotes/batch/${id}/finalize`, {})
  );

  async function handleDuplicate(id: string) {
    try {
      const data = await duplicateMutation.run(id);
      setStatus(`Cotización duplicada: ${data.id?.slice(0, 8) ?? "?"}`);
      await refetchBatches();
    } catch {
      setStatus("Error al duplicar");
    }
  }

  async function handleFinalize(id: string) {
    if (!confirm("¿Finalizar esta cotización? No podrá editarse.")) return;
    try {
      await finalizeMutation.run(id);
      setStatus("Cotización finalizada.");
      await refetchBatches();
    } catch {
      setStatus("Error al finalizar");
    }
  }

  async function handleCreateDraft(batch: QuoteBatch) {
    try {
      const data = await api.post<{ quoteCode?: string; message?: string }>(
        "/sales/from-quote",
        {
          branchCode: "MAIN",
          priceListName: batch.priceListName,
          customerName: batch.customerName ?? undefined,
          customerReference: batch.customerReference ?? undefined,
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
      setStatus(`Draft creado: ${data.quoteCode ?? "?"}`);
      onNavigate("sales");
    } catch {
      setStatus("Error al crear draft");
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
      EXPIRED: "Expirada"
    };
    return map[s] ?? s;
  };

  return (
    <article className="flow-card ti-quote-batches-shell">
      <WorkbenchLayout
        className="ti-workbench--quote-batches"
        aside={
          <>
            <WorkbenchSection title="Filtros">
              <div style={{ display: "grid", gap: "0.9rem" }}>
                <label className="field">
                  <span>Estado</span>
                  <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="DRAFT">Borrador</option>
                    <option value="FINALIZED">Finalizada</option>
                    <option value="EXPIRED">Expirada</option>
                  </Select>
                </label>
                <label className="field">
                  <span>Cliente</span>
                  <Input
                    placeholder="Nombre o referencia"
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                  />
                </label>
                <div className="ti-section__actions">
                  <Button variant="secondary" onClick={() => void refetchBatches()} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : "Refrescar"}
                  </Button>
                </div>
              </div>
            </WorkbenchSection>

            <WorkbenchSection title="Cotización seleccionada">
              {selectedBatch ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Cotización</span>
                      <strong>{selectedBatch.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Estado</span>
                      <StatusPill tone={selectedBatch.status === "FINALIZED" ? "success" : selectedBatch.status === "EXPIRED" ? "neutral" : "draft"}>
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
                    <div className="ti-sales-summary__row">
                      <span>Creada</span>
                      <strong>{formatLocalDateTime(selectedBatch.createdAt)}</strong>
                    </div>
                  </div>

                  <div className="ti-section__actions">
                    <Button variant="secondary" onClick={() => openDetail(selectedBatch)}>
                      Ver detalle
                    </Button>
                    <Button variant="secondary" onClick={() => void handleDuplicate(selectedBatch.id)}>
                      Duplicar
                    </Button>
                    {selectedBatch.status === "DRAFT" ? (
                      <Button variant="secondary" onClick={() => void handleFinalize(selectedBatch.id)}>
                        Finalizar
                      </Button>
                    ) : null}
                    <Button variant="primary" onClick={() => void handleCreateDraft(selectedBatch)}>
                      Crear venta draft
                    </Button>
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
          title="Historial de cotizaciones"
          className="ti-quote-batches-list-section"
          actions={(
            <>
              <Button variant={filterStatus === "" ? "primary" : "secondary"} onClick={() => setFilterStatus("")}>
                Todas
              </Button>
              <Button variant={filterStatus === "DRAFT" ? "primary" : "secondary"} onClick={() => setFilterStatus("DRAFT")}>
                Borrador
              </Button>
              <Button variant={filterStatus === "FINALIZED" ? "primary" : "secondary"} onClick={() => setFilterStatus("FINALIZED")}>
                Finalizada
              </Button>
              <Button variant={filterStatus === "EXPIRED" ? "primary" : "secondary"} onClick={() => setFilterStatus("EXPIRED")}>
                Expirada
              </Button>
            </>
          )}
        >
          {status ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{status}</p> : null}
          {queryError ? <p className="status-note" style={{ color: "var(--danger)", margin: "0 0 0.75rem" }}>{queryError}</p> : null}

          <div className="ti-quote-batches-list-region">
            {batches.length === 0 && !loading ? (
              <EmptyState title="Sin cotizaciones en el historial." description="Ajusta filtros o genera nuevas cotizaciones para poblar esta vista." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Fecha</th>
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
                      <td>{batch.customerName ?? "—"}</td>
                      <td style={{ fontSize: "0.82em" }}>{batch.priceListName}</td>
                      <td>{batch.lines.length}</td>
                      <td>${Math.round(batch.totalAmount).toLocaleString()}</td>
                      <td>
                        <StatusPill tone={batch.status === "FINALIZED" ? "success" : batch.status === "EXPIRED" ? "neutral" : "draft"}>
                          {statusBadge(batch.status)}
                        </StatusPill>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <Button
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedBatchId(batch.id);
                              openDetail(batch);
                            }}
                          >
                            Ver
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedBatchId(batch.id);
                              void handleDuplicate(batch.id);
                            }}
                          >
                            Duplicar
                          </Button>
                          <Button
                            variant="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedBatchId(batch.id);
                              void handleCreateDraft(batch);
                            }}
                          >
                            Crear draft
                          </Button>
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
        left={<span className="ti-sales-footer-note">Historial persistido para duplicar, finalizar o convertir cotizaciones en venta draft.</span>}
        summary={(
          <div className="ti-pricing-footer-summary">
            <span className="ti-pricing-footer-summary__meta">Página {page} de {pageCount}</span>
            <span className="ti-pricing-footer-summary__meta">{totalBatches} cotización(es)</span>
            {selectedBatch ? <span className="ti-pricing-footer-summary__meta">Seleccionada: {selectedBatch.id.slice(0, 8).toUpperCase()}</span> : null}
          </div>
        )}
        actions={(
          <>
            <Button variant="secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <Button variant="secondary" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount}>
              Siguiente
            </Button>
          </>
        )}
      />

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle cotización">
        {detailBatch ? (
          <>
            <div className="card" style={{ marginBottom: "0.75rem", fontSize: "0.9em", lineHeight: "1.7" }}>
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
            </div>

            <ModalActions style={{ marginTop: "1rem", justifyContent: "flex-start" }}>
              <Button variant="primary" onClick={() => { setDetailOpen(false); void handleCreateDraft(detailBatch); }}>
                Crear Venta Draft
              </Button>
              <Button variant="secondary" onClick={() => { setDetailOpen(false); void handleDuplicate(detailBatch.id); }}>
                Duplicar
              </Button>
            </ModalActions>
          </>
        ) : null}
      </Dialog>
    </article>
  );
}
