"use client";

import { useMemo, useState } from "react";
import type {
  CustomerOption,
  PreviewResult,
  QuoteItem,
  QuoteItemCategory,
} from "../../operations/shared/workbench.shared-types";
import type { QuoteScrapOpportunityRow } from "../../operations/shared/workbench.types";

export type QuoteBatchSnapshot = {
  priceListName: string;
  customerId: string;
  customerName: string;
  customerReference: string;
  commercialAdjustmentPct: number;
  installationAmount: number;
  amountPaid: number;
  items: string;
};

type LoadedQuoteBatch = {
  priceListName: string;
  customerId?: string | null;
  customerName?: string | null;
  customerReference?: string | null;
  commercialAdjustmentPct?: number | null;
  installationAmount?: number | null;
  amountPaid?: number | null;
  lines: Array<{
    displayOrder: number;
    skuCode: string;
    requestedWidthM: number;
    requestedHeightM: number;
    quantity: number;
    categoryId?: string | null;
    categoryName?: string | null;
    lineNote?: string | null;
    roomAreaName?: string | null;
  }>;
};

function createInitialQuoteItem(): QuoteItem {
  return { id: crypto.randomUUID(), widthM: "2.0", heightM: "2.0", quantity: "1", description: "" };
}

export function useQuoteEditorController() {
  const [selectedPriceListName, setSelectedPriceListName] = useState("");
  const [skuOptions, setSkuOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [priceListOptions, setPriceListOptions] = useState<Array<{ name: string; isActive: boolean }>>([]);
  const [loadingSelectors, setLoadingSelectors] = useState(false);

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([createInitialQuoteItem()]);
  const [activeQuoteItemId, setActiveQuoteItemId] = useState<string | null>(null);
  const [quoteItemMatches, setQuoteItemMatches] = useState<QuoteScrapOpportunityRow[]>([]);
  const [quoteItemMatchesStatus, setQuoteItemMatchesStatus] = useState("");

  const [categories, setCategories] = useState<QuoteItemCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [loadingBatch, setLoadingBatch] = useState(false);

  const [quoteCustomerName, setQuoteCustomerName] = useState("");
  const [quoteCustomerReference, setQuoteCustomerReference] = useState("");
  const [quoteCustomerId, setQuoteCustomerId] = useState("");
  const [quoteManualDiscountPct, setQuoteManualDiscountPct] = useState("0");
  const [quoteManualDiscountReason, setQuoteManualDiscountReason] = useState("");
  const [loadingCreateDraft, setLoadingCreateDraft] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [quoteOpportunityOpen, setQuoteOpportunityOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const [commercialAdjustmentPct, setCommercialAdjustmentPct] = useState(0);
  const [installationAmount, setInstallationAmount] = useState(0);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [quoteAmountPaid, setQuoteAmountPaid] = useState(0);

  const [customerDiscountInfo, setCustomerDiscountInfo] = useState<{ text: string; pct: number }>({ text: "", pct: 0 });
  const [quoteBatchId, setQuoteBatchId] = useState<string | null>(null);
  const [salesInitialSearch, setSalesInitialSearch] = useState("");
  const [quoteBatchSnapshot, setQuoteBatchSnapshot] = useState<QuoteBatchSnapshot | null>(null);

  const [status, setStatusMsg] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"success" | "danger" | null>(null);

  const quoteDirty = useMemo(() => {
    if (!quoteBatchId || !quoteBatchSnapshot) return false;
    const currentItems = JSON.stringify(
      quoteItems.map((it) => ({
        skuCode: it.skuCode ?? "",
        widthM: it.widthM,
        heightM: it.heightM,
        quantity: it.quantity,
        categoryId: it.categoryId ?? "",
        categoryName: it.categoryName ?? "",
        lineNote: it.lineNote ?? "",
        roomAreaName: it.roomAreaName ?? ""
      }))
    );
    return (
      quoteBatchSnapshot.priceListName !== selectedPriceListName ||
      quoteBatchSnapshot.customerId !== quoteCustomerId ||
      quoteBatchSnapshot.customerName !== quoteCustomerName ||
      quoteBatchSnapshot.customerReference !== quoteCustomerReference ||
      quoteBatchSnapshot.commercialAdjustmentPct !== commercialAdjustmentPct ||
      quoteBatchSnapshot.installationAmount !== installationAmount ||
      quoteBatchSnapshot.amountPaid !== quoteAmountPaid ||
      quoteBatchSnapshot.items !== currentItems
    );
  }, [
    commercialAdjustmentPct,
    installationAmount,
    quoteAmountPaid,
    quoteBatchId,
    quoteBatchSnapshot,
    quoteCustomerId,
    quoteCustomerName,
    quoteCustomerReference,
    quoteItems,
    selectedPriceListName
  ]);

  const quoteItemsBaseSubtotal = useMemo(
    () => quoteItems.reduce((sum, item) => sum + (item.subtotal || 0), 0),
    [quoteItems]
  );
  const commercialAdjustmentAmount = Math.round(quoteItemsBaseSubtotal * (commercialAdjustmentPct / 100));
  const quoteSubtotalForActions = useMemo(
    () => quoteItemsBaseSubtotal + commercialAdjustmentAmount + installationAmount,
    [quoteItemsBaseSubtotal, commercialAdjustmentAmount, installationAmount]
  );
  const activeQuoteId = useMemo(
    () =>
      quoteItems.find((item) => item.id === activeQuoteItemId)?.quoteId
      ?? quoteItems.find((item) => item.quoteId)?.quoteId
      ?? null,
    [quoteItems, activeQuoteItemId]
  );

  function setStatus(value: string, tone?: "success" | "danger") {
    setStatusMsg(value);
    setStatusTone(tone ?? null);
  }

  function applyLoadedQuoteBatch(batch: LoadedQuoteBatch) {
    setQuoteBatchSnapshot({
      priceListName: batch.priceListName,
      customerId: batch.customerId ?? "",
      customerName: batch.customerName ?? "",
      customerReference: batch.customerReference ?? "",
      commercialAdjustmentPct: batch.commercialAdjustmentPct ?? 0,
      installationAmount: batch.installationAmount ?? 0,
      amountPaid: batch.amountPaid ?? 0,
      items: JSON.stringify(
        batch.lines
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((line) => ({
            skuCode: line.skuCode,
            widthM: String(line.requestedWidthM),
            heightM: String(line.requestedHeightM),
            quantity: String(line.quantity),
            categoryId: line.categoryId ?? "",
            categoryName: line.categoryName ?? "",
            lineNote: line.lineNote ?? "",
            roomAreaName: line.roomAreaName ?? ""
          }))
      )
    });
  }

  function clearQuoteBatchSnapshot() {
    setQuoteBatchSnapshot(null);
  }

  return {
    selectedPriceListName,
    setSelectedPriceListName,
    skuOptions,
    setSkuOptions,
    priceListOptions,
    setPriceListOptions,
    loadingSelectors,
    setLoadingSelectors,
    quoteItems,
    setQuoteItems,
    activeQuoteItemId,
    setActiveQuoteItemId,
    quoteItemMatches,
    setQuoteItemMatches,
    quoteItemMatchesStatus,
    setQuoteItemMatchesStatus,
    categories,
    setCategories,
    newCategoryName,
    setNewCategoryName,
    loadingBatch,
    setLoadingBatch,
    quoteCustomerName,
    setQuoteCustomerName,
    quoteCustomerReference,
    setQuoteCustomerReference,
    quoteCustomerId,
    setQuoteCustomerId,
    quoteManualDiscountPct,
    setQuoteManualDiscountPct,
    quoteManualDiscountReason,
    setQuoteManualDiscountReason,
    loadingCreateDraft,
    setLoadingCreateDraft,
    previewOpen,
    setPreviewOpen,
    previewMode,
    setPreviewMode,
    previewData,
    setPreviewData,
    quoteOpportunityOpen,
    setQuoteOpportunityOpen,
    loadingPreview,
    setLoadingPreview,
    loadingSave,
    setLoadingSave,
    commercialAdjustmentPct,
    setCommercialAdjustmentPct,
    installationAmount,
    setInstallationAmount,
    breakdownOpen,
    setBreakdownOpen,
    quoteAmountPaid,
    setQuoteAmountPaid,
    customerDiscountInfo,
    setCustomerDiscountInfo,
    quoteBatchId,
    setQuoteBatchId,
    salesInitialSearch,
    setSalesInitialSearch,
    quoteBatchSnapshot,
    setQuoteBatchSnapshot,
    quoteDirty,
    status,
    statusTone,
    setStatus,
    commercialAdjustmentAmount,
    quoteSubtotalForActions,
    activeQuoteId,
    applyLoadedQuoteBatch,
    clearQuoteBatchSnapshot,
    setStatusMsg,
    setStatusTone
  };
}

export type QuoteEditorControllerState = ReturnType<typeof useQuoteEditorController>;
