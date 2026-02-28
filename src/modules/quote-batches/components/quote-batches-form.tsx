"use client";

import { useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { Badge } from "../../../shared/ui/primitives/badge";
import { Card } from "../../../shared/ui/primitives/card";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { ModalActions } from "../../../shared/ui/primitives/modal-actions";
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

export function QuoteBatchesForm({ accessToken, apiUrl, onNavigate }: Props) {
  const [status, setStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [detailBatch, setDetailBatch] = useState<QuoteBatch | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const api = useMemo(() => createApiClient(apiUrl, accessToken), [apiUrl, accessToken]);

  const {
    data: batchesData,
    loading,
    error: queryError,
    refetch: refetchBatches
  } = useQueryResource<QuoteBatch[]>(
    async () => {
      const params = new URLSearchParams({ branchCode: "MAIN" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterCustomer) params.set("customerName", filterCustomer);
      return api.get<QuoteBatch[]>(`/quotes/batch?${params}`);
    },
    [api, filterStatus, filterCustomer]
  );

  const batches = batchesData ?? [];

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

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: "Borrador",
      FINALIZED: "Finalizada",
      EXPIRED: "Expirada"
    };
    return map[s] ?? s;
  };

  return (
    <article className="flow-card">
      <p className="flow-title">Historial de Cotizaciones</p>

      {/* Filters */}
      <div className="inline-actions" style={{ marginBottom: "0.75rem" }}>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "140px" }}>
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="FINALIZED">Finalizada</option>
          <option value="EXPIRED">Expirada</option>
        </Select>
        <Input
          placeholder="Filtrar por cliente"
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          style={{ width: "200px" }}
        />
        <Button variant="secondary" onClick={() => void refetchBatches()} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Buscar"}
        </Button>
      </div>

      <p className="status-note">{status}</p>
      {queryError ? <p className="status-note" style={{ color: "var(--danger)" }}>{queryError}</p> : null}

      {batches.length === 0 && !loading ? (
        <EmptyState title="Sin cotizaciones en el historial." />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Lista</th>
              <th>Items</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td style={{ fontSize: "0.82em" }}>{formatLocalDateTime(b.createdAt)}</td>
                <td>{b.customerName ?? "—"}</td>
                <td style={{ fontSize: "0.82em" }}>{b.priceListName}</td>
                <td>{b.lines.length}</td>
                <td>${b.totalAmount.toLocaleString()}</td>
                <td>
                  <Badge
                    variant={b.status === "FINALIZED" ? "success" : b.status === "EXPIRED" ? "danger" : "neutral"}
                  >
                    {statusBadge(b.status)}
                  </Badge>
                </td>
                <td>
                  <div className="inline-actions" style={{ gap: "0.25rem" }}>
                    <Button variant="secondary" onClick={() => openDetail(b)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.78em" }}>
                      Ver
                    </Button>
                    <Button variant="secondary" onClick={() => void handleDuplicate(b.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.78em" }}>
                      Duplicar
                    </Button>
                    {b.status === "DRAFT" && (
                      <Button variant="secondary" onClick={() => void handleFinalize(b.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.78em" }}>
                        Finalizar
                      </Button>
                    )}
                    <Button variant="primary" onClick={() => void handleCreateDraft(b)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.78em" }}>
                      Crear Draft
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle cotización">
        {detailBatch ? (
          <>
            <Card style={{ marginBottom: "0.75rem", fontSize: "0.9em", lineHeight: "1.7" }}>
              <div>Cliente: <strong>{detailBatch.customerName ?? "Sin cliente"}</strong></div>
              <div>Lista: <strong>{detailBatch.priceListName}</strong></div>
              {detailBatch.customerReference ? <div>Referencia: <strong>{detailBatch.customerReference}</strong></div> : null}
              <div>Estado: <strong>{statusBadge(detailBatch.status)}</strong></div>
              <div>Creado: <strong>{formatLocalDateTime(detailBatch.createdAt)}</strong></div>
              <div>Por: <strong>{detailBatch.createdBy}</strong></div>
            </Card>

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

            <Card style={{ marginTop: "0.75rem", fontSize: "0.9em", lineHeight: "1.8" }}>
              <div>Subtotal: <strong>${detailBatch.subtotalAmount.toLocaleString()}</strong></div>
              <div>IVA (19%): <strong>${Math.round(detailBatch.taxAmount).toLocaleString()}</strong></div>
              <div>Total: <strong>${Math.round(detailBatch.totalAmount).toLocaleString()} CLP</strong></div>
            </Card>

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
