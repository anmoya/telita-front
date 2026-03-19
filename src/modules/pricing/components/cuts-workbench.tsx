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

type CutJobStatus = "PENDING" | "IN_PROGRESS" | "CUT" | "DELIVERED";

type CutJobRow = {
  id: string;
  saleId: string;
  saleLineId: string;
  status: CutJobStatus;
  cutAt: string | null;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  skuCode: string;
  skuName: string;
  saleCreatedAt: string;
};

type ScrapLocationPolicy = "AT_CUT_REQUIRE_LOCATION" | "AT_CUT_ROUTE_TO_INBOUND";

type ScrapPolicy = {
  classificationRule: unknown;
  locationPolicy: ScrapLocationPolicy;
  minWidthCm: number | null;
};

type CutScrapLookupMode = "OFF" | "MANUAL" | "AUTO_SUGGEST" | "REQUIRE_DECISION";
type CutScrapLookupScope = "CURRENT_LINE" | "ENTIRE_ORDER";

type CutScrapLookupPolicy = {
  mode: CutScrapLookupMode;
  scope: CutScrapLookupScope;
  allowManualSearch: boolean;
  maxSuggestionsPerLine: number;
};

type CompatibleScrapSuggestion = {
  scrapId: string;
  locationCode: string | null;
  widthM: number;
  heightM: number;
  fitScore?: number;
};

type CompatibleScrapLine = {
  saleLineId: string;
  skuCode: string;
  requestedWidthM: number;
  requestedHeightM: number;
  suggestions: CompatibleScrapSuggestion[];
};

type CompatibleScrapsResult = {
  saleId: string;
  lines: CompatibleScrapLine[];
};

type SoftHoldInfo = {
  active: boolean;
  expiresAt?: string;
  heldBy?: { email: string; fullName: string };
};

type SoftHoldPolicy = {
  enabled: boolean;
  defaultMinutes: number;
  maxMinutes: number;
};

type CutsWorkbenchProps = {
  loadingMenu: boolean;
  cutsStatus: string;
  cutJobs: CutJobRow[];
  cutPage: number;
  cutPageCount: number;
  totalCuts: number;
  cutFilterStatus: CutJobStatus | "ALL";
  compatibleScrapsStatus: string;
  scrapPolicy: ScrapPolicy | null;
  cutScrapPolicy: CutScrapLookupPolicy | null;
  loadingActionId: string | null;
  isPreCutLocationOpen: boolean;
  modalLocationCode: string;
  modalStatus: string;
  loadingModal: boolean;
  isCompatibleDialogOpen: boolean;
  isRequireDecisionMode: boolean;
  decisionCutJobId?: string;
  compatibleScrapsResult: CompatibleScrapsResult | null;
  softHolds: Record<string, SoftHoldInfo>;
  softHoldPolicy: SoftHoldPolicy | null;
  getCutStatusLabel: (status: string) => string;
  onSetCutFilterStatus: (value: CutJobStatus | "ALL") => void;
  onPrevCutPage: () => void;
  onNextCutPage: () => void;
  onRefreshCutJobs: () => void;
  onCheckCompatibleScraps: (cutJobId: string) => void;
  onMarkCutClick: (cutJobId: string) => void;
  onModalLocationCodeChange: (value: string) => void;
  onConfirmModalMarkCut: () => void;
  onClosePreCutLocation: () => void;
  onCloseCompatibleDialog: () => void;
  onSkipCompatibleScraps: (cutJobId: string) => void;
  onAllocateCompatibleScrap: (saleId: string, saleLineId: string, scrapId: string) => void;
  onCreateSoftHold: (scrapId: string, saleId: string, saleLineId: string) => void;
  onReleaseSoftHold: (scrapId: string) => void;
  onCompatibleStatusChange: (value: string) => void;
};

