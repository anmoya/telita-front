"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { EmptyState } from "../../../shared/ui/primitives/empty-state";
import { OptionCard } from "../../../shared/ui/patterns/option-card";
import { StatusPill } from "../../../shared/ui/patterns/status-pill";
import { TotalsSummary } from "../../../shared/ui/patterns/totals-summary";
import { WorkbenchSection } from "../../../shared/ui/patterns/workbench-section";
import type { QuoteScrapOpportunityRow } from "../../operations/shared/workbench.types";

type QuoteScrapOpportunityPanelProps = {
  quoteItemsCount: number;
  hasAnySkuSelected: boolean;
  activeQuoteItemSkuCode?: string | null;
  activeQuoteItemOpportunityCount: number;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  quoteItemMatchesStatus: string;
  quoteOpportunitySummary: {
    pieces: number;
    lines: number;
    recoveredValue: number;
    orderCoveragePct: number;
  };
  loading: boolean;
  onRefresh: () => void;
};

export function QuoteScrapOpportunityPanel({
  quoteItemsCount,
  hasAnySkuSelected,
  activeQuoteItemSkuCode,
  activeQuoteItemOpportunityCount,
  quoteItemMatches,
  quoteItemMatchesStatus,
  quoteOpportunitySummary,
  loading,
  onRefresh
}: QuoteScrapOpportunityPanelProps) {
  return (
    <WorkbenchSection
      title="Oportunidad con retazos"
      className="ti-pricing-scrap-section"
      actions={
        quoteItemsCount > 0 ? (
          <Button variant="secondary" className="ti-pricing-scrap-section__cta" onClick={onRefresh} disabled={loading || !hasAnySkuSelected}>
            {loading ? <Spinner size="sm" /> : "Verificar Retazos"}
          </Button>
        ) : null
      }
    >
      {quoteItemMatches.length > 0 ? (
        <>
          <p className="ti-field-note ti-pricing-scrap-section__status" style={{ marginBottom: "0.7rem" }}>
            {quoteItemMatchesStatus}
          </p>
          <TotalsSummary
            className="ti-pricing-scrap-summary"
            rows={[
              { label: "Piezas reutilizables", value: String(quoteOpportunitySummary.pieces) },
              { label: "Lineas con oportunidad", value: String(quoteOpportunitySummary.lines) },
              {
                label: "Margen potencial recuperado",
                value: `$${Math.round(quoteOpportunitySummary.recoveredValue).toLocaleString()}`,
                tone: quoteOpportunitySummary.recoveredValue > 0 ? "success" : "muted"
              }
            ]}
            totalLabel="Cobertura potencial"
            totalValue={`${quoteOpportunitySummary.orderCoveragePct.toFixed(0)}%`}
            note="Preview comercial. No asigna ni reserva retazos."
          />
          {activeQuoteItemSkuCode ? (
            <p className="ti-field-note ti-pricing-scrap-section__active-line" style={{ margin: "0.15rem 0 0" }}>
              Línea activa: <strong>{activeQuoteItemSkuCode}</strong>. {activeQuoteItemOpportunityCount} oportunidad(es).
            </p>
          ) : null}
          <div className="ti-pricing-scrap-section__matches">
            {quoteItemMatches.map((match, index) => {
              const tone = index === 0 || match.excessAreaM2 <= 0.25 ? "success" : match.excessAreaM2 > 1 ? "warning" : "neutral";
              const badgeLabel = match.excessAreaM2 <= 0.25 ? "Exacto" : tone === "warning" ? "Alternativa" : "Muy cercano";
              return (
                <OptionCard
                  key={match.key}
                  tone={tone}
                  badge={<StatusPill tone={tone === "success" ? "success" : tone === "warning" ? "warning" : "neutral"}>{badgeLabel}</StatusPill>}
                  title={`Linea ${match.itemIndex} · Pieza ${match.pieceIndex}/${match.pieceTotal}`}
                  subtitle={`${match.skuCode} · ${match.requestedWidthM.toFixed(2)}m × ${match.requestedHeightM.toFixed(2)}m`}
                  meta={
                    <>
                      <span>Pos: {match.locationCode ?? "Sin ubicacion"}</span>
                      <span>Retazo {match.scrapId.slice(0, 8)}</span>
                    </>
                  }
                  description={`Esta pieza podria salir desde retazo ya pagado. Valor potencial recuperado: $${Math.round(match.recoveredValue).toLocaleString()}. Excedente estimado ${match.excessAreaM2.toFixed(2)} m².`}
                  footer={
                    <div className="ti-field-note" style={{ margin: 0 }}>
                      Cobertura de esta pieza: {match.salesValue > 0 ? "100% de su venta potencialmente recuperable como margen extraordinario." : "Calcula la linea para cuantificar el impacto en pesos."}
                    </div>
                  }
                />
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title={quoteItemMatchesStatus || "Sin oportunidades detectadas"}
          description="Al elegir SKU y dimensiones, el panel va acumulando piezas que podrían salir desde retazo, sin asignarlas."
        />
      )}
    </WorkbenchSection>
  );
}
