"use client";

import { useEffect, useState } from "react";
import { buildAuditProps, buildCutsProps, buildDashboardProps, buildLabelsProps, buildSalesProps, buildScrapsProps, buildSettingsProps } from "./build-quote-form-operational-props";
import { usePricingWorkbenchActions } from "./use-pricing-workbench-actions";
import { usePricingShell } from "./use-pricing-shell";
import { usePricingWorkbenchSupport } from "./use-pricing-workbench-support";
import type { QuoteEditorControllerState } from "./use-quote-editor-controller";
import type {
  ActiveModal,
  CompatibleScrapsResult,
  CustomerOption,
  CutJobRow,
  CutJobStatus,
  MenuKey,
  ScrapRow,
  SoftHoldInfo
} from "../../operations/shared/workbench.shared-types";
import { useAuditWorkbench } from "../../audit/components/use-audit-workbench";
import { useCutsWorkbench } from "../../cuts/components/use-cuts-workbench";
import { useScrapsWorkbench } from "../../scraps/components/use-scraps-workbench";
import { useSettingsWorkbench } from "../../settings/components/use-settings-workbench";
import { useQuoteFormMenuEffects } from "./use-quote-form-menu-effects";

type UseOperationsWorkbenchControllerArgs = {
  apiUrl: string;
  accessToken: string;
  activeMenu: MenuKey;
  onNavigate: (menu: MenuKey) => void;
  editingBatchId?: string | null;
  onClearEditingBatch?: () => void;
  editor: QuoteEditorControllerState;
};

