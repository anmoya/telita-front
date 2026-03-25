"use client";

import {
  buildMarginBreakdownDialogProps,
  buildPricingProps,
  buildQuotePreviewDialogProps
} from "./build-quote-form-pricing-props";
import { usePricingWorkbench } from "./use-pricing-workbench";
import type { MenuKey } from "../../operations/shared/workbench.shared-types";
import { useQuoteEditorController } from "./use-quote-editor-controller";
import { useOperationsWorkbenchController } from "./use-operations-workbench-controller";

type UseOperationsWorkbenchEntryArgs = {
  accessToken: string;
  activeMenu: MenuKey;
  onNavigate: (menu: MenuKey) => void;
  editingBatchId?: string | null;
  onClearEditingBatch?: () => void;
};

export function useOperationsWorkbenchEntry({
  accessToken,
  activeMenu,
  onNavigate,
  editingBatchId,
  onClearEditingBatch
}: UseOperationsWorkbenchEntryArgs) {
  const apiUrl = process.env.NEXT_PUBLIC_TELITA_API_URL ?? "http://localhost:3001/v1";
  const editor = useQuoteEditorController();

  const {
    customers,
    pricingSupport,
    pricingActions,
    loadingActionId,
    dashboardProps,
    salesProps,
    cutsProps,
    scrapsProps,
    labelsProps,
    settingsProps,
    auditProps
  } = useOperationsWorkbenchController({
    apiUrl,
    accessToken,
    activeMenu,
    onNavigate,
    editingBatchId,
    onClearEditingBatch,
    editor
  });

  const pricingWorkbench = usePricingWorkbench({
    activeMenu,
    quoteItems: editor.quoteItems,
    activeQuoteItemId: editor.activeQuoteItemId,
    quoteItemMatches: editor.quoteItemMatches,
    commercialAdjustmentPct: editor.commercialAdjustmentPct,
    installationAmount: editor.installationAmount,
    onActiveQuoteItemIdChange: editor.setActiveQuoteItemId
  });

  return {
    panelClassName: `panel ${activeMenu === "pricing" ? "panel--plain" : ""}`.trim(),
    dashboardProps,
    pricingProps: buildPricingProps({
      quoteItems: editor.quoteItems,
      activeQuoteItemId: editor.activeQuoteItemId,
      quoteOpportunityEligibleCount: pricingWorkbench.quoteOpportunityEligibleCount,
      quoteItemMatches: editor.quoteItemMatches,
      quoteItemMatchesStatus: editor.quoteItemMatchesStatus,
      quoteOpportunitySummary: pricingWorkbench.quoteOpportunitySummary,
      quoteOpportunityOpen: editor.quoteOpportunityOpen,
      loadingActionId,
      quoteHasCalcErrors: pricingWorkbench.quoteHasCalcErrors,
      quoteSubtotal: pricingWorkbench.quoteSubtotal,
      commercialAdjustmentPct: editor.commercialAdjustmentPct,
      commercialAdjustmentAmount: editor.commercialAdjustmentAmount,
      installationAmount: editor.installationAmount,
      quoteTax: pricingWorkbench.quoteTax,
      quoteTotal: pricingWorkbench.quoteTotal,
      quoteAmountPaid: editor.quoteAmountPaid,
      setQuoteAmountPaid: editor.setQuoteAmountPaid,
      quoteBatchId: editor.quoteBatchId,
      pricingDocumentStatus: pricingWorkbench.pricingDocumentStatus,
      pricingDocumentTone: pricingWorkbench.pricingDocumentTone,
      selectedPriceListName: editor.selectedPriceListName,
      loadingSelectors: editor.loadingSelectors,
      customers,
      quoteCustomerId: editor.quoteCustomerId,
      quoteCustomerReference: editor.quoteCustomerReference,
      quoteCustomerName: editor.quoteCustomerName,
      customerDiscountInfo: editor.customerDiscountInfo,
      priceListOptions: editor.priceListOptions,
      quoteManualDiscountPct: editor.quoteManualDiscountPct,
      quoteManualDiscountReason: editor.quoteManualDiscountReason,
      categories: editor.categories,
      newCategoryName: editor.newCategoryName,
      skuOptions: editor.skuOptions,
      loadingBatch: editor.loadingBatch,
      loadingPreview: editor.loadingPreview,
      loadingCreateDraft: editor.loadingCreateDraft,
      loadingSave: editor.loadingSave,
      quoteDirty: editor.quoteDirty,
      quoteReady: pricingWorkbench.quoteReady,
      status: editor.status,
      statusTone: editor.statusTone,
      setQuoteOpportunityOpen: editor.setQuoteOpportunityOpen,
      setQuoteCustomerReference: editor.setQuoteCustomerReference,
      setQuoteCustomerName: editor.setQuoteCustomerName,
      setSelectedPriceListName: editor.setSelectedPriceListName,
      setCommercialAdjustmentPct: editor.setCommercialAdjustmentPct,
      setInstallationAmount: editor.setInstallationAmount,
      setQuoteManualDiscountPct: editor.setQuoteManualDiscountPct,
      setQuoteManualDiscountReason: editor.setQuoteManualDiscountReason,
      setActiveQuoteItemId: editor.setActiveQuoteItemId,
      setNewCategoryName: editor.setNewCategoryName,
      setBreakdownOpen: editor.setBreakdownOpen,
      clearQuoteBatchSnapshot: editor.clearQuoteBatchSnapshot,
      pricingSupport,
      pricingActions
    }),
    salesProps,
    cutsProps,
    scrapsProps,
    labelsProps,
    settingsProps,
    auditProps,
    quotePreviewDialogProps: buildQuotePreviewDialogProps({
      previewOpen: editor.previewOpen,
      previewMode: editor.previewMode,
      previewData: editor.previewData,
      quoteAmountPaid: editor.quoteAmountPaid,
      setPreviewOpen: editor.setPreviewOpen,
      pricingActions
    }),
    marginBreakdownDialogProps: buildMarginBreakdownDialogProps({
      breakdownOpen: editor.breakdownOpen,
      quoteItems: editor.quoteItems,
      customerDiscountInfo: editor.customerDiscountInfo,
      commercialAdjustmentPct: editor.commercialAdjustmentPct,
      commercialAdjustmentAmount: editor.commercialAdjustmentAmount,
      installationAmount: editor.installationAmount,
      quoteAmountPaid: editor.quoteAmountPaid,
      setBreakdownOpen: editor.setBreakdownOpen
    })
  };
}
