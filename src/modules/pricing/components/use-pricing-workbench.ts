"use client";

import { useEffect, useMemo } from "react";

import { roundClpFront } from "./pricing-workbench.helpers";
import type { QuoteScrapOpportunityRow } from "./pricing-workbench.types";
import type { QuoteItem } from "./pricing-workbench.shared-types";

type UsePricingWorkbenchArgs = {
  activeMenu: string;
  quoteItems: QuoteItem[];
  activeQuoteItemId: string | null;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  commercialAdjustmentPct: number;
  installationAmount: number;
  onActiveQuoteItemIdChange: (itemId: string | null) => void;
};

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

  const activeQuoteItem = useMemo(
    () => quoteItems.find((item) => item.id === activeQuoteItemId) ?? null,
    [quoteItems, activeQuoteItemId]
  );

  const activeQuoteItemOpportunities = useMemo(
    () => quoteItemMatches.filter((entry) => entry.itemId === activeQuoteItemId),
    [quoteItemMatches, activeQuoteItemId]
  );

  const quoteOpportunityEligibleCount = useMemo(
    () =>
      quoteItems.filter((item) => {
        const width = Number(item.widthM);
        const height = Number(item.heightM);
        const qty = Number(item.quantity);
        return Boolean(item.skuCode) && Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 && Number.isFinite(qty) && qty > 0;
      }).length,
    [quoteItems]
  );

  const baseSubtotal = useMemo(
    () => quoteItems.reduce((sum, item) => sum + (item.subtotal || 0), 0),
    [quoteItems]
  );
  const commercialAdjustmentAmount = Math.round(baseSubtotal * (commercialAdjustmentPct / 100));
  const quoteSubtotal = useMemo(
    () => baseSubtotal + commercialAdjustmentAmount + installationAmount,
    [baseSubtotal, commercialAdjustmentAmount, installationAmount]
  );

  const quoteTax = useMemo(() => Math.round(quoteSubtotal * 0.19), [quoteSubtotal]);
  const quoteTotal = useMemo(() => roundClpFront(quoteSubtotal + quoteTax), [quoteSubtotal, quoteTax]);

  const quoteOpportunitySummary = useMemo(() => {
    const recoveredValue = quoteItemMatches.reduce((sum, entry) => sum + entry.recoveredValue, 0);
    const coveredItemIds = new Set(quoteItemMatches.map((entry) => entry.itemId));
    const orderCoveragePct = quoteSubtotal > 0 ? Math.min(100, (recoveredValue / quoteSubtotal) * 100) : 0;

    return {
      pieces: quoteItemMatches.length,
      lines: coveredItemIds.size,
      recoveredValue,
      orderCoveragePct
    };
  }, [quoteItemMatches, quoteSubtotal]);

  const quoteHasCalcErrors = useMemo(
    () => quoteItems.some((item) => item.calcStatus === "error"),
    [quoteItems]
  );

  const quoteReady = quoteItems.length > 0 && quoteItems.every((item) => item.calcStatus === "ok");
  const pricingDocumentStatus = quoteReady ? "Calculada" : "Cotización";
  const pricingDocumentTone: "success" | "draft" = quoteReady ? "success" : "draft";
  // bug-04: scrap search is manual only — no auto-trigger on item selection

  return {
    activeQuoteItem,
    activeQuoteItemOpportunities,
    quoteOpportunityEligibleCount,
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
