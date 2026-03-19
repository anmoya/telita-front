"use client";

import { useEffect, useMemo, useState } from "react";
import { AuditWorkbench } from "./audit-workbench";
import { CutsWorkbenchContainer } from "./cuts-workbench-container";
import { DashboardWorkbench } from "./dashboard-workbench";
import { getStatusLabel } from "../../../shared/api/status-labels";
import { LabelsWorkbenchContainer } from "./labels-workbench-container";
import { PricingWorkbench } from "./pricing-workbench";
import { QuotePreviewDialog } from "./quote-preview-dialog";
import { useCutsWorkbench } from "./use-cuts-workbench";
import { useAuditWorkbench } from "./use-audit-workbench";
import { usePricingWorkbenchActions } from "./use-pricing-workbench-actions";
import { usePricingShell } from "./use-pricing-shell";
import type { QuoteScrapOpportunityRow } from "./pricing-workbench.types";
import { usePricingWorkbench } from "./use-pricing-workbench";
import { usePricingWorkbenchSupport } from "./use-pricing-workbench-support";
import { useScrapsWorkbench } from "./use-scraps-workbench";
import { useSettingsWorkbench } from "./use-settings-workbench";
import type {
  ActiveModal,
  CompatibleScrapsResult,
  CustomerOption,
  CutJobRow,
  CutJobStatus,
  MenuKey,
  PreviewResult,
  QuoteItem,
  QuoteItemCategory,
  ScrapRow,
  SoftHoldInfo,
} from "./pricing-workbench.shared-types";
import { SalesWorkbenchContainer } from "./sales-workbench-container";
import { ScrapsWorkbench } from "./scraps-workbench";
import { SettingsWorkbench } from "./settings-workbench";

type QuoteFormProps = {
  accessToken: string;
  activeMenu: MenuKey;
  onNavigate: (menu: MenuKey) => void;
  editingBatchId?: string | null;
  onClearEditingBatch?: () => void;
};