export function CutsWorkbench({
  loadingMenu,
  cutsStatus,
  cutJobs,
  cutPage,
  cutPageCount,
  totalCuts,
  cutFilterStatus,
  compatibleScrapsStatus,
  scrapPolicy,
  cutScrapPolicy,
  loadingActionId,
  isPreCutLocationOpen,
  modalLocationCode,
  modalStatus,
  loadingModal,
  isCompatibleDialogOpen,
  isRequireDecisionMode,
  decisionCutJobId,
  compatibleScrapsResult,
  softHolds,
  softHoldPolicy,
  getCutStatusLabel,
  onSetCutFilterStatus,
  onPrevCutPage,
  onNextCutPage,
  onRefreshCutJobs,
  onCheckCompatibleScraps,
  onMarkCutClick,
  onModalLocationCodeChange,
  onConfirmModalMarkCut,
  onClosePreCutLocation,
  onCloseCompatibleDialog,
  onSkipCompatibleScraps,
  onAllocateCompatibleScrap,
  onCreateSoftHold,
  onReleaseSoftHold,
  onCompatibleStatusChange
}: CutsWorkbenchProps) {
  const [selectedCutJobId, setSelectedCutJobId] = useState<string | null>(null);

  useEffect(() => {
    if (cutJobs.length === 0) {
      setSelectedCutJobId(null);
      return;
    }
    if (!selectedCutJobId || !cutJobs.some((row) => row.id === selectedCutJobId)) {
      setSelectedCutJobId(cutJobs[0].id);
    }
  }, [cutJobs, selectedCutJobId]);

  const selectedCutJob = useMemo(
    () => cutJobs.find((row) => row.id === selectedCutJobId) ?? null,
    [cutJobs, selectedCutJobId]
  );

  const selectedCutTone: "draft" | "warning" | "success" | "neutral" =
    selectedCutJob?.status === "CUT"
      ? "success"
      : selectedCutJob?.status === "DELIVERED"
        ? "neutral"
        : selectedCutJob?.status === "IN_PROGRESS"
          ? "warning"
          : "draft";

  return (
    <>
      <article className="flow-card ti-cuts-shell" id="section-cuts">
        <WorkbenchLayout
          className="ti-workbench--cuts"
          aside={
            <WorkbenchSection title="Corte seleccionado">
              {selectedCutJob ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="ti-sales-summary">
                    <div className="ti-sales-summary__row">
                      <span>Corte</span>
                      <strong>{selectedCutJob.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Estado</span>
                      <StatusPill tone={selectedCutTone}>{getCutStatusLabel(selectedCutJob.status)}</StatusPill>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Venta</span>
                      <strong>{selectedCutJob.saleId.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>SKU</span>
                      <strong>{selectedCutJob.skuCode}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Tela</span>
                      <strong>{selectedCutJob.skuName}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Medida</span>
                      <strong>{selectedCutJob.requestedWidthM} x {selectedCutJob.requestedHeightM} m</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Cantidad</span>
                      <strong>{selectedCutJob.quantity}</strong>
                    </div>
                    <div className="ti-sales-summary__row">
                      <span>Marcado</span>
                      <strong>{selectedCutJob.cutAt ? formatLocalDateTime(selectedCutJob.cutAt) : "Pendiente"}</strong>
                    </div>
                  </div>

                  {selectedCutJob.status === "PENDING" || selectedCutJob.status === "IN_PROGRESS" ? (
                    <div className="ti-section__actions">
                      {cutScrapPolicy && cutScrapPolicy.mode !== "OFF" ? (
                        <Button
                          variant="secondary"
                          onClick={() => onCheckCompatibleScraps(selectedCutJob.id)}
                          disabled={loadingActionId === `compat-${selectedCutJob.id}`}
                        >
                          {loadingActionId === `compat-${selectedCutJob.id}` ? <Spinner size="sm" /> : cutScrapPolicy.mode === "MANUAL" ? "Buscar retazos" : "Verificar retazos"}
                        </Button>
                      ) : null}
                      <Button
                        variant="primary"
                        onClick={() => onMarkCutClick(selectedCutJob.id)}
                        disabled={loadingActionId === selectedCutJob.id}
                      >
                        {loadingActionId === selectedCutJob.id ? <Spinner size="sm" /> : "Marcar cortado"}
                      </Button>
                    </div>
                  ) : null}

                  {scrapPolicy ? (
                    <p className="status-note" style={{ margin: 0 }}>
                      Regla de retazo: ancho sobrante &gt;= <strong>{scrapPolicy.minWidthCm ?? 50} cm</strong>.{" "}
                      {scrapPolicy.locationPolicy === "AT_CUT_REQUIRE_LOCATION"
                        ? "La ubicación se exige al cerrar el corte."
                        : "Los retazos útiles quedan pendientes de ingreso."}
                    </p>
                  ) : null}

                  {cutScrapPolicy && cutScrapPolicy.mode !== "OFF" ? (
                    <p className="status-note" style={{ margin: 0 }}>
                      Revisión de retazos: <strong>
                        {cutScrapPolicy.mode === "MANUAL"
                          ? "manual"
                          : cutScrapPolicy.mode === "AUTO_SUGGEST"
                            ? "sugerencia automática"
                            : "decisión obligatoria"}
                      </strong>
                      {" · "}
                      alcance <strong>{cutScrapPolicy.scope === "ENTIRE_ORDER" ? "toda la orden" : "línea actual"}</strong>.
                    </p>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="Sin corte seleccionado"
                  description="Selecciona un corte del listado para ver su resumen operativo."
                />
              )}
            </WorkbenchSection>
          }
        >
          <WorkbenchSection
            title="Cortes"
            className="ti-cuts-list-section"
            actions={(
              <>
                <Button variant={cutFilterStatus === "PENDING" ? "primary" : "secondary"} onClick={() => onSetCutFilterStatus("PENDING")}>
                  Pendientes
                </Button>
                <Button variant={cutFilterStatus === "IN_PROGRESS" ? "primary" : "secondary"} onClick={() => onSetCutFilterStatus("IN_PROGRESS")}>
                  En proceso
                </Button>
                <Button variant={cutFilterStatus === "CUT" ? "primary" : "secondary"} onClick={() => onSetCutFilterStatus("CUT")}>
                  Cortados
                </Button>
                <Button variant={cutFilterStatus === "DELIVERED" ? "primary" : "secondary"} onClick={() => onSetCutFilterStatus("DELIVERED")}>
                  Entregados
                </Button>
                <Button variant={cutFilterStatus === "ALL" ? "primary" : "secondary"} onClick={() => onSetCutFilterStatus("ALL")}>
                  Todos
                </Button>
                <Button onClick={onRefreshCutJobs} disabled={loadingMenu}>
                  {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
                </Button>
              </>
            )}
          >
            {cutsStatus ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{cutsStatus}</p> : null}
            {compatibleScrapsStatus ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{compatibleScrapsStatus}</p> : null}

            <div className="ti-cuts-list-region">
              {loadingMenu && cutJobs.length === 0 ? (
                <TableSkeleton rows={5} cols={8} />
              ) : cutJobs.length > 0 ? (
                <DataTable>
                  <thead>
                    <tr><th>Corte</th><th>Venta</th><th>SKU</th><th>Medida</th><th>Cant.</th><th>Estado</th><th>Marcado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {cutJobs.map((row) => (
                      <tr
                        key={row.id}
                        className={row.id === selectedCutJobId ? "ti-row-selected" : undefined}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedCutJobId(row.id)}
                      >
                        <td>{row.id.slice(0, 8).toUpperCase()}</td>
                        <td>{row.saleId.slice(0, 8).toUpperCase()}</td>
                        <td>
                          <div className="table-cell-primary">
                            <strong>{row.skuCode}</strong>
                            <div className="table-cell-meta">{row.skuName}</div>
                          </div>
                        </td>
                        <td>{row.requestedWidthM} x {row.requestedHeightM} m</td>
                        <td>{row.quantity}</td>
                        <td>
                          <StatusPill tone={row.status === "CUT" ? "success" : row.status === "DELIVERED" ? "neutral" : row.status === "IN_PROGRESS" ? "warning" : "draft"}>
                            {getCutStatusLabel(row.status)}
                          </StatusPill>
                        </td>
                        <td>{row.cutAt ? formatLocalDateTime(row.cutAt) : "Pendiente"}</td>
                        <td>
                          <div className="actions-cell">
                            {(row.status === "PENDING" || row.status === "IN_PROGRESS") && cutScrapPolicy && cutScrapPolicy.mode !== "OFF" ? (
                              <Button
                                variant="secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onCheckCompatibleScraps(row.id);
                                }}
                                disabled={loadingActionId === `compat-${row.id}`}
                              >
                                {loadingActionId === `compat-${row.id}` ? <Spinner size="sm" /> : cutScrapPolicy.mode === "MANUAL" ? "Buscar retazos" : "Verificar retazos"}
                              </Button>
                            ) : null}
                            {row.status === "PENDING" || row.status === "IN_PROGRESS" ? (
                              <Button
                                variant="secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onMarkCutClick(row.id);
                                }}
                                disabled={loadingActionId === row.id}
                              >
                                {loadingActionId === row.id ? <Spinner size="sm" /> : "Marcar cortado"}
                              </Button>
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
                  title="Sin cortes para este filtro"
                  description="Cambia el estado o confirma ventas para generar nuevos cortes."
                />
              )}
            </div>
          </WorkbenchSection>
        </WorkbenchLayout>

        <ActionFooter
          left={<span className="ti-sales-footer-note">Operación de corte y resolución de retazos desde una misma mesa de trabajo.</span>}
          summary={
            <div className="ti-pricing-footer-summary">
              <span className="ti-pricing-footer-summary__meta">Página {cutPage} de {cutPageCount}</span>
              <span className="ti-pricing-footer-summary__meta">{totalCuts} corte(s)</span>
              {selectedCutJob ? <span className="ti-pricing-footer-summary__meta">Seleccionado: {selectedCutJob.id.slice(0, 8).toUpperCase()}</span> : null}
            </div>
          }
          actions={(
            <>
              <Button variant="secondary" onClick={onPrevCutPage} disabled={cutPage === 1}>
                Anterior
              </Button>
              <Button variant="secondary" onClick={onNextCutPage} disabled={cutPage >= cutPageCount}>
                Siguiente
              </Button>
            </>
          )}
        />
      </article>

      <Dialog
        open={isPreCutLocationOpen}
        onClose={onClosePreCutLocation}
        title="Ubicacion del retazo (requerida)"
      >
        <p className="status-note">
          La politica actual requiere indicar donde se almacenara el retazo util antes de registrar el corte.
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
          <Button onClick={onConfirmModalMarkCut} disabled={!modalLocationCode || loadingModal}>
            {loadingModal ? <Spinner size="sm" /> : "Confirmar y marcar cortado"}
          </Button>
          <Button variant="secondary" onClick={onClosePreCutLocation} disabled={loadingModal}>Cancelar</Button>
        </div>
      </Dialog>

      <Dialog
        open={isCompatibleDialogOpen}
        onClose={() => { if (!isRequireDecisionMode) onCloseCompatibleDialog(); }}
        title={isRequireDecisionMode ? "Decision requerida: retazos compatibles" : "Retazos compatibles encontrados"}
      >
        {compatibleScrapsResult && compatibleScrapsResult.lines.length > 0 ? (
          <>
            {isRequireDecisionMode && (
              <p className="status-note" style={{ color: "var(--warning, #e67e22)" }}>
                Se encontraron retazos compatibles. Debes decidir antes de continuar.
              </p>
            )}
            {compatibleScrapsResult.lines.map((line) => (
              line.suggestions.length > 0 ? (
                <div key={line.saleLineId} style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.85em", margin: "0 0 0.25rem 0" }}>
                    <strong>{line.skuCode}</strong> — {line.requestedWidthM} x {line.requestedHeightM} m
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr><th>Retazo</th><th>Medida</th><th>Excedente</th><th>Ubicacion</th><th>Estado</th><th>Accion</th></tr>
                    </thead>
                    <tbody>
                      {line.suggestions.map((s) => {
                        const hold = softHolds[s.scrapId];
                        const isHeld = hold?.active;
                        const holdExpiry = hold?.expiresAt ? new Date(hold.expiresAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : null;
                        return (
                          <tr key={s.scrapId}>
                            <td>{s.scrapId.slice(0, 8)}</td>
                            <td>{s.widthM} x {s.heightM}</td>
                            <td>{s.fitScore?.toFixed(3) ?? "—"} m²</td>
                            <td><strong>{s.locationCode ?? "—"}</strong></td>
                            <td>
                              {isHeld ? (
                                <span style={{ color: "var(--warning, #e67e22)", fontSize: "0.85em" }}>
                                  Reservado por {hold.heldBy?.fullName ?? "—"} hasta {holdExpiry}
                                </span>
                              ) : (
                                <span style={{ color: "var(--ok, green)", fontSize: "0.85em" }}>Disponible</span>
                              )}
                            </td>
                            <td style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  onAllocateCompatibleScrap(compatibleScrapsResult.saleId, line.saleLineId, s.scrapId);
                                  onCloseCompatibleDialog();
                                  onCompatibleStatusChange(`Retazo ${s.scrapId.slice(0, 8)} asignado a linea.`);
                                }}
                                disabled={!!loadingActionId}
                              >
                                {loadingActionId === s.scrapId ? <Spinner size="sm" /> : "Usar"}
                              </Button>
                              {softHoldPolicy?.enabled && !isHeld && (
                                <Button
                                  variant="secondary"
                                  onClick={() => onCreateSoftHold(s.scrapId, compatibleScrapsResult.saleId, line.saleLineId)}
                                  disabled={!!loadingActionId}
                                >
                                  {loadingActionId === `hold-${s.scrapId}` ? <Spinner size="sm" /> : "Reservar"}
                                </Button>
                              )}
                              {isHeld && (
                                <Button
                                  variant="secondary"
                                  onClick={() => onReleaseSoftHold(s.scrapId)}
                                  disabled={!!loadingActionId}
                                >
                                  {loadingActionId === `release-${s.scrapId}` ? <Spinner size="sm" /> : "Liberar"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null
            ))}
            <div className="inline-actions">
              {isRequireDecisionMode && decisionCutJobId ? (
                <Button variant="secondary" onClick={() => onSkipCompatibleScraps(decisionCutJobId)}>
                  Continuar con corte nuevo
                </Button>
              ) : (
                <Button variant="secondary" onClick={onCloseCompatibleDialog}>Cerrar</Button>
              )}
            </div>
          </>
        ) : (
          <p className="status-note">Sin retazos compatibles.</p>
        )}
      </Dialog>
    </>
  );
}
