"use client";

import { useEffect, useMemo, useRef } from "react";

import { roundClpFront } from "./pricing-workbench.helpers";
import type { QuoteScrapOpportunityRow } from "./pricing-workbench.types";
import type { QuoteItem } from "./pricing-workbench.shared-types";

type UsePricingWorkbenchArgs = {
  activeMenu: string;
  quoteItems: QuoteItem[];
  activeQuoteItemId: string | null;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  operatorMargin: number;
  onActiveQuoteItemIdChange: (itemId: string | null) => void;
  onLoadQuoteScrapOpportunityPreview: (itemId?: string) => void;
};

export function usePricingWorkbench({
  activeMenu,
  quoteItems,
  activeQuoteItemId,
  quoteItemMatches,
  operatorMargin,
  onActiveQuoteItemIdChange,
  onLoadQuoteScrapOpportunityPreview
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

  const quoteSubtotal = useMemo(
    () => quoteItems.reduce((sum, item) => sum + (item.subtotal || 0), 0) * (1 - operatorMargin / 100),
    [quoteItems, operatorMargin]
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
  const loadQuoteScrapOpportunityPreviewRef = useRef(onLoadQuoteScrapOpportunityPreview);

  useEffect(() => {
    loadQuoteScrapOpportunityPreviewRef.current = onLoadQuoteScrapOpportunityPreview;
  }, [onLoadQuoteScrapOpportunityPreview]);

  useEffect(() => {
    if (activeMenu !== "pricing" || !activeQuoteItemId) return;
    const timer = window.setTimeout(() => {
      loadQuoteScrapOpportunityPreviewRef.current(activeQuoteItemId);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeMenu, activeQuoteItemId]);

  return {
    activeQuoteItem,
    activeQuoteItemOpportunities,
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
