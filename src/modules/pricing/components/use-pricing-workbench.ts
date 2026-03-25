"use client";

import { useEffect, useMemo } from "react";

import { roundClpFront } from "../../operations/shared/workbench.helpers";
import type { QuoteScrapOpportunityRow } from "../../operations/shared/workbench.types";
import type { QuoteItem } from "../../operations/shared/workbench.shared-types";

type UsePricingWorkbenchArgs = {
  activeMenu: string;
  quoteItems: QuoteItem[];
  activeQuoteItemId: string | null;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  commercialAdjustmentPct: number;
  installationAmount: number;
  onActiveQuoteItemIdChange: (itemId: string | null) => void;
};

export function buildPricingWorkbenchModel(input: {
  quoteItems: QuoteItem[];
  activeQuoteItemId: string | null;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  commercialAdjustmentPct: number;
  installationAmount: number;
}) {
  const activeQuoteItem =
    input.quoteItems.find((item) => item.id === input.activeQuoteItemId) ?? null;

  const activeQuoteItemOpportunities = input.quoteItemMatches.filter(
    (entry) => entry.itemId === input.activeQuoteItemId
  );

  const quoteOpportunityEligibleCount = input.quoteItems.filter((item) => {
    const width = Number(item.widthM);
    const height = Number(item.heightM);
    const qty = Number(item.quantity);
    return Boolean(item.skuCode) && Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 && Number.isFinite(qty) && qty > 0;
  }).length;

  const baseSubtotal = input.quoteItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const commercialAdjustmentAmount = Math.round(baseSubtotal * (input.commercialAdjustmentPct / 100));
  const quoteSubtotal = baseSubtotal + commercialAdjustmentAmount + input.installationAmount;
  const quoteTax = Math.round(quoteSubtotal * 0.19);
  const quoteTotal = roundClpFront(quoteSubtotal + quoteTax);

  const recoveredValue = input.quoteItemMatches.reduce((sum, entry) => sum + entry.recoveredValue, 0);
  const coveredItemIds = new Set(input.quoteItemMatches.map((entry) => entry.itemId));
  const orderCoveragePct = quoteSubtotal > 0 ? Math.min(100, (recoveredValue / quoteSubtotal) * 100) : 0;
  const quoteOpportunitySummary = {
    pieces: input.quoteItemMatches.length,
    lines: coveredItemIds.size,
    recoveredValue,
    orderCoveragePct
  };

  const quoteHasCalcErrors = input.quoteItems.some((item) => item.calcStatus === "error");
  const quoteReady = input.quoteItems.length > 0 && input.quoteItems.every((item) => item.calcStatus === "ok");
  const pricingDocumentStatus = quoteReady ? "Calculada" : "Cotización";
  const pricingDocumentTone: "success" | "draft" = quoteReady ? "success" : "draft";

  return {
    activeQuoteItem,
    activeQuoteItemOpportunities,
    quoteOpportunityEligibleCount,
    commercialAdjustmentAmount,
    quoteSubtotal,
    quoteTax,
    quoteTotal,
    quoteOpportunitySummary,
    quoteHasCalcErrors,
    quoteReady,
    pricingDocumentStatus,
    pricingDocumentTone
  };
}

export function usePricingWorkbench({
  activeMenu,
  quoteItems,
  activeQuoteItemId,
  quoteItemMatches,
  commercialAdjustmentPct,
  installationAmount,
  onActiveQuoteItemIdChange,
}: UsePricingWorkbenchArgs) {
  useEffect(() => {
    if (quoteItems.length === 0) {
      onActiveQuoteItemIdChange(null);
      return;
    }
    if (!activeQuoteItemId || !quoteItems.some((item) => item.id === activeQuoteItemId)) {
      onActiveQuoteItemIdChange(quoteItems[0].id);
    }
  }, [quoteItems, activeQuoteItemId, onActiveQuoteItemIdChange]);

  const model = useMemo(
    () =>
      buildPricingWorkbenchModel({
        quoteItems,
        activeQuoteItemId,
        quoteItemMatches,
        commercialAdjustmentPct,
        installationAmount
      }),
    [quoteItems, activeQuoteItemId, quoteItemMatches, commercialAdjustmentPct, installationAmount]
  );
  // bug-04: scrap search is manual only — no auto-trigger on item selection

  return {
    activeQuoteItem: model.activeQuoteItem,
    activeQuoteItemOpportunities: model.activeQuoteItemOpportunities,
    quoteOpportunityEligibleCount: model.quoteOpportunityEligibleCount,
    quoteSubtotal: model.quoteSubtotal,
    quoteTax: model.quoteTax,
    quoteTotal: model.quoteTotal,
    quoteOpportunitySummary: model.quoteOpportunitySummary,
    quoteHasCalcErrors: model.quoteHasCalcErrors,
    quoteReady: model.quoteReady,
    pricingDocumentStatus: model.pricingDocumentStatus,
    pricingDocumentTone: model.pricingDocumentTone
  };
}
