"use client";

import { LabelPreviewDialog } from "./label-preview-dialog";
import { LabelsWorkbench } from "./labels-workbench";
import { useLabelsWorkbench } from "./use-labels-workbench";

type LabelsWorkbenchContainerProps = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
  quoteId: string | null;
  scrapId: string;
};

export function LabelsWorkbenchContainer({
  apiUrl,
  accessToken,
  activeMenu,
  quoteId,
  scrapId
}: LabelsWorkbenchContainerProps) {
  const labels = useLabelsWorkbench({
    apiUrl,
    accessToken,
    activeMenu,
    quoteId,
    scrapId
  });

  return (
    <>
      <LabelsWorkbench
        apiUrl={apiUrl}
        loadingMenu={labels.loadingMenu}
        loadingActionId={labels.loadingActionId}
        labelStatus={labels.labelStatus}
        batchSaleId={labels.batchSaleId}
        batchResults={labels.batchResults}
        labelId={labels.labelId}
        quoteResultAvailable={Boolean(quoteId)}
        scrapId={scrapId}
        labelList={labels.labelList}
        labelFilterType={labels.labelFilterType}
        labelPage={labels.labelPage}
        labelPageCount={labels.labelPageCount}
        totalLabels={labels.totalLabels}
        selectedLabelIds={labels.selectedLabelIds}
        onBatchSaleIdChange={labels.setBatchSaleId}
        onSetLabelFilterType={labels.setLabelFilterType}
        onPrevLabelPage={labels.prevLabelPage}
        onNextLabelPage={labels.nextLabelPage}
        onCreateBatchLabels={() => void labels.handleBatchLabels()}
        onOpenDocument={(url) => void labels.openAuthedHtmlDocument(url)}
        onCreateQuoteLabel={() => void labels.handleCreateQuoteLabel()}
        onCreateScrapLabel={() => void labels.handleCreateScrapLabel()}
        onReprintCurrentLabel={() => void labels.handleReprintCurrentLabel()}
        onRefreshLabels={() => void labels.handleListLabels()}
        onPrintSelectedLabels={() => void labels.handlePrintSelectedLabels()}
        onSetSelectedLabelIds={labels.setSelectedLabelIds}
        onToggleLabelSelection={labels.toggleLabelSelection}
        onOpenLabelPreview={(id) => void labels.openLabelPreview(id)}
        onReprintLabelById={(id) => void labels.handleReprintById(id)}
      />

      <LabelPreviewDialog
        preview={labels.labelPreview}
        loadingActionId={labels.loadingActionId}
        onClose={labels.closeLabelPreview}
        onReprint={(id) => {
          void labels.handleReprintById(id);
          labels.closeLabelPreview();
        }}
        onDownloadZpl={(id) => {
          void labels.handleDownloadZpl(id);
        }}
        onFetchZpl={labels.fetchZplContent}
      />
    </>
  );
}
