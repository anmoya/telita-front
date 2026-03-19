"use client";

import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { ActionFooter } from "../../../shared/ui/patterns/action-footer";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { WorkbenchLayout } from "../../../shared/ui/patterns/workbench-layout";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";

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

type SoftHoldPolicy = {
  enabled: boolean;
  defaultMinutes: number;
  maxMinutes: number;
};

type SettingsWorkbenchProps = {
  loadingMenu: boolean;
  loadingActionId: string | null;
  settingsStatus: string;
  scrapPolicy: ScrapPolicy | null;
  scrapMinWidthCmInput: string;
  cutScrapPolicy: CutScrapLookupPolicy | null;
  softHoldPolicy: SoftHoldPolicy | null;
  onRefreshScrapPolicy: () => void;
  onScrapMinWidthCmInputChange: (value: string) => void;
  onUpdateScrapPolicy: (locationPolicy: ScrapLocationPolicy) => void;
  onUpdateCutScrapPolicy: (updates: Partial<CutScrapLookupPolicy>) => void;
  onUpdateSoftHoldPolicy: (updates: Partial<SoftHoldPolicy>) => void;
};

export function SettingsWorkbench({
  loadingMenu,
  loadingActionId,
  settingsStatus,
  scrapPolicy,
  scrapMinWidthCmInput,
  cutScrapPolicy,
  softHoldPolicy,
  onRefreshScrapPolicy,
  onScrapMinWidthCmInputChange,
  onUpdateScrapPolicy,
  onUpdateCutScrapPolicy,
  onUpdateSoftHoldPolicy
}: SettingsWorkbenchProps) {
  const cutModeLabel = cutScrapPolicy
    ? cutScrapPolicy.mode === "OFF"
      ? "Apagado"
      : cutScrapPolicy.mode === "MANUAL"
        ? "Manual"
        : cutScrapPolicy.mode === "AUTO_SUGGEST"
          ? "Sugerencia automática"
          : "Decisión obligatoria"
    : "Sin cargar";

  return (
    <article className="flow-card ti-settings-shell">
      <WorkbenchLayout
        className="ti-workbench--settings"
        aside={(
          <>
            <WorkbenchSection title="Resumen operativo">
              {scrapPolicy || cutScrapPolicy || softHoldPolicy ? (
                <div className="ti-sales-summary">
                  <div className="ti-sales-summary__row">
                    <span>Retazo útil mínimo</span>
                    <strong>{scrapPolicy?.minWidthCm ?? 50} cm</strong>
                  </div>
                  <div className="ti-sales-summary__row">
                    <span>Cierre de corte</span>
                    <StatusPill tone={scrapPolicy?.locationPolicy === "AT_CUT_REQUIRE_LOCATION" ? "warning" : "draft"}>
                      {scrapPolicy?.locationPolicy === "AT_CUT_REQUIRE_LOCATION" ? "Pide ubicación" : "Envía a ingreso"}
                    </StatusPill>
                  </div>
                  <div className="ti-sales-summary__row">
                    <span>Chequeo al cortar</span>
                    <strong>{cutModeLabel}</strong>
                  </div>
                  <div className="ti-sales-summary__row">
                    <span>Soft hold</span>
                    <StatusPill tone={softHoldPolicy?.enabled ? "success" : "neutral"}>
                      {softHoldPolicy?.enabled ? `${softHoldPolicy.defaultMinutes} min` : "Deshabilitado"}
                    </StatusPill>
                  </div>
                  {softHoldPolicy?.enabled ? (
                    <div className="ti-sales-summary__row">
                      <span>Límite reserva</span>
                      <strong>{softHoldPolicy.maxMinutes} min</strong>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState title="Sin políticas cargadas" description="Refresca para cargar la configuración operativa actual." />
              )}
            </WorkbenchSection>

            <WorkbenchSection title="Notas">
              <p className="status-note" style={{ margin: 0 }}>
                Estas reglas impactan cotización, corte, generación de retazos y asignación en venta. Conviene ajustar solo con criterio operativo claro.
              </p>
            </WorkbenchSection>
          </>
        )}
      >
        <WorkbenchSection
          title="Políticas operativas"
          className="ti-settings-list-section"
          actions={(
            <Button variant="secondary" onClick={onRefreshScrapPolicy} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          )}
        >
          {settingsStatus ? <p className="status-note" style={{ margin: "0 0 0.75rem" }}>{settingsStatus}</p> : null}

          <div className="ti-settings-stack">
            <WorkbenchSection title="Clasificación de retazos">
              {scrapPolicy ? (
                <div className="ti-settings-grid">
                  <label className="field">
                    <span>Ancho mínimo útil (cm)</span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={scrapMinWidthCmInput}
                      onChange={(e) => onScrapMinWidthCmInputChange(e.target.value)}
                    />
                  </label>
                  <p className="status-note">
                    Regla activa: <strong>ancho sobrante &gt;= {scrapPolicy.minWidthCm ?? 50} cm</strong>.
                  </p>
                </div>
              ) : (
                <p className="status-note">Cargando configuración...</p>
              )}
            </WorkbenchSection>

            <WorkbenchSection title="Política al cerrar corte">
              {scrapPolicy ? (
                <>
                  <div className="ti-section__actions">
                    <Button
                      variant={scrapPolicy.locationPolicy === "AT_CUT_REQUIRE_LOCATION" ? "primary" : "secondary"}
                      onClick={() => onUpdateScrapPolicy("AT_CUT_REQUIRE_LOCATION")}
                      disabled={!!loadingActionId}
                    >
                      {loadingActionId === "AT_CUT_REQUIRE_LOCATION" ? <Spinner size="sm" /> : "Exigir ubicación inmediata"}
                    </Button>
                    <Button
                      variant={scrapPolicy.locationPolicy === "AT_CUT_ROUTE_TO_INBOUND" ? "primary" : "secondary"}
                      onClick={() => onUpdateScrapPolicy("AT_CUT_ROUTE_TO_INBOUND")}
                      disabled={!!loadingActionId}
                    >
                      {loadingActionId === "AT_CUT_ROUTE_TO_INBOUND" ? <Spinner size="sm" /> : "Enviar a ingreso"}
                    </Button>
                  </div>
                  <p className="status-note">
                    Si se exige ubicación inmediata, el corte se bloquea hasta informar posición. Si no, el retazo útil queda pendiente de ingreso.
                  </p>
                </>
              ) : (
                <p className="status-note">Cargando configuración...</p>
              )}
            </WorkbenchSection>

            <WorkbenchSection title="Verificación de retazos al cortar">
              {cutScrapPolicy ? (
                <>
                  <p className="status-note">
                    Modo actual: <strong>{cutModeLabel}</strong>
                  </p>
                  <div className="ti-section__actions">
                    {(["OFF", "MANUAL", "AUTO_SUGGEST", "REQUIRE_DECISION"] as const).map((mode) => (
                      <Button
                        key={mode}
                        variant={cutScrapPolicy.mode === mode ? "primary" : "secondary"}
                        onClick={() => onUpdateCutScrapPolicy({ mode })}
                        disabled={!!loadingActionId}
                      >
                        {mode === "OFF" ? "Apagado" : mode === "MANUAL" ? "Manual" : mode === "AUTO_SUGGEST" ? "Sugerencia auto." : "Decisión obligatoria"}
                      </Button>
                    ))}
                  </div>
                  <div className="ti-settings-grid ti-settings-grid--triple">
                    <label className="field">
                      <span>Alcance</span>
                      <Select value={cutScrapPolicy.scope} onChange={(e) => onUpdateCutScrapPolicy({ scope: e.target.value as CutScrapLookupScope })}>
                        <option value="CURRENT_LINE">Línea actual</option>
                        <option value="ENTIRE_ORDER">Toda la orden</option>
                      </Select>
                    </label>
                    <label className="field">
                      <span>Máx. sugerencias por línea</span>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={String(cutScrapPolicy.maxSuggestionsPerLine)}
                        onChange={(e) => onUpdateCutScrapPolicy({ maxSuggestionsPerLine: Number(e.target.value) })}
                      />
                    </label>
                    <label className="ti-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={cutScrapPolicy.allowManualSearch}
                        onChange={(e) => onUpdateCutScrapPolicy({ allowManualSearch: e.target.checked })}
                      />
                      Permitir búsqueda manual
                    </label>
                  </div>
                </>
              ) : (
                <p className="status-note">Cargando...</p>
              )}
            </WorkbenchSection>

            <WorkbenchSection title="Reserva temporal de retazos">
              {softHoldPolicy ? (
                <>
                  <p className="status-note">
                    Estado: <strong>{softHoldPolicy.enabled ? "Habilitado" : "Deshabilitado"}</strong>
                  </p>
                  <div className="ti-section__actions">
                    <Button
                      variant={softHoldPolicy.enabled ? "primary" : "secondary"}
                      onClick={() => onUpdateSoftHoldPolicy({ enabled: true })}
                      disabled={!!loadingActionId}
                    >
                      Habilitado
                    </Button>
                    <Button
                      variant={!softHoldPolicy.enabled ? "primary" : "secondary"}
                      onClick={() => onUpdateSoftHoldPolicy({ enabled: false })}
                      disabled={!!loadingActionId}
                    >
                      Deshabilitado
                    </Button>
                  </div>
                  {softHoldPolicy.enabled ? (
                    <div className="ti-settings-grid">
                      <label className="field">
                        <span>Minutos por defecto</span>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          value={String(softHoldPolicy.defaultMinutes)}
                          onChange={(e) => onUpdateSoftHoldPolicy({ defaultMinutes: Number(e.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Minutos máximo</span>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          value={String(softHoldPolicy.maxMinutes)}
                          onChange={(e) => onUpdateSoftHoldPolicy({ maxMinutes: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="status-note">Cargando...</p>
              )}
            </WorkbenchSection>
          </div>
        </WorkbenchSection>
      </WorkbenchLayout>

      <ActionFooter
        left={<span className="ti-sales-footer-note">Configura cómo se generan, validan y reservan retazos en la operación diaria.</span>}
        summary={(
          <div className="ti-pricing-footer-summary">
            <span className="ti-pricing-footer-summary__meta">Retazo útil: {scrapPolicy?.minWidthCm ?? 50} cm</span>
            <span className="ti-pricing-footer-summary__meta">Chequeo corte: {cutModeLabel}</span>
            <span className="ti-pricing-footer-summary__meta">Soft hold: {softHoldPolicy?.enabled ? "Activo" : "Inactivo"}</span>
          </div>
        )}
      />
    </article>
  );
}
