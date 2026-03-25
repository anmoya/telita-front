"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { formatLocalDateTime } from "../../../shared/time/date-service";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import { AUDIT_ACTION_LABELS, ENTITY_TYPE_LABELS } from "../../operations/shared/workbench.helpers";
import type { AuditRow, DashboardKpis, MenuKey, PendingScrapRow } from "../../operations/shared/workbench.shared-types";

type DashboardWorkbenchProps = {
  loadingMenu: boolean;
  dashboardKpis: DashboardKpis | null;
  pendingScraps: PendingScrapRow[];
  auditEvents: AuditRow[];
  onRefresh: () => void;
  onNavigate: (menu: MenuKey) => void;
};

export function DashboardWorkbench({
  loadingMenu,
  dashboardKpis,
  pendingScraps,
  auditEvents,
  onRefresh,
  onNavigate
}: DashboardWorkbenchProps) {
  function formatPendingScrapOrigin(row: PendingScrapRow) {
    return row.quoteId ? "Cotización vinculada" : "Sin referencia";
  }

  function formatAuditEntity(row: AuditRow) {
    return ENTITY_TYPE_LABELS[row.entityType] ?? row.entityType;
  }

  return (
    <article className="flow-card ti-dashboard-shell">
      <WorkbenchLayout
        className="ti-workbench--dashboard"
        aside={
          <WorkbenchSection title="Acciones rápidas">
            <div className="ti-section__actions" style={{ display: "grid", gap: "0.75rem" }}>
              <Button variant="secondary" onClick={() => onNavigate("pricing")}>Nueva cotización</Button>
              <Button variant="secondary" onClick={() => onNavigate("sales")}>Nueva venta</Button>
              <Button variant="secondary" onClick={() => onNavigate("cuts")}>Ir a cortes</Button>
              <Button variant="secondary" onClick={() => onNavigate("scraps")}>Ubicar retazos</Button>
              <Button variant="secondary" onClick={() => onNavigate("labels")}>Reimprimir etiqueta</Button>
            </div>
          </WorkbenchSection>
        }
      >
        <WorkbenchSection
          title="Resumen operativo"
          actions={(
            <Button variant="secondary" onClick={onRefresh} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          )}
        >
          {dashboardKpis ? (
            <div className="kpi-grid">
              <article className="kpi-card"><span>Cotizaciones hoy</span><strong>{dashboardKpis.quotesCreatedToday}</strong></article>
              <article className="kpi-card"><span>Ventas confirmadas</span><strong>{dashboardKpis.salesConfirmedToday}</strong></article>
              <article className="kpi-card"><span>Ventas anuladas</span><strong>{dashboardKpis.salesCanceledToday}</strong></article>
              <article className="kpi-card"><span>Retazos pendientes</span><strong>{dashboardKpis.pendingScraps}</strong></article>
              <article className="kpi-card"><span>Etiquetas hoy</span><strong>{dashboardKpis.labelsPrintedToday}</strong></article>
            </div>
          ) : (
            <EmptyState
              title="Sin resumen disponible"
              description={loadingMenu ? "Cargando indicadores operativos..." : "No fue posible cargar el resumen del día."}
            />
          )}
        </WorkbenchSection>

        <WorkbenchSection title="Retazos pendientes">
          {pendingScraps.length > 0 ? (
            <DataTable>
              <thead>
                <tr><th>Tela</th><th>Medida</th><th>Origen</th><th>Creado</th></tr>
              </thead>
              <tbody>
                {pendingScraps.map((row) => (
                  <tr key={row.id}>
                    <td>{row.skuCode}{row.skuName ? ` · ${row.skuName}` : ""}</td>
                    <td>{row.widthM.toFixed(2)} x {row.heightM.toFixed(2)} m</td>
                    <td>{formatPendingScrapOrigin(row)}</td>
                    <td>{formatLocalDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <p className="status-note">Sin retazos pendientes.</p>
          )}
        </WorkbenchSection>

        <WorkbenchSection title="Actividad reciente">
          {auditEvents.length > 0 ? (
            <DataTable>
              <thead>
                <tr><th>Entidad</th><th>Acción</th><th>Usuario</th><th>Hora</th></tr>
              </thead>
              <tbody>
                {auditEvents.map((row) => (
                  <tr key={row.id}>
                    <td>{formatAuditEntity(row)}</td>
                    <td>{AUDIT_ACTION_LABELS[row.action] ?? row.action}</td>
                    <td>{row.actor.email}</td>
                    <td>{formatLocalDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <p className="status-note">Sin actividad reciente.</p>
          )}
        </WorkbenchSection>
      </WorkbenchLayout>
    </article>
  );
}
