"use client";

import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { MarginBreakdownDialog } from "./margin-breakdown-dialog";
import { PricingWorkbench } from "./pricing-workbench";
import { QuotePreviewDialog } from "./quote-preview-dialog";
import type {
  CustomerOption,
  PreviewResult,
  QuoteItem,
  QuoteItemCategory
} from "../../operations/shared/workbench.shared-types";
import type { QuoteScrapOpportunityRow } from "../../operations/shared/workbench.types";

type BuildPricingPropsInput = {
  quoteItems: QuoteItem[];
  activeQuoteItemId: string | null;
  quoteOpportunityEligibleCount: number;
  quoteItemMatches: QuoteScrapOpportunityRow[];
  quoteItemMatchesStatus: string;
  quoteOpportunitySummary: ComponentProps<typeof PricingWorkbench>["quoteOpportunitySummary"];
  quoteOpportunityOpen: boolean;
  loadingActionId: string | null;
  quoteHasCalcErrors: boolean;
  quoteSubtotal: number;
  commercialAdjustmentPct: number;
  commercialAdjustmentAmount: number;
  installationAmount: number;
  quoteTax: number;
  quoteTotal: number;
  quoteAmountPaid: number;
  setQuoteAmountPaid: Dispatch<SetStateAction<number>>;
  quoteBatchId: string | null;
  pricingDocumentStatus: string;
  pricingDocumentTone: "success" | "draft";
  selectedPriceListName: string;
  loadingSelectors: boolean;
  customers: CustomerOption[];
  quoteCustomerId: string;
  quoteCustomerReference: string;
  quoteCustomerName: string;
  customerDiscountInfo: { text: string; pct: number };
  priceListOptions: ComponentProps<typeof PricingWorkbench>["priceListOptions"];
  quoteManualDiscountPct: string;
  quoteManualDiscountReason: string;
  categories: QuoteItemCategory[];
  newCategoryName: string;
  skuOptions: ComponentProps<typeof PricingWorkbench>["skuOptions"];
  loadingBatch: boolean;
  loadingPreview: boolean;
  loadingCreateDraft: boolean;
  loadingSave: boolean;
  quoteDirty: boolean;
  quoteReady: boolean;
  status: string;
  statusTone: "success" | "danger" | null;
  setQuoteOpportunityOpen: Dispatch<SetStateAction<boolean>>;
  setQuoteCustomerReference: Dispatch<SetStateAction<string>>;
  setQuoteCustomerName: Dispatch<SetStateAction<string>>;
  setSelectedPriceListName: Dispatch<SetStateAction<string>>;
  setCommercialAdjustmentPct: Dispatch<SetStateAction<number>>;
  setInstallationAmount: Dispatch<SetStateAction<number>>;
  setQuoteManualDiscountPct: Dispatch<SetStateAction<string>>;
  setQuoteManualDiscountReason: Dispatch<SetStateAction<string>>;
  setActiveQuoteItemId: Dispatch<SetStateAction<string | null>>;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  setBreakdownOpen: Dispatch<SetStateAction<boolean>>;
  clearQuoteBatchSnapshot: () => void;
  pricingSupport: {
    applyQuoteCustomerSelection: (selectedId: string) => void;
    addQuoteItem: () => void;
    duplicateQuoteItem: (itemId: string) => void;
    moveItemUp: (itemId: string) => void;
    moveItemDown: (itemId: string) => void;
    updateQuoteItem: (itemId: string, patch: Partial<QuoteItem>) => void;
    handleCreateCategoryForItem: (itemId: string, name: string) => Promise<void>;
    removeQuoteItem: (itemId: string) => void;
    resetQuoteWorkbench: () => void;
  };
  pricingActions: {
    handleOpenQuoteOpportunityPreview: () => Promise<void>;
    handleCalculateAll: () => Promise<void>;
    handleCalculateItem: (itemId: string, onQuoteItemPatch: (itemId: string, patch: Partial<QuoteItem>) => void) => Promise<void>;
    handleSaveToHistory: () => Promise<void>;
    handlePreview: (mode: "CUSTOMER" | "INTERNAL") => Promise<void>;
    handleCreateDraftFromQuote: () => Promise<void>;
  };
};

type BuildQuotePreviewDialogPropsInput = {
  previewOpen: boolean;
  previewMode: "CUSTOMER" | "INTERNAL";
  previewData: PreviewResult | null;
  quoteAmountPaid: number;
  setPreviewOpen: Dispatch<SetStateAction<boolean>>;
  pricingActions: {
    handlePreview: (mode: "CUSTOMER" | "INTERNAL") => Promise<void>;
  };
};

type BuildMarginBreakdownDialogPropsInput = {
  breakdownOpen: boolean;
  quoteItems: QuoteItem[];
  customerDiscountInfo: { text: string; pct: number };
  commercialAdjustmentPct: number;
  commercialAdjustmentAmount: number;
  installationAmount: number;
  quoteAmountPaid: number;
  setBreakdownOpen: Dispatch<SetStateAction<boolean>>;
};