export function QuoteForm({ accessToken, activeMenu, onNavigate, editingBatchId, onClearEditingBatch }: QuoteFormProps) {
  const apiUrl = process.env.NEXT_PUBLIC_TELITA_API_URL ?? "http://localhost:3001/v1";

  // SPEC-32: Selectores dinámicos
  const [selectedPriceListName, setSelectedPriceListName] = useState("");
  const [skuOptions, setSkuOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [priceListOptions, setPriceListOptions] = useState<Array<{ name: string; isActive: boolean }>>([]);
  const [loadingSelectors, setLoadingSelectors] = useState(false);

  // SPEC-32: Multi-item
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { id: crypto.randomUUID(), widthM: "2.0", heightM: "2.0", quantity: "1", description: "" }
  ]);
  const [activeQuoteItemId, setActiveQuoteItemId] = useState<string | null>(null);
  const [quoteItemMatches, setQuoteItemMatches] = useState<QuoteScrapOpportunityRow[]>([]);
  const [quoteItemMatchesStatus, setQuoteItemMatchesStatus] = useState("");

  // SPEC-33: Categories
  const [categories, setCategories] = useState<QuoteItemCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // SPEC-34: batch calculation state
  const [loadingBatch, setLoadingBatch] = useState(false);

  // SPEC-35: customer fields in cotizador + create draft state
  const [quoteCustomerName, setQuoteCustomerName] = useState("");
  const [quoteCustomerReference, setQuoteCustomerReference] = useState("");
  const [quoteCustomerId, setQuoteCustomerId] = useState("");
  const [quoteManualDiscountPct, setQuoteManualDiscountPct] = useState("0");
  const [quoteManualDiscountReason, setQuoteManualDiscountReason] = useState("");
  const [loadingCreateDraft, setLoadingCreateDraft] = useState(false);

  // SPEC-38: Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // SPEC-32: Operator margin (no persistido en BD)
  const [operatorMargin, setOperatorMargin] = useState(0);

  // MVP-05: Abono del cliente
  const [quoteAmountPaid, setQuoteAmountPaid] = useState(0);

  // MVP-04.1: Modo edición de borrador
  const [quoteBatchId, setQuoteBatchId] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("");
  const [scrapStatus, setScrapStatus] = useState<string>("");
  const [cutsStatus, setCutsStatus] = useState<string>("");

  const [scrapId, setScrapId] = useState("");
  const [cutFilterStatus, setCutFilterStatus] = useState<CutJobStatus | "ALL">("PENDING");

  // Modal state
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
  const quoteSubtotalForActions = useMemo(
    () => quoteItems.reduce((sum, item) => sum + (item.subtotal || 0), 0) * (1 - operatorMargin / 100),
    [quoteItems, operatorMargin]
  );
  const activeQuoteId = useMemo(
    () =>
      quoteItems.find((item) => item.id === activeQuoteItemId)?.quoteId
      ?? quoteItems.find((item) => item.quoteId)?.quoteId
      ?? null,
    [quoteItems, activeQuoteItemId]
  );
  const shell = usePricingShell({ apiUrl, accessToken });

  // Load scrap policy on mount so cuts section is ready
  useEffect(() => {
    void settingsWorkbench.loadScrapPolicy();
    void shell.loadStatusLabels();
    void pricingSupport.loadSelectorsData();
    void pricingSupport.loadCategories();
    void pricingSupport.loadCustomers();
  }, []);

  const settingsWorkbench = useSettingsWorkbench({ apiUrl, accessToken });
  const pricingSupport = usePricingWorkbenchSupport({
    apiUrl,
    authedFetch: shell.authedFetch,
    quoteItems,
    selectedPriceListName,
    customers,
    setQuoteItems,
    setStatus,
    setQuoteCustomerName,
    setQuoteCustomerReference,
    setQuoteCustomerId,
    setQuoteManualDiscountPct,
    setQuoteManualDiscountReason,
    setActiveQuoteItemId,
    setQuoteItemMatches,
    setQuoteItemMatchesStatus,
    setCategories,
    setNewCategoryName,
    setLoadingSelectors,
    setSkuOptions,
    setPriceListOptions,
    setSelectedPriceListName,
    setCustomers,
    setQuoteAmountPaid,
    setQuoteBatchId
  });
  const pricingActions = usePricingWorkbenchActions({
    apiUrl,
    authedFetch: shell.authedFetch,
    quoteItems,
    selectedPriceListName,
    quoteCustomerId,
    quoteCustomerName,
    quoteCustomerReference,
    quoteManualDiscountPct,
    quoteManualDiscountReason,
    quoteSubtotal: quoteSubtotalForActions,
    quoteAmountPaid,
    quoteBatchId,
    setQuoteBatchId,
    setActiveQuoteItemId,
    setQuoteItemMatches,
    setQuoteItemMatchesStatus,
    setLoadingActionId,
    setLoadingBatch,
    setLoadingCreateDraft,
    setLoadingPreview,
    setPreviewData,
    setPreviewMode,
    setPreviewOpen,
    setQuoteItems,
    setStatus,
    onRefreshQuotes: shell.loadQuotes,
    onResetQuoteWorkbench: pricingSupport.resetQuoteWorkbench,
    onNavigate
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

  useEffect(() => {
    if (activeMenu === "dashboard") void shell.loadDashboard();
    if (activeMenu === "cuts") { void cutsWorkbench.loadCutJobs(); void cutsWorkbench.loadCutScrapPolicy(); void cutsWorkbench.loadSoftHoldPolicy(); }
    if (activeMenu === "settings") { void settingsWorkbench.loadScrapPolicy(); void cutsWorkbench.loadCutScrapPolicy(); void cutsWorkbench.loadSoftHoldPolicy(); }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "cuts") {
      void cutsWorkbench.loadCutJobs();
    }
  }, [activeMenu, cutFilterStatus, cutsWorkbench.cutPage]);

  // MVP-04.1: Cargar borrador cuando se navega desde historial
  useEffect(() => {
    if (editingBatchId && activeMenu === "pricing") {
      void pricingSupport.loadQuoteBatch(editingBatchId);
      onClearEditingBatch?.();
    }
  }, [editingBatchId, activeMenu]);

  const {
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
  } = usePricingWorkbench({
    activeMenu,
    quoteItems,
    activeQuoteItemId,
    quoteItemMatches,
    operatorMargin,
    onActiveQuoteItemIdChange: setActiveQuoteItemId,
    onLoadQuoteScrapOpportunityPreview: (itemId) => void pricingActions.loadQuoteScrapOpportunityPreview(itemId)
  });

  return (
    <section className={`panel ${activeMenu === "pricing" ? "panel--plain" : ""}`.trim()}>
      {activeMenu === "dashboard" ? (
        <DashboardWorkbench
          loadingMenu={shell.loadingMenu}
          dashboardKpis={shell.dashboardKpis}
          pendingScraps={shell.pendingScraps}
          auditEvents={shell.auditEvents}
          onRefresh={() => void shell.loadDashboard()}
          onNavigate={onNavigate}
        />
      ) : null}

      {activeMenu === "pricing" ? (
        <PricingWorkbench
          quoteItems={quoteItems}
          activeQuoteItemId={activeQuoteItemId}
          activeQuoteItemSkuCode={activeQuoteItem?.skuCode ?? null}
          activeQuoteItemOpportunityCount={activeQuoteItemOpportunities.length}
          quoteItemMatches={quoteItemMatches}
          quoteItemMatchesStatus={quoteItemMatchesStatus}
          quoteOpportunitySummary={quoteOpportunitySummary}
          loadingActionId={loadingActionId}
          quoteHasCalcErrors={quoteHasCalcErrors}
          quoteSubtotal={quoteSubtotal}
          operatorMargin={operatorMargin}
          quoteTax={quoteTax}
          quoteTotal={quoteTotal}
          quoteAmountPaid={quoteAmountPaid}
          onQuoteAmountPaidChange={setQuoteAmountPaid}
          quoteBatchId={quoteBatchId}
          pricingDocumentStatus={pricingDocumentStatus}
          pricingDocumentTone={pricingDocumentTone}
          selectedPriceListName={selectedPriceListName}
          loadingSelectors={loadingSelectors}
          customers={customers}
          quoteCustomerId={quoteCustomerId}
          quoteCustomerReference={quoteCustomerReference}
          quoteCustomerName={quoteCustomerName}
          priceListOptions={priceListOptions}
          quoteManualDiscountPct={quoteManualDiscountPct}
          quoteManualDiscountReason={quoteManualDiscountReason}
          categories={categories}
          newCategoryName={newCategoryName}
          skuOptions={skuOptions}
          loadingBatch={loadingBatch}
          loadingPreview={loadingPreview}
          loadingCreateDraft={loadingCreateDraft}
          quoteReady={quoteReady}
          status={status}
          onRefreshQuoteScrapOpportunities={() => void pricingActions.loadQuoteScrapOpportunityPreview(activeQuoteItem?.id ?? undefined)}
          onApplyQuoteCustomerSelection={pricingSupport.applyQuoteCustomerSelection}
          onQuoteCustomerReferenceChange={setQuoteCustomerReference}
          onQuoteCustomerNameChange={setQuoteCustomerName}
          onSelectedPriceListNameChange={setSelectedPriceListName}
          onOperatorMarginChange={setOperatorMargin}
          onQuoteManualDiscountPctChange={setQuoteManualDiscountPct}
          onQuoteManualDiscountReasonChange={setQuoteManualDiscountReason}
          onAddQuoteItem={pricingSupport.addQuoteItem}
          onCalculateAll={() => void pricingActions.handleCalculateAll()}
          onFetchQuoteItemMatches={(itemId) => void pricingActions.handleFetchQuoteItemMatches(itemId)}
          onMoveItemUp={pricingSupport.moveItemUp}
          onMoveItemDown={pricingSupport.moveItemDown}
          onUpdateQuoteItem={pricingSupport.updateQuoteItem}
          onNewCategoryNameChange={setNewCategoryName}
          onCreateCategoryForItem={(itemId, name) => void pricingSupport.handleCreateCategoryForItem(itemId, name)}
          onCalculateItem={(itemId) => void pricingActions.handleCalculateItem(itemId, pricingSupport.updateQuoteItem)}
          onRemoveQuoteItem={pricingSupport.removeQuoteItem}
          onResetQuoteWorkbench={pricingSupport.resetQuoteWorkbench}
          onSaveToHistory={() => void pricingActions.handleSaveToHistory()}
          onPreviewCustomer={() => void pricingActions.handlePreview("CUSTOMER")}
          onCreateDraftFromQuote={() => void pricingActions.handleCreateDraftFromQuote()}
        />
      ) : null}

      {activeMenu === "sales" ? (
        <SalesWorkbenchContainer
          apiUrl={apiUrl}
          accessToken={accessToken}
          activeMenu={activeMenu}
          skuOptions={skuOptions}
          categories={categories}
          customers={customers}
          getSaleStatusLabel={(status) => getStatusLabel(shell.statusLabels, "sale", status)}
        />
      ) : null}

      {activeMenu === "cuts" ? (
        <CutsWorkbenchContainer
          loadingMenu={shell.loadingMenu}
          cutsStatus={cutsStatus}
          cutJobs={cutJobs}
          cutPage={cutsWorkbench.cutPage}
          cutPageCount={cutsWorkbench.cutPageCount}
          totalCuts={cutsWorkbench.totalCuts}
          cutFilterStatus={cutFilterStatus}
          compatibleScrapsStatus={compatibleScrapsStatus}
          scrapPolicy={settingsWorkbench.scrapPolicy}
          cutScrapPolicy={settingsWorkbench.cutScrapPolicy}
          loadingActionId={loadingActionId}
          isPreCutLocationOpen={activeModal?.type === "pre-cut-location"}
          modalLocationCode={modalLocationCode}
          modalStatus={modalStatus}
          loadingModal={loadingModal}
          isCompatibleDialogOpen={activeModal?.type === "cut-compatible-scraps" || activeModal?.type === "require-decision-scraps"}
          isRequireDecisionMode={activeModal?.type === "require-decision-scraps"}
          decisionCutJobId={activeModal?.type === "require-decision-scraps" ? activeModal.cutJobId : undefined}
          compatibleScrapsResult={compatibleScrapsResult}
          softHolds={softHolds}
          softHoldPolicy={settingsWorkbench.softHoldPolicy}
          statusLabels={shell.statusLabels}
          onSetCutFilterStatus={setCutFilterStatus}
          onPrevCutPage={cutsWorkbench.prevCutPage}
          onNextCutPage={cutsWorkbench.nextCutPage}
          onRefreshCutJobs={() => void cutsWorkbench.loadCutJobs()}
          onCheckCompatibleScraps={(cutJobId) => void cutsWorkbench.handleCheckCompatibleScraps(cutJobId)}
          onMarkCutClick={(cutJobId) => void cutsWorkbench.onMarkCutClick(cutJobId)}
          onModalLocationCodeChange={setModalLocationCode}
          onConfirmModalMarkCut={() => void cutsWorkbench.handleModalMarkCut()}
          onClosePreCutLocation={() => setActiveModal(null)}
          onCloseCompatibleDialog={() => setActiveModal(null)}
          onSkipCompatibleScraps={(cutJobId) => void cutsWorkbench.handleSkipCompatibleScraps(cutJobId)}
          onAllocateCompatibleScrap={(saleId, saleLineId, scrapId) => void cutsWorkbench.handleAllocateFromOffer(saleId, saleLineId, scrapId)}
          onCreateSoftHold={(scrapId, saleId, saleLineId) => void cutsWorkbench.handleCreateSoftHold(scrapId, saleId, saleLineId)}
          onReleaseSoftHold={(scrapId) => void cutsWorkbench.handleReleaseSoftHold(scrapId)}
          onCompatibleStatusChange={setCompatibleScrapsStatus}
        />
      ) : null}

      {activeMenu === "scraps" ? (
        <ScrapsWorkbench
          loadingMenu={shell.loadingMenu}
          scrapStatus={scrapStatus}
          scraps={scraps}
          scrapFilterStatus={scrapsWorkbench.scrapFilterStatus}
          scrapPage={scrapsWorkbench.scrapPage}
          scrapPageCount={scrapsWorkbench.scrapPageCount}
          totalScraps={scrapsWorkbench.totalScraps}
          selectedScrapIds={scrapsWorkbench.selectedScrapIds}
          scrapId={scrapId}
          isAssignLocationOpen={activeModal?.type === "assign-scrap-location"}
          modalLocationCode={modalLocationCode}
          modalStatus={modalStatus}
          loadingModal={loadingModal}
          getScrapStatusLabel={(status) => getStatusLabel(shell.statusLabels, "scrap", status)}
          onSetScrapFilterStatus={scrapsWorkbench.setScrapFilterStatus}
          onSelectScrap={setScrapId}
          onPrevScrapPage={scrapsWorkbench.prevScrapPage}
          onNextScrapPage={scrapsWorkbench.nextScrapPage}
          onRefreshScraps={() => void scrapsWorkbench.handleListScraps()}
          onPrintSelectedScrapLabels={() => void scrapsWorkbench.handlePrintScrapLabels()}
          onSetSelectedScrapIds={scrapsWorkbench.setSelectedScrapIds}
          onToggleScrapSelection={scrapsWorkbench.toggleScrapSelection}
          onOpenAssignLocation={(targetScrapId) => {
            setActiveModal({ type: "assign-scrap-location", scrapId: targetScrapId });
            setModalLocationCode("");
            setModalStatus("");
          }}
          onCreateScrapLabel={(targetScrapId) => void scrapsWorkbench.handleCreateScrapLabel(targetScrapId)}
          onModalLocationCodeChange={setModalLocationCode}
          onConfirmAssignLocation={() => void scrapsWorkbench.handleModalAssignLocation()}
          onCloseAssignLocation={() => setActiveModal(null)}
        />
      ) : null}

      {activeMenu === "labels" ? (
        <LabelsWorkbenchContainer
          apiUrl={apiUrl}
          accessToken={accessToken}
          activeMenu={activeMenu}
          quoteId={activeQuoteId}
          scrapId={scrapId}
        />
      ) : null}

      {activeMenu === "settings" ? (
        <SettingsWorkbench
          loadingMenu={shell.loadingMenu}
          loadingActionId={loadingActionId}
          settingsStatus={settingsWorkbench.settingsStatus}
          scrapPolicy={settingsWorkbench.scrapPolicy}
          scrapMinWidthCmInput={settingsWorkbench.scrapMinWidthCmInput}
          cutScrapPolicy={settingsWorkbench.cutScrapPolicy}
          softHoldPolicy={settingsWorkbench.softHoldPolicy}
          onRefreshScrapPolicy={() => void settingsWorkbench.loadScrapPolicy()}
          onScrapMinWidthCmInputChange={settingsWorkbench.setScrapMinWidthCmInput}
          onUpdateScrapPolicy={(locationPolicy) => void settingsWorkbench.handleUpdateScrapPolicy(locationPolicy, setLoadingActionId)}
          onUpdateCutScrapPolicy={(updates) => void settingsWorkbench.handleUpdateCutScrapPolicy(updates, setLoadingActionId)}
          onUpdateSoftHoldPolicy={(updates) => void settingsWorkbench.handleUpdateSoftHoldPolicy(updates, setLoadingActionId)}
        />
      ) : null}

      {activeMenu === "audit" ? (
        <AuditWorkbench
          loadingMenu={auditWorkbench.loadingMenu}
          auditEvents={auditWorkbench.auditEvents}
          auditEntityFilter={auditWorkbench.auditEntityFilter}
          auditEntityIdInput={auditWorkbench.auditEntityIdInput}
          auditPage={auditWorkbench.auditPage}
          auditPageCount={auditWorkbench.auditPageCount}
          totalAuditEvents={auditWorkbench.totalAuditEvents}
          onSetAuditEntityFilter={auditWorkbench.setAuditEntityFilter}
          onAuditEntityIdInputChange={auditWorkbench.setAuditEntityIdInput}
          onApplyAuditEntityId={auditWorkbench.applyAuditEntityId}
          onClearAuditEntityId={auditWorkbench.clearAuditEntityId}
          onPrevAuditPage={auditWorkbench.prevAuditPage}
          onNextAuditPage={auditWorkbench.nextAuditPage}
          onRefresh={() => void auditWorkbench.loadAudit()}
        />
      ) : null}

      <QuotePreviewDialog
        open={previewOpen}
        previewMode={previewMode}
        previewData={previewData}
        amountPaid={quoteAmountPaid}
        onClose={() => setPreviewOpen(false)}
        onSwitchMode={(mode) => { void pricingActions.handlePreview(mode); }}
      />
    </section>
  );
}
