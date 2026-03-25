"use client";

import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { getStatusLabel } from "../../../shared/api/status-labels";
import type { StatusLabelsByEntity } from "../../../shared/api/status-labels";
import { AuditWorkbench } from "../../audit/components/audit-workbench";
import { CutsWorkbenchContainer } from "../../cuts/components/cuts-workbench-container";
import { DashboardWorkbench } from "../../dashboard/components/dashboard-workbench";
import { LabelsWorkbenchContainer } from "../../labels/components/labels-workbench-container";
import type {
  ActiveModal,
  AuditRow,
  CompatibleScrapsResult,
  CustomerOption,
  CutJobRow,
  CutJobStatus,
  DashboardKpis,
  MenuKey,
  PendingScrapRow,
  QuoteItemCategory,
  ScrapRow,
  SoftHoldInfo
} from "../../operations/shared/workbench.shared-types";
import { SalesWorkbenchContainer } from "../../sales/components/sales-workbench-container";
import { ScrapsWorkbench } from "../../scraps/components/scraps-workbench";
import { SettingsWorkbench } from "../../settings/components/settings-workbench";

type DashboardPropsInput = {
  loadingMenu: boolean;
  dashboardKpis: DashboardKpis | null;
  pendingScraps: PendingScrapRow[];
  auditEvents: AuditRow[];
  onRefresh: () => void;
  onNavigate: (menu: MenuKey) => void;
};

type SalesPropsInput = {
  apiUrl: string;
  accessToken: string;
  activeMenu: MenuKey;
  skuOptions: Array<{ code: string; name: string }>;
  categories: QuoteItemCategory[];
  customers: CustomerOption[];
  cutSheetPolicy: ComponentProps<typeof SalesWorkbenchContainer>["cutSheetPolicy"];
  statusLabels: StatusLabelsByEntity;
  initialSearchQuery: string;
};

type CutsPropsInput = {
  loadingMenu: boolean;
  cutsStatus: string;
  cutJobs: CutJobRow[];
  cutPage: number;
  cutPageCount: number;
  totalCuts: number;
  cutFilterStatus: CutJobStatus | "ALL";
  cutSearch: string;
  compatibleScrapsStatus: string;
  scrapPolicy: ComponentProps<typeof CutsWorkbenchContainer>["scrapPolicy"];
  cutScrapPolicy: ComponentProps<typeof CutsWorkbenchContainer>["cutScrapPolicy"];
  loadingActionId: string | null;
  activeModal: ActiveModal;
  modalLocationCode: string;
  modalStatus: string;
  loadingModal: boolean;
  compatibleScrapsResult: CompatibleScrapsResult | null;
  softHolds: Record<string, SoftHoldInfo>;
  softHoldPolicy: ComponentProps<typeof CutsWorkbenchContainer>["softHoldPolicy"];
  statusLabels: StatusLabelsByEntity;
  setCutFilterStatus: Dispatch<SetStateAction<CutJobStatus | "ALL">>;
  setCutSearch: Dispatch<SetStateAction<string>>;
  setActiveModal: Dispatch<SetStateAction<ActiveModal>>;
  setModalLocationCode: Dispatch<SetStateAction<string>>;
  prevCutPage: () => void;
  nextCutPage: () => void;
  loadCutJobs: () => Promise<void>;
  handleCheckCompatibleScraps: (cutJobId: string) => Promise<void>;
  onMarkCutClick: (cutJobId: string) => void;
  handleModalMarkCut: () => Promise<void>;
  handleSkipCompatibleScraps: (cutJobId: string) => Promise<void>;
  handleAllocateFromOffer: (saleId: string, saleLineId: string, scrapId: string) => Promise<boolean>;
  handleCreateSoftHold: (scrapId: string, saleId: string, saleLineId?: string) => Promise<void>;
  handleReleaseSoftHold: (scrapId: string) => Promise<void>;
};

