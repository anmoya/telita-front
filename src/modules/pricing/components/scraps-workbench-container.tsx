"use client";

import { getStatusLabel, type StatusLabelsByEntity } from "../../../shared/api/status-labels";
import { ScrapsWorkbench } from "./scraps-workbench";
import { useScrapsWorkbench } from "./use-scraps-workbench";
import type { ActiveModal, ScrapRow } from "./pricing-workbench.shared-types";

type ScrapsWorkbenchContainerProps = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
  loadingMenu: boolean;
  scrapStatus: string;
  scraps: ScrapRow[];
  scrapId: string;
  activeModal: ActiveModal;
  modalLocationCode: string;
  modalStatus: string;
  loadingModal: boolean;
  statusLabels: StatusLabelsByEntity;
  setLoadingMenu: (value: boolean) => void;
  setLoadingModal: (value: boolean) => void;
  setScrapStatus: (value: string) => void;
  setScraps: (rows: ScrapRow[]) => void;
  setScrapId: (value: string) => void;
  setActiveModal: (value: ActiveModal) => void;
  setModalLocationCode: (value: string) => void;
  setModalStatus: (value: string) => void;
  onNavigateToSale?: (quoteCode: string) => void;
};

export function ScrapsWorkbenchContainer({
  apiUrl,
  accessToken,
  activeMenu,
  loadingMenu,
  scrapStatus,
  scraps,
  scrapId,
  activeModal,
  modalLocationCode,
  modalStatus,
  loadingModal,
  statusLabels,
  setLoadingMenu,
  setLoadingModal,
  setScrapStatus,
  setScraps,
  setScrapId,
  setActiveModal,
  setModalLocationCode,
  setModalStatus,
  onNavigateToSale
}: ScrapsWorkbenchContainerProps) {
  const scrapsWorkbench = useScrapsWorkbench({
    apiUrl,
    accessToken,
    activeMenu,
    scrapId,
    activeModal,
    modalLocationCode,
    setLoadingMenu,
    setLoadingModal,
    setScrapStatus,
    setScraps,
    setScrapId,
    setActiveModal,
    setModalStatus
  });

  return (
    <ScrapsWorkbench
      loadingMenu={loadingMenu}
      scrapStatus={scrapStatus}
      scraps={scraps}
      scrapFilterStatus={scrapsWorkbench.scrapFilterStatus}
      scrapSearchQuery={scrapsWorkbench.scrapSearchQuery}
      scrapPage={scrapsWorkbench.scrapPage}
      scrapPageCount={scrapsWorkbench.scrapPageCount}
      totalScraps={scrapsWorkbench.totalScraps}
      selectedScrapIds={scrapsWorkbench.selectedScrapIds}
      scrapId={scrapId}
      isAssignLocationOpen={activeModal?.type === "assign-scrap-location"}
      modalLocationCode={modalLocationCode}
      modalStatus={modalStatus}
      loadingModal={loadingModal}
      getScrapStatusLabel={(status) => getStatusLabel(statusLabels, "scrap", status)}
      onSetScrapFilterStatus={scrapsWorkbench.setScrapFilterStatus}
      onScrapSearchQueryChange={scrapsWorkbench.setScrapSearchQuery}
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
      labelPreviewHtml={scrapsWorkbench.labelPreviewHtml}
      onCloseLabelPreview={scrapsWorkbench.closeLabelPreview}
      onNavigateToSale={onNavigateToSale}
    />
  );
}