export function useOperationsWorkbenchController({
  apiUrl,
  accessToken,
  activeMenu,
  onNavigate,
  editingBatchId,
  onClearEditingBatch,
  editor
}: UseOperationsWorkbenchControllerArgs) {
  const [scrapStatus, setScrapStatus] = useState("");
  const [cutsStatus, setCutsStatus] = useState("");
  const [scrapId, setScrapId] = useState("");
  const [cutFilterStatus, setCutFilterStatus] = useState<CutJobStatus | "ALL">("PENDING");
  const [cutSearch, setCutSearch] = useState("");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [modalLocationCode, setModalLocationCode] = useState("");
  const [modalStatus, setModalStatus] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [scraps, setScraps] = useState<ScrapRow[]>([]);
  const [cutJobs, setCutJobs] = useState<CutJobRow[]>([]);
  const [compatibleScrapsResult, setCompatibleScrapsResult] = useState<CompatibleScrapsResult | null>(null);
  const [compatibleScrapsStatus, setCompatibleScrapsStatus] = useState("");
  const [softHolds, setSoftHolds] = useState<Record<string, SoftHoldInfo>>({});
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const shell = usePricingShell({ apiUrl, accessToken });
  const settingsWorkbench = useSettingsWorkbench({ apiUrl, accessToken });
  const pricingSupport = usePricingWorkbenchSupport({
    apiUrl,
    authedFetch: shell.authedFetch,
    quoteItems: editor.quoteItems,
    selectedPriceListName: editor.selectedPriceListName,
    customers,
    setQuoteItems: editor.setQuoteItems,
    setStatus: editor.setStatus,
    setQuoteCustomerName: editor.setQuoteCustomerName,
    setQuoteCustomerReference: editor.setQuoteCustomerReference,
    setQuoteCustomerId: editor.setQuoteCustomerId,
    setQuoteManualDiscountPct: editor.setQuoteManualDiscountPct,
    setQuoteManualDiscountReason: editor.setQuoteManualDiscountReason,
    setActiveQuoteItemId: editor.setActiveQuoteItemId,
    setQuoteItemMatches: editor.setQuoteItemMatches,
    setQuoteItemMatchesStatus: editor.setQuoteItemMatchesStatus,
    setCategories: editor.setCategories,
    setNewCategoryName: editor.setNewCategoryName,
    setLoadingSelectors: editor.setLoadingSelectors,
    setSkuOptions: editor.setSkuOptions,
    setPriceListOptions: editor.setPriceListOptions,
    setSelectedPriceListName: editor.setSelectedPriceListName,
    setCustomers,
    setQuoteAmountPaid: editor.setQuoteAmountPaid,
    setQuoteBatchId: editor.setQuoteBatchId,
    setCustomerDiscountInfo: editor.setCustomerDiscountInfo,
    setCommercialAdjustmentPct: editor.setCommercialAdjustmentPct,
    setInstallationAmount: editor.setInstallationAmount
  });
  const pricingActions = usePricingWorkbenchActions({
    apiUrl,
    authedFetch: shell.authedFetch,
    quoteItems: editor.quoteItems,
    selectedPriceListName: editor.selectedPriceListName,
    quoteCustomerId: editor.quoteCustomerId,
    quoteCustomerName: editor.quoteCustomerName,
    quoteCustomerReference: editor.quoteCustomerReference,
    quoteManualDiscountPct: editor.quoteManualDiscountPct,
    quoteManualDiscountReason: editor.quoteManualDiscountReason,
    quoteSubtotal: editor.quoteSubtotalForActions,
    quoteAmountPaid: editor.quoteAmountPaid,
    commercialAdjustmentPct: editor.commercialAdjustmentPct,
    installationAmount: editor.installationAmount,
    quoteBatchId: editor.quoteBatchId,
    setQuoteBatchId: editor.setQuoteBatchId,
    setQuoteItemMatches: editor.setQuoteItemMatches,
    setQuoteItemMatchesStatus: editor.setQuoteItemMatchesStatus,
    setLoadingActionId,
    setLoadingBatch: editor.setLoadingBatch,
    setLoadingCreateDraft: editor.setLoadingCreateDraft,
    setLoadingPreview: editor.setLoadingPreview,
    setLoadingSave: editor.setLoadingSave,
    setPreviewData: editor.setPreviewData,
    setPreviewMode: editor.setPreviewMode,
    setPreviewOpen: editor.setPreviewOpen,
    setQuoteItems: editor.setQuoteItems,
    setStatus: editor.setStatus,
    onRefreshQuotes: shell.loadQuotes,
    onResetQuoteWorkbench: pricingSupport.resetQuoteWorkbench,
    onNavigate,
    onAfterSave: () => {
      editor.setQuoteBatchSnapshot({
        priceListName: editor.selectedPriceListName,
        customerId: editor.quoteCustomerId,
        customerName: editor.quoteCustomerName,
        customerReference: editor.quoteCustomerReference,
        commercialAdjustmentPct: editor.commercialAdjustmentPct,
        installationAmount: editor.installationAmount,
        amountPaid: editor.quoteAmountPaid,
        items: JSON.stringify(
          editor.quoteItems.map((it) => ({
            skuCode: it.skuCode ?? "",
            widthM: it.widthM,
            heightM: it.heightM,
            quantity: it.quantity,
            categoryId: it.categoryId ?? "",
            categoryName: it.categoryName ?? "",
            lineNote: it.lineNote ?? "",
            roomAreaName: it.roomAreaName ?? ""
          }))
        )
      });
    }
  });
  const scrapsWorkbench = useScrapsWorkbench({
    apiUrl,
    accessToken,
    activeMenu,
    scrapId,
    activeModal,
    modalLocationCode,
    setLoadingMenu: shell.setLoadingMenu,
    setLoadingModal,
    setScrapStatus,
    setScraps,
    setScrapId,
    setActiveModal,
    setModalStatus
  });
  const cutsWorkbench = useCutsWorkbench({
    apiUrl,
    authedFetch: shell.authedFetch,
    cutFilterStatus,
    cutSearch,
    scrapPolicy: settingsWorkbench.scrapPolicy,
    softHoldPolicy: settingsWorkbench.softHoldPolicy,
    activeModal,
    modalLocationCode,
    setLoadingMenu: shell.setLoadingMenu,
    setCutsStatus,
    setCutJobs,
    setCutScrapPolicy: settingsWorkbench.setCutScrapPolicy,
    setCompatibleScrapsStatus,
    setCompatibleScrapsResult,
    setLoadingActionId,
    setActiveModal,
    setModalLocationCode,
    setModalStatus,
    setLoadingModal,
    setScrapPolicy: settingsWorkbench.setScrapPolicy,
    setScrapMinWidthCmInput: settingsWorkbench.setScrapMinWidthCmInput,
    setScrapId,
    setSoftHoldPolicy: settingsWorkbench.setSoftHoldPolicy,
    setSoftHolds,
    onRefreshScraps: () => void scrapsWorkbench.handleListScraps()
  });
  const auditWorkbench = useAuditWorkbench({
    apiUrl,
    accessToken,
    activeMenu
  });

  async function handleLoadEditingBatch(batchId: string) {
    const batch = await pricingSupport.loadQuoteBatch(batchId);
    if (!batch) return;
    editor.applyLoadedQuoteBatch(batch);
  }

  useEffect(() => {
    void settingsWorkbench.loadScrapPolicy();
    void settingsWorkbench.loadCutSheetPolicy();
    void shell.loadStatusLabels();
    void pricingSupport.loadSelectorsData();
    void pricingSupport.loadCategories();
    void pricingSupport.loadCustomers();
  }, []);

  useQuoteFormMenuEffects({
    activeMenu,
    cutPage: cutsWorkbench.cutPage,
    editingBatchId,
    onLoadDashboard: shell.loadDashboard,
    onLoadCutJobs: cutsWorkbench.loadCutJobs,
    onLoadCutScrapPolicy: cutsWorkbench.loadCutScrapPolicy,
    onLoadSoftHoldPolicy: cutsWorkbench.loadSoftHoldPolicy,
    onLoadScrapPolicy: settingsWorkbench.loadScrapPolicy,
    onLoadCutSheetPolicy: settingsWorkbench.loadCutSheetPolicy,
    onLoadEditingBatch: handleLoadEditingBatch,
    onClearEditingBatch
  });

  return {
    customers,
    pricingSupport,
    pricingActions,
    loadingActionId,
    dashboardProps: buildDashboardProps({
      loadingMenu: shell.loadingMenu,
      dashboardKpis: shell.dashboardKpis,
      pendingScraps: shell.pendingScraps,
      auditEvents: shell.auditEvents,
      onRefresh: () => void shell.loadDashboard(),
      onNavigate
    }),
    salesProps: buildSalesProps({
      apiUrl,
      accessToken,
      activeMenu,
      skuOptions: editor.skuOptions,
      categories: editor.categories,
      customers,
      cutSheetPolicy: settingsWorkbench.cutSheetPolicy,
      statusLabels: shell.statusLabels,
      initialSearchQuery: editor.salesInitialSearch
    }),
    cutsProps: buildCutsProps({
      loadingMenu: shell.loadingMenu,
      cutsStatus,
      cutJobs,
      cutPage: cutsWorkbench.cutPage,
      cutPageCount: cutsWorkbench.cutPageCount,
      totalCuts: cutsWorkbench.totalCuts,
      cutFilterStatus,
      cutSearch,
      compatibleScrapsStatus,
      scrapPolicy: settingsWorkbench.scrapPolicy,
      cutScrapPolicy: settingsWorkbench.cutScrapPolicy,
      loadingActionId,
      activeModal,
      modalLocationCode,
      modalStatus,
      loadingModal,
      compatibleScrapsResult,
      softHolds,
      softHoldPolicy: settingsWorkbench.softHoldPolicy,
      statusLabels: shell.statusLabels,
      setCutFilterStatus,
      setCutSearch,
      setActiveModal,
      setModalLocationCode,
      prevCutPage: cutsWorkbench.prevCutPage,
      nextCutPage: cutsWorkbench.nextCutPage,
      loadCutJobs: cutsWorkbench.loadCutJobs,
      handleCheckCompatibleScraps: cutsWorkbench.handleCheckCompatibleScraps,
      onMarkCutClick: cutsWorkbench.onMarkCutClick,
      handleModalMarkCut: cutsWorkbench.handleModalMarkCut,
      handleSkipCompatibleScraps: cutsWorkbench.handleSkipCompatibleScraps,
      handleAllocateFromOffer: cutsWorkbench.handleAllocateFromOffer,
      handleCreateSoftHold: cutsWorkbench.handleCreateSoftHold,
      handleReleaseSoftHold: cutsWorkbench.handleReleaseSoftHold
    }),
    scrapsProps: buildScrapsProps({
      loadingMenu: shell.loadingMenu,
      scrapStatus,
      scraps,
      scrapFilterStatus: scrapsWorkbench.scrapFilterStatus,
      scrapSearchQuery: scrapsWorkbench.scrapSearchQuery,
      scrapPage: scrapsWorkbench.scrapPage,
      scrapPageCount: scrapsWorkbench.scrapPageCount,
      totalScraps: scrapsWorkbench.totalScraps,
      selectedScrapIds: scrapsWorkbench.selectedScrapIds,
      scrapId,
      activeModal,
      modalLocationCode,
      modalStatus,
      loadingModal,
      statusLabels: shell.statusLabels,
      setScrapId,
      setActiveModal,
      setModalLocationCode,
      setModalStatus,
      setSalesInitialSearch: editor.setSalesInitialSearch,
      onNavigate,
      scrapsWorkbench
    }),
    labelsProps: buildLabelsProps({
      apiUrl,
      accessToken,
      activeMenu,
      quoteId: editor.activeQuoteId,
      scrapId
    }),
    settingsProps: buildSettingsProps({
      loadingMenu: shell.loadingMenu,
      loadingActionId,
      settingsStatus: settingsWorkbench.settingsStatus,
      scrapPolicy: settingsWorkbench.scrapPolicy,
      scrapMinWidthCmInput: settingsWorkbench.scrapMinWidthCmInput,
      cutScrapPolicy: settingsWorkbench.cutScrapPolicy,
      softHoldPolicy: settingsWorkbench.softHoldPolicy,
      cutSheetPolicy: settingsWorkbench.cutSheetPolicy,
      loadScrapPolicy: settingsWorkbench.loadScrapPolicy,
      loadCutSheetPolicy: settingsWorkbench.loadCutSheetPolicy,
      loadCutScrapPolicy: cutsWorkbench.loadCutScrapPolicy,
      loadSoftHoldPolicy: cutsWorkbench.loadSoftHoldPolicy,
      setScrapMinWidthCmInput: settingsWorkbench.setScrapMinWidthCmInput,
      handleUpdateScrapPolicy: (locationPolicy) => void settingsWorkbench.handleUpdateScrapPolicy(locationPolicy, setLoadingActionId),
      handleUpdateCutScrapPolicy: (updates) => void settingsWorkbench.handleUpdateCutScrapPolicy(updates, setLoadingActionId),
      handleUpdateSoftHoldPolicy: (updates) => void settingsWorkbench.handleUpdateSoftHoldPolicy(updates, setLoadingActionId),
      handleUpdateCutSheetPolicy: (updates) => void settingsWorkbench.handleUpdateCutSheetPolicy(updates, setLoadingActionId)
    }),
    auditProps: buildAuditProps({
      loadingMenu: auditWorkbench.loadingMenu,
      auditEvents: auditWorkbench.auditEvents,
      auditEntityFilter: auditWorkbench.auditEntityFilter,
      auditEntityIdInput: auditWorkbench.auditEntityIdInput,
      auditPage: auditWorkbench.auditPage,
      auditPageCount: auditWorkbench.auditPageCount,
      totalAuditEvents: auditWorkbench.totalAuditEvents,
      setAuditEntityFilter: auditWorkbench.setAuditEntityFilter,
      setAuditEntityIdInput: auditWorkbench.setAuditEntityIdInput,
      applyAuditEntityId: auditWorkbench.applyAuditEntityId,
      clearAuditEntityId: auditWorkbench.clearAuditEntityId,
      prevAuditPage: auditWorkbench.prevAuditPage,
      nextAuditPage: auditWorkbench.nextAuditPage,
      loadAudit: auditWorkbench.loadAudit
    })
  };
}