type ScrapsPropsInput = {
  loadingMenu: boolean;
  scrapStatus: string;
  scraps: ScrapRow[];
  scrapFilterStatus: ComponentProps<typeof ScrapsWorkbench>["scrapFilterStatus"];
  scrapSearchQuery: string;
  scrapPage: number;
  scrapPageCount: number;
  totalScraps: number;
  selectedScrapIds: string[];
  scrapId: string;
  activeModal: ActiveModal;
  modalLocationCode: string;
  modalStatus: string;
  loadingModal: boolean;
  statusLabels: StatusLabelsByEntity;
  setScrapId: Dispatch<SetStateAction<string>>;
  setActiveModal: Dispatch<SetStateAction<ActiveModal>>;
  setModalLocationCode: Dispatch<SetStateAction<string>>;
  setModalStatus: Dispatch<SetStateAction<string>>;
  setSalesInitialSearch: Dispatch<SetStateAction<string>>;
  onNavigate: (menu: MenuKey) => void;
  scrapsWorkbench: {
    setScrapFilterStatus: ComponentProps<typeof ScrapsWorkbench>["onSetScrapFilterStatus"];
    setScrapSearchQuery: ComponentProps<typeof ScrapsWorkbench>["onScrapSearchQueryChange"];
    prevScrapPage: () => void;
    nextScrapPage: () => void;
    handleListScraps: () => Promise<void>;
    handlePrintScrapLabels: () => Promise<void>;
    setSelectedScrapIds: Dispatch<SetStateAction<string[]>>;
    toggleScrapSelection: (scrapId: string) => void;
    handleCreateScrapLabel: (scrapId: string) => Promise<void>;
    handleModalAssignLocation: () => Promise<void>;
    labelPreviewHtml: string | null;
    closeLabelPreview: () => void;
  };
};

type LabelsPropsInput = {
  apiUrl: string;
  accessToken: string;
  activeMenu: MenuKey;
  quoteId: string | null;
  scrapId: string;
};

type SettingsPropsInput = {
  loadingMenu: boolean;
  loadingActionId: string | null;
  settingsStatus: string;
  scrapPolicy: ComponentProps<typeof SettingsWorkbench>["scrapPolicy"];
  scrapMinWidthCmInput: string;
  cutScrapPolicy: ComponentProps<typeof SettingsWorkbench>["cutScrapPolicy"];
  softHoldPolicy: ComponentProps<typeof SettingsWorkbench>["softHoldPolicy"];
  cutSheetPolicy: ComponentProps<typeof SettingsWorkbench>["cutSheetPolicy"];
  loadScrapPolicy: () => Promise<void>;
  loadCutSheetPolicy: () => Promise<void>;
  loadCutScrapPolicy: () => Promise<void>;
  loadSoftHoldPolicy: () => Promise<void>;
  setScrapMinWidthCmInput: Dispatch<SetStateAction<string>>;
  handleUpdateScrapPolicy: ComponentProps<typeof SettingsWorkbench>["onUpdateScrapPolicy"];
  handleUpdateCutScrapPolicy: ComponentProps<typeof SettingsWorkbench>["onUpdateCutScrapPolicy"];
  handleUpdateSoftHoldPolicy: ComponentProps<typeof SettingsWorkbench>["onUpdateSoftHoldPolicy"];
  handleUpdateCutSheetPolicy: ComponentProps<typeof SettingsWorkbench>["onUpdateCutSheetPolicy"];
};

type AuditPropsInput = {
  loadingMenu: boolean;
  auditEvents: AuditRow[];
  auditEntityFilter: ComponentProps<typeof AuditWorkbench>["auditEntityFilter"];
  auditEntityIdInput: string;
  auditPage: number;
  auditPageCount: number;
  totalAuditEvents: number;
  setAuditEntityFilter: ComponentProps<typeof AuditWorkbench>["onSetAuditEntityFilter"];
  setAuditEntityIdInput: Dispatch<SetStateAction<string>>;
  applyAuditEntityId: () => void;
  clearAuditEntityId: () => void;
  prevAuditPage: () => void;
  nextAuditPage: () => void;
  loadAudit: () => Promise<void>;
};

export function buildDashboardProps({
  loadingMenu,
  dashboardKpis,
  pendingScraps,
  auditEvents,
  onRefresh,
  onNavigate
}: DashboardPropsInput): ComponentProps<typeof DashboardWorkbench> {
  return {
    loadingMenu,
    dashboardKpis,
    pendingScraps,
    auditEvents,
    onRefresh,
    onNavigate
  };
}

export function buildSalesProps({
  apiUrl,
  accessToken,
  activeMenu,
  skuOptions,
  categories,
  customers,
  cutSheetPolicy,
  statusLabels,
  initialSearchQuery
}: SalesPropsInput): ComponentProps<typeof SalesWorkbenchContainer> {
  return {
    apiUrl,
    accessToken,
    activeMenu,
    skuOptions,
    categories,
    customers,
    cutSheetPolicy,
    getSaleStatusLabel: (status) => getStatusLabel(statusLabels, "sale", status),
    initialSearchQuery
  };
}

