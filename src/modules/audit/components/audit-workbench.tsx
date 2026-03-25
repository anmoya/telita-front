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
import { AUDIT_ACTION_LABELS, ENTITY_TYPE_LABELS } from "../../operations/shared/workbench.helpers";
import type { AuditRow } from "../../operations/shared/workbench.shared-types";

type AuditEntityFilter = "ALL" | "sale" | "cut_job" | "scrap" | "label" | "quote_batch";

type AuditWorkbenchProps = {
  loadingMenu: boolean;
  auditEvents: AuditRow[];
  auditEntityFilter: AuditEntityFilter;
  auditEntityIdInput: string;
  auditPage: number;
  auditPageCount: number;
  totalAuditEvents: number;
  onSetAuditEntityFilter: (value: AuditEntityFilter) => void;
  onAuditEntityIdInputChange: (value: string) => void;
  onApplyAuditEntityId: () => void;
  onClearAuditEntityId: () => void;
  onPrevAuditPage: () => void;
  onNextAuditPage: () => void;
  onRefresh: () => void;
};

export function AuditWorkbench({
  loadingMenu,
  auditEvents,
  auditEntityFilter,
  auditEntityIdInput,
  auditPage,
  auditPageCount,
  totalAuditEvents,
  onSetAuditEntityFilter,
  onAuditEntityIdInputChange,
  onApplyAuditEntityId,
  onClearAuditEntityId,
  onPrevAuditPage,
  onNextAuditPage,
  onRefresh
}: AuditWorkbenchProps) {
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  useEffect(() => {
    if (auditEvents.length === 0) {
      setSelectedAuditId(null);
      return;
    }
    if (!selectedAuditId || !auditEvents.some((row) => row.id === selectedAuditId)) {
      setSelectedAuditId(auditEvents[0].id);
    }
  }, [auditEvents, selectedAuditId]);

  const selectedAudit = useMemo(
    () => auditEvents.find((row) => row.id === selectedAuditId) ?? null,
    [auditEvents, selectedAuditId]
  );

  function renderAuditJson(value: unknown) {
    if (!value) return "Sin detalle";
    return JSON.stringify(value, null, 2);
  }

  return (
    <article className="flow-card ti-audit-shell">
      <WorkbenchLayout
        className="ti-workbench--audit"
        aside={
          <>
            <WorkbenchSection title="Filtros">
              <div style={{ display: "grid", gap: "0.9rem" }}>
                <label className="field">
                  <span>Entidad o ID exacto</span>
                  <Input
                    value={auditEntityIdInput}
                    onChange={(event) => onAuditEntityIdInputChange(event.target.value)}
                    placeholder="UUID de entidad"
                  />
                </label>
                <div className="ti-section__actions">
                  <Button variant="primary" onClick={onApplyAuditEntityId}>
                    Buscar
                  </Button>
                  <Button variant="secondary" onClick={onClearAuditEntityId}>
                    Limpiar
                  </Button>
                </div>
              </div>
            </WorkbenchSection>

            <WorkbenchSection title="Evento seleccionado">
              {selectedAudit ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Entidad</span>
                      <strong>{ENTITY_TYPE_LABELS[selectedAudit.entityType] ?? selectedAudit.entityType}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Acción</span>
                      <StatusPill tone="draft">{AUDIT_ACTION_LABELS[selectedAudit.action] ?? selectedAudit.action}</StatusPill>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>ID entidad</span>
                      <strong>{selectedAudit.entityId.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Actor</span>
                      <strong>{selectedAudit.actor.email}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Fecha</span>
                      <strong>{formatLocalDateTime(selectedAudit.createdAt)}</strong>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div>
                      <p className="status-note" style={{ marginBottom: "0.35rem" }}>Antes</p>
                      <pre className="ti-audit-json">{renderAuditJson(selectedAudit.beforeJson)}</pre>
                    </div>
                    <div>
                      <p className="status-note" style={{ marginBottom: "0.35rem" }}>Después</p>
                      <pre className="ti-audit-json">{renderAuditJson(selectedAudit.afterJson)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Sin evento seleccionado"
                  description="Selecciona un evento para revisar el detalle del cambio."
                />
              )}
            </WorkbenchSection>
          </>
        }
      >
        <WorkbenchSection
          title="Bitácora operativa"
          className="ti-audit-list-section"
          actions={(
            <>
              <Button variant={auditEntityFilter === "ALL" ? "primary" : "secondary"} onClick={() => onSetAuditEntityFilter("ALL")}>
                Todo
              </Button>
              <Button variant={auditEntityFilter === "sale" ? "primary" : "secondary"} onClick={() => onSetAuditEntityFilter("sale")}>
                Ventas
              </Button>
              <Button variant={auditEntityFilter === "cut_job" ? "primary" : "secondary"} onClick={() => onSetAuditEntityFilter("cut_job")}>
                Cortes
              </Button>
              <Button variant={auditEntityFilter === "scrap" ? "primary" : "secondary"} onClick={() => onSetAuditEntityFilter("scrap")}>
                Retazos
              </Button>
              <Button variant={auditEntityFilter === "label" ? "primary" : "secondary"} onClick={() => onSetAuditEntityFilter("label")}>
                Etiquetas
              </Button>
              <Button variant={auditEntityFilter === "quote_batch" ? "primary" : "secondary"} onClick={() => onSetAuditEntityFilter("quote_batch")}>
                Cotizaciones
              </Button>
              <Button variant="secondary" onClick={onRefresh} disabled={loadingMenu}>
                {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
              </Button>
            </>
          )}
        >
          <div className="ti-audit-list-region">
            {loadingMenu && auditEvents.length === 0 ? (
              <TableSkeleton rows={6} cols={4} />
            ) : auditEvents.length > 0 ? (
              <DataTable>
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>Acción</th>
                    <th>Actor</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((row) => (
                    <tr
                      key={row.id}
                      className={row.id === selectedAuditId ? "ti-row-selected" : undefined}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedAuditId(row.id)}
                    >
                      <td>{ENTITY_TYPE_LABELS[row.entityType] ?? row.entityType}: {row.entityId.slice(0, 8).toUpperCase()}</td>
                      <td>{AUDIT_ACTION_LABELS[row.action] ?? row.action}</td>
                      <td>{row.actor.email}</td>
                      <td>{formatLocalDateTime(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState
                title="Sin eventos para mostrar"
                description="Cambia el filtro o limpia la búsqueda para revisar más actividad operativa."
              />
            )}
          </div>
        </WorkbenchSection>
      </WorkbenchLayout>

      <ActionFooter
        left={<span className="ti-sales-footer-note">Trazabilidad de cambios, impresiones y movimientos operativos.</span>}
        summary={(
          <div className="ti-pricing-footer-summary">
            <span className="ti-pricing-footer-summary__meta">Página {auditPage} de {auditPageCount}</span>
            <span className="ti-pricing-footer-summary__meta">{totalAuditEvents} evento(s)</span>
            {selectedAudit ? <span className="ti-pricing-footer-summary__meta">Entidad: {selectedAudit.entityId.slice(0, 8).toUpperCase()}</span> : null}
          </div>
        )}
        actions={(
          <>
            <Button variant="secondary" onClick={onPrevAuditPage} disabled={auditPage === 1}>
              Anterior
            </Button>
            <Button variant="secondary" onClick={onNextAuditPage} disabled={auditPage >= auditPageCount}>
              Siguiente
            </Button>
          </>
        )}
      />
    </article>
  );
}
