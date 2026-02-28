"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { formatLocalDateTime } from "../../../shared/time/date-service";

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
  const [batches, setBatches] = useState<QuoteBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [detailBatch, setDetailBatch] = useState<QuoteBatch | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function authedFetch(url: string, options?: RequestInit) {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options?.headers ?? {})
      }
    });
  }

  async function loadBatches() {
    setLoading(true);
    setStatus("");
    try {
      const params = new URLSearchParams({ branchCode: "MAIN" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterCustomer) params.set("customerName", filterCustomer);
      const res = await authedFetch(`${apiUrl}/quotes/batch?${params}`);
      if (res.ok) {
        setBatches((await res.json()) as QuoteBatch[]);
      }
    } catch {
      setStatus("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadBatches(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDuplicate(id: string) {
    try {
      const res = await authedFetch(`${apiUrl}/quotes/batch/${id}/duplicate`, { method: "POST" });
      const data = await res.json() as { id?: string };
      setStatus(`Cotización duplicada: ${data.id?.slice(0, 8) ?? "?"}`);
      await loadBatches();
    } catch {
      setStatus("Error al duplicar");
    }
  }

  async function handleFinalize(id: string) {
    if (!confirm("¿Finalizar esta cotización? No podrá editarse.")) return;
    try {
      await authedFetch(`${apiUrl}/quotes/batch/${id}/finalize`, { method: "POST" });
      setStatus("Cotización finalizada.");
      await loadBatches();
    } catch {
      setStatus("Error al finalizar");
    }
  }

  async function handleCreateDraft(batch: QuoteBatch) {
    try {
      const res = await authedFetch(`${apiUrl}/sales/from-quote`, {
        method: "POST",
        body: JSON.stringify({
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
        })
      });
      const data = await res.json() as { quoteCode?: string; message?: string };
      if (res.ok) {
        setStatus(`Draft creado: ${data.quoteCode ?? "?"}`);
        onNavigate("sales");
      } else {
        setStatus(`Error: ${data.message ?? "desconocido"}`);
      }
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
      <div className="inline-actions" style={{ flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
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
        <Button variant="secondary" onClick={() => void loadBatches()} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Buscar"}
        </Button>
      </div>

      <p className="status-note">{status}</p>

      {batches.length === 0 && !loading ? (
        <p className="status-note">Sin cotizaciones en el historial.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
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
                    <span style={{
                      fontSize: "0.78em",
                      fontWeight: 600,
                      color: b.status === "DRAFT" ? "var(--muted)" : b.status === "FINALIZED" ? "var(--ok, green)" : "var(--error, red)"
                    }}>
                      {statusBadge(b.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
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
          </table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle cotización">
        <div className="dialog-header">
          <span className="dialog-title">
            Detalle — {detailBatch?.customerName ?? "Sin cliente"}
          </span>
          <button className="dialog-close" onClick={() => setDetailOpen(false)}>✕</button>
        </div>
        <div className="dialog-body">
          {detailBatch && (
            <>
              <div style={{ marginBottom: "0.75rem", fontSize: "0.9em", lineHeight: "1.7" }}>
                <div>Lista: <strong>{detailBatch.priceListName}</strong></div>
                {detailBatch.customerReference && (
                  <div>Referencia: <strong>{detailBatch.customerReference}</strong></div>
                )}
                <div>Estado: <strong>{statusBadge(detailBatch.status)}</strong></div>
                <div>Creado: <strong>{formatLocalDateTime(detailBatch.createdAt)}</strong></div>
                <div>Por: <strong>{detailBatch.createdBy}</strong></div>
              </div>

              <table className="data-table" style={{ fontSize: "0.85em" }}>
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
              </table>

              <div style={{ marginTop: "0.75rem", fontSize: "0.9em", lineHeight: "1.8" }}>
                <div>Subtotal: <strong>${detailBatch.subtotalAmount.toLocaleString()}</strong></div>
                <div>IVA (19%): <strong>${Math.round(detailBatch.taxAmount).toLocaleString()}</strong></div>
                <div>Total: <strong>${Math.round(detailBatch.totalAmount).toLocaleString()} CLP</strong></div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <Button variant="primary" onClick={() => { setDetailOpen(false); void handleCreateDraft(detailBatch); }}>
                  Crear Venta Draft
                </Button>
                <Button variant="secondary" onClick={() => { setDetailOpen(false); void handleDuplicate(detailBatch.id); }}>
                  Duplicar
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </article>
  );
}