export function buildCutsProps({
  loadingMenu,
  cutsStatus,
  cutJobs,
  cutPage,
  cutPageCount,
  totalCuts,
  cutFilterStatus,
  cutSearch,
  compatibleScrapsStatus,
  scrapPolicy,
  cutScrapPolicy,
  loadingActionId,
  activeModal,
  modalLocationCode,
  modalStatus,
  loadingModal,
  compatibleScrapsResult,
  softHolds,
  softHoldPolicy,
  statusLabels,
  setCutFilterStatus,
  setCutSearch,
  setActiveModal,
  setModalLocationCode,
  prevCutPage,
  nextCutPage,
  loadCutJobs,
  handleCheckCompatibleScraps,
  onMarkCutClick,
  handleModalMarkCut,
  handleSkipCompatibleScraps,
  handleAllocateFromOffer,
  handleCreateSoftHold,
  handleReleaseSoftHold
}: CutsPropsInput): ComponentProps<typeof CutsWorkbenchContainer> {
  return {
    loadingMenu,
    cutsStatus,
    cutJobs,
    cutPage,
    cutPageCount,
    totalCuts,
    cutFilterStatus,
    cutSearch,
    compatibleScrapsStatus,
    scrapPolicy,
    cutScrapPolicy,
    loadingActionId,
    isPreCutLocationOpen: activeModal?.type === "pre-cut-location",
    modalLocationCode,
    modalStatus,
    loadingModal,
    isCompatibleDialogOpen: activeModal?.type === "cut-compatible-scraps" || activeModal?.type === "require-decision-scraps",
    isRequireDecisionMode: activeModal?.type === "require-decision-scraps",
    decisionCutJobId: activeModal?.type === "require-decision-scraps" ? activeModal.cutJobId : undefined,
    compatibleScrapsResult,
    softHolds,
    softHoldPolicy,
    statusLabels,
    onSetCutFilterStatus: setCutFilterStatus,
    onSetCutSearch: setCutSearch,
    onPrevCutPage: prevCutPage,
    onNextCutPage: nextCutPage,
    onRefreshCutJobs: () => void loadCutJobs(),
    onCheckCompatibleScraps: (cutJobId) => void handleCheckCompatibleScraps(cutJobId),
    onMarkCutClick: (cutJobId) => void onMarkCutClick(cutJobId),
    onModalLocationCodeChange: setModalLocationCode,
    onConfirmModalMarkCut: () => void handleModalMarkCut(),
    onClosePreCutLocation: () => setActiveModal(null),
    onCloseCompatibleDialog: () => setActiveModal(null),
    onSkipCompatibleScraps: (cutJobId) => void handleSkipCompatibleScraps(cutJobId),
    onAllocateCompatibleScrap: (saleId, saleLineId, scrapId) => handleAllocateFromOffer(saleId, saleLineId, scrapId),
    onCreateSoftHold: (scrapId, saleId, saleLineId) => void handleCreateSoftHold(scrapId, saleId, saleLineId),
    onReleaseSoftHold: (scrapId) => void handleReleaseSoftHold(scrapId)
  };
}