export function buildPricingProps({
  quoteItems,
  activeQuoteItemId,
  quoteOpportunityEligibleCount,
  quoteItemMatches,
  quoteItemMatchesStatus,
  quoteOpportunitySummary,
  quoteOpportunityOpen,
  loadingActionId,
  quoteHasCalcErrors,
  quoteSubtotal,
  commercialAdjustmentPct,
  commercialAdjustmentAmount,
  installationAmount,
  quoteTax,
  quoteTotal,
  quoteAmountPaid,
  setQuoteAmountPaid,
  quoteBatchId,
  pricingDocumentStatus,
  pricingDocumentTone,
  selectedPriceListName,
  loadingSelectors,
  customers,
  quoteCustomerId,
  quoteCustomerReference,
  quoteCustomerName,
  customerDiscountInfo,
  priceListOptions,
  quoteManualDiscountPct,
  quoteManualDiscountReason,
  categories,
  newCategoryName,
  skuOptions,
  loadingBatch,
  loadingPreview,
  loadingCreateDraft,
  loadingSave,
  quoteDirty,
  quoteReady,
  status,
  statusTone,
  setQuoteOpportunityOpen,
  setQuoteCustomerReference,
  setQuoteCustomerName,
  setSelectedPriceListName,
  setCommercialAdjustmentPct,
  setInstallationAmount,
  setQuoteManualDiscountPct,
  setQuoteManualDiscountReason,
  setActiveQuoteItemId,
  setNewCategoryName,
  setBreakdownOpen,
  clearQuoteBatchSnapshot,
  pricingSupport,
  pricingActions
}: BuildPricingPropsInput): ComponentProps<typeof PricingWorkbench> {
  return {
    quoteItems,
    activeQuoteItemId,
    quoteOpportunityEligibleCount,
    quoteItemMatches,
    quoteItemMatchesStatus,
    quoteOpportunitySummary,
    quoteOpportunityOpen,
    loadingActionId,
    quoteHasCalcErrors,
    quoteSubtotal,
    commercialAdjustmentPct,
    commercialAdjustmentAmount,
    installationAmount,
    quoteTax,
    quoteTotal,
    quoteAmountPaid,
    onQuoteAmountPaidChange: setQuoteAmountPaid,
    quoteBatchId,
    pricingDocumentStatus,
    pricingDocumentTone,
    selectedPriceListName,
    loadingSelectors,
    customers,
    quoteCustomerId,
    quoteCustomerReference,
    quoteCustomerName,
    customerDiscountInfo,
    priceListOptions,
    quoteManualDiscountPct,
    quoteManualDiscountReason,
    categories,
    newCategoryName,
    skuOptions,
    loadingBatch,
    loadingPreview,
    loadingCreateDraft,
    loadingSave,
    quoteDirty,
    quoteReady,
    status,
    statusTone,
    onOpenQuoteOpportunity: () => {
      setQuoteOpportunityOpen(true);
      void pricingActions.handleOpenQuoteOpportunityPreview();
    },
    onCloseQuoteOpportunity: () => setQuoteOpportunityOpen(false),
    onApplyQuoteCustomerSelection: pricingSupport.applyQuoteCustomerSelection,
    onQuoteCustomerReferenceChange: setQuoteCustomerReference,
    onQuoteCustomerNameChange: setQuoteCustomerName,
    onSelectedPriceListNameChange: setSelectedPriceListName,
    onCommercialAdjustmentPctChange: setCommercialAdjustmentPct,
    onInstallationAmountChange: setInstallationAmount,
    onQuoteManualDiscountPctChange: setQuoteManualDiscountPct,
    onQuoteManualDiscountReasonChange: setQuoteManualDiscountReason,
    onAddQuoteItem: pricingSupport.addQuoteItem,
    onDuplicateQuoteItem: pricingSupport.duplicateQuoteItem,
    onCalculateAll: () => void pricingActions.handleCalculateAll(),
    onSelectQuoteItem: setActiveQuoteItemId,
    onMoveItemUp: pricingSupport.moveItemUp,
    onMoveItemDown: pricingSupport.moveItemDown,
    onUpdateQuoteItem: pricingSupport.updateQuoteItem,
    onNewCategoryNameChange: setNewCategoryName,
    onCreateCategoryForItem: (itemId, name) => void pricingSupport.handleCreateCategoryForItem(itemId, name),
    onCalculateItem: (itemId) => void pricingActions.handleCalculateItem(itemId, pricingSupport.updateQuoteItem),
    onRemoveQuoteItem: pricingSupport.removeQuoteItem,
    onResetQuoteWorkbench: () => {
      pricingSupport.resetQuoteWorkbench();
      clearQuoteBatchSnapshot();
    },
    onSaveToHistory: () => void pricingActions.handleSaveToHistory(),
    onPreviewCustomer: () => void pricingActions.handlePreview("CUSTOMER"),
    onCreateDraftFromQuote: () => void pricingActions.handleCreateDraftFromQuote(),
    onShowBreakdown: () => setBreakdownOpen(true)
  };
}

export function buildQuotePreviewDialogProps({
  previewOpen,
  previewMode,
  previewData,
  quoteAmountPaid,
  setPreviewOpen,
  pricingActions
}: BuildQuotePreviewDialogPropsInput): ComponentProps<typeof QuotePreviewDialog> {
  return {
    open: previewOpen,
    previewMode,
    previewData,
    amountPaid: quoteAmountPaid,
    onClose: () => setPreviewOpen(false),
    onSwitchMode: (mode) => {
      void pricingActions.handlePreview(mode);
    }
  };
}

export function buildMarginBreakdownDialogProps({
  breakdownOpen,
  quoteItems,
  customerDiscountInfo,
  commercialAdjustmentPct,
  commercialAdjustmentAmount,
  installationAmount,
  quoteAmountPaid,
  setBreakdownOpen
}: BuildMarginBreakdownDialogPropsInput): ComponentProps<typeof MarginBreakdownDialog> {
  return {
    open: breakdownOpen,
    quoteItems,
    customerDiscountInfo,
    commercialAdjustmentPct,
    commercialAdjustmentAmount,
    installationAmount,
    amountPaid: quoteAmountPaid,
    onClose: () => setBreakdownOpen(false)
  };
}