export function buildScrapsProps({
  loadingMenu,
  scrapStatus,
  scraps,
  scrapFilterStatus,
  scrapSearchQuery,
  scrapPage,
  scrapPageCount,
  totalScraps,
  selectedScrapIds,
  scrapId,
  activeModal,
  modalLocationCode,
  modalStatus,
  loadingModal,
  statusLabels,
  setScrapId,
  setActiveModal,
  setModalLocationCode,
  setModalStatus,
  setSalesInitialSearch,
  onNavigate,
  scrapsWorkbench
}: ScrapsPropsInput): ComponentProps<typeof ScrapsWorkbench> {
  return {
    loadingMenu,
    scrapStatus,
    scraps,
    scrapFilterStatus,
    scrapSearchQuery,
    scrapPage,
    scrapPageCount,
    totalScraps,
    selectedScrapIds,
    scrapId,
    isAssignLocationOpen: activeModal?.type === "assign-scrap-location",
    modalLocationCode,
    modalStatus,
    loadingModal,
    getScrapStatusLabel: (status) => getStatusLabel(statusLabels, "scrap", status),
    onSetScrapFilterStatus: scrapsWorkbench.setScrapFilterStatus,
    onScrapSearchQueryChange: scrapsWorkbench.setScrapSearchQuery,
    onSelectScrap: setScrapId,
    onPrevScrapPage: scrapsWorkbench.prevScrapPage,
    onNextScrapPage: scrapsWorkbench.nextScrapPage,
    onRefreshScraps: () => void scrapsWorkbench.handleListScraps(),
    onPrintSelectedScrapLabels: () => void scrapsWorkbench.handlePrintScrapLabels(),
    onSetSelectedScrapIds: scrapsWorkbench.setSelectedScrapIds,
    onToggleScrapSelection: scrapsWorkbench.toggleScrapSelection,
    onOpenAssignLocation: (targetScrapId) => {
      setActiveModal({ type: "assign-scrap-location", scrapId: targetScrapId });
      setModalLocationCode("");
      setModalStatus("");
    },
    onCreateScrapLabel: (targetScrapId) => void scrapsWorkbench.handleCreateScrapLabel(targetScrapId),
    onModalLocationCodeChange: setModalLocationCode,
    onConfirmAssignLocation: () => void scrapsWorkbench.handleModalAssignLocation(),
    onCloseAssignLocation: () => setActiveModal(null),
    labelPreviewHtml: scrapsWorkbench.labelPreviewHtml,
    onCloseLabelPreview: scrapsWorkbench.closeLabelPreview,
    onNavigateToSale: (quoteCode) => {
      setSalesInitialSearch(quoteCode);
      onNavigate("sales");
    }
  };
}

export function buildLabelsProps({
  apiUrl,
  accessToken,
  activeMenu,
  quoteId,
  scrapId
}: LabelsPropsInput): ComponentProps<typeof LabelsWorkbenchContainer> {
  return {
    apiUrl,
    accessToken,
    activeMenu,
    quoteId,
    scrapId
  };
}

export function buildSettingsProps({
  loadingMenu,
  loadingActionId,
  settingsStatus,
  scrapPolicy,
  scrapMinWidthCmInput,
  cutScrapPolicy,
  softHoldPolicy,
  cutSheetPolicy,
  loadScrapPolicy,
  loadCutSheetPolicy,
  loadCutScrapPolicy,
  loadSoftHoldPolicy,
  setScrapMinWidthCmInput,
  handleUpdateScrapPolicy,
  handleUpdateCutScrapPolicy,
  handleUpdateSoftHoldPolicy,
  handleUpdateCutSheetPolicy
}: SettingsPropsInput): ComponentProps<typeof SettingsWorkbench> {
  return {
    loadingMenu,
    loadingActionId,
    settingsStatus,
    scrapPolicy,
    scrapMinWidthCmInput,
    cutScrapPolicy,
    softHoldPolicy,
    cutSheetPolicy,
    onRefreshScrapPolicy: () => {
      void loadScrapPolicy();
      void loadCutSheetPolicy();
      void loadCutScrapPolicy();
      void loadSoftHoldPolicy();
    },
    onScrapMinWidthCmInputChange: setScrapMinWidthCmInput,
    onUpdateScrapPolicy: handleUpdateScrapPolicy,
    onUpdateCutScrapPolicy: handleUpdateCutScrapPolicy,
    onUpdateSoftHoldPolicy: handleUpdateSoftHoldPolicy,
    onUpdateCutSheetPolicy: handleUpdateCutSheetPolicy
  };
}

export function buildAuditProps({
  loadingMenu,
  auditEvents,
  auditEntityFilter,
  auditEntityIdInput,
  auditPage,
  auditPageCount,
  totalAuditEvents,
  setAuditEntityFilter,
  setAuditEntityIdInput,
  applyAuditEntityId,
  clearAuditEntityId,
  prevAuditPage,
  nextAuditPage,
  loadAudit
}: AuditPropsInput): ComponentProps<typeof AuditWorkbench> {
  return {
    loadingMenu,
    auditEvents,
    auditEntityFilter,
    auditEntityIdInput,
    auditPage,
    auditPageCount,
    totalAuditEvents,
    onSetAuditEntityFilter: setAuditEntityFilter,
    onAuditEntityIdInputChange: setAuditEntityIdInput,
    onApplyAuditEntityId: applyAuditEntityId,
    onClearAuditEntityId: clearAuditEntityId,
    onPrevAuditPage: prevAuditPage,
    onNextAuditPage: nextAuditPage,
    onRefresh: () => void loadAudit()
  };
}
