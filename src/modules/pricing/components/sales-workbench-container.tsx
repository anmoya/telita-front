"use client";

import { AutoScrapAssignmentDialog } from "./auto-scrap-assignment-dialog";
import { SalesWorkbench } from "./sales-workbench";
import type { CustomerOption, QuoteItemCategory } from "./pricing-workbench.shared-types";
import { useSalesWorkbench } from "./use-sales-workbench";

type SkuOption = {
  code: string;
  name: string;
};

type SalesWorkbenchContainerProps = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
  skuOptions: SkuOption[];
  categories: QuoteItemCategory[];
  customers: CustomerOption[];
  getSaleStatusLabel: (status: string) => string;
};

export function SalesWorkbenchContainer({
  apiUrl,
  accessToken,
  activeMenu,
  skuOptions,
  categories,
  customers,
  getSaleStatusLabel
}: SalesWorkbenchContainerProps) {
  const sales = useSalesWorkbench({ apiUrl, accessToken, activeMenu });

  return (
    <>
      <SalesWorkbench
        apiUrl={apiUrl}
        loadingMenu={sales.loadingMenu}
        sales={sales.sales}
        salesStatus={sales.salesStatus}
        salesSearchQuery={sales.salesSearchQuery}
        saleId={sales.saleId}
        salesPage={sales.salesPage}
        salesPageCount={sales.salesPageCount}
        filteredSalesCount={sales.filteredSalesCount}
        pagedSales={sales.pagedSales}
        selectedSale={sales.selectedSale}
        selectedSaleTone={sales.selectedSaleTone}
        amountPaidInput={sales.amountPaidInput}
        loadingActionId={sales.loadingActionId}
        saleLinesModalSale={sales.saleLinesModalSale}
        isSaleLinesModalOpen={sales.isSaleLinesModalOpen}
        saleLinesStatus={sales.saleLinesStatus}
        saleLineDrafts={sales.saleLineDrafts}
        skuOptions={skuOptions}
        categories={categories}
        newLineSkuCode={sales.newLineSkuCode}
        newLineQty={sales.newLineQty}
        newLineWidth={sales.newLineWidth}
        newLineHeight={sales.newLineHeight}
        showOfferPreviewStatus={sales.showOfferPreviewStatus}
        offerPreviewStatus={sales.offerPreviewStatus}
        scrapSuggestions={sales.scrapSuggestions}
        suggestionStatus={sales.suggestionStatus}
        activeSuggestionLineId={sales.activeSuggestionLineId}
        activeSuggestionPieceId={sales.activeSuggestionPieceId}
        getSaleStatusLabel={getSaleStatusLabel}
        onSalesSearchQueryChange={sales.setSalesSearchQuery}
        onSelectSale={sales.selectSale}
        onOpenSaleLinesModal={sales.openSaleLinesModal}
        onRefreshSales={() => void sales.handleListSales()}
        onConfirmSale={(id) => void sales.handleConfirmSaleById(id)}
        customers={customers}
        onUpdateSaleCustomer={(id, customerId) => void sales.handleUpdateSaleCustomer(id, customerId)}
        onCancelSale={(id) => void sales.handleCancelSaleById(id)}
        onPrintSaleLabels={(id) => void sales.handlePrintSaleLabels(id)}
        onOpenDocument={(url) => void sales.openAuthedHtmlDocument(url)}
        onAmountPaidInputChange={sales.setAmountPaidInput}
        onUpdatePaymentSummary={() => void sales.handleUpdatePaymentSummary()}
        onPrevPage={sales.prevPage}
        onNextPage={sales.nextPage}
        onCloseSaleLinesModal={sales.closeSaleLinesModal}
        onOfferPreview={(id) => void sales.handleOfferPreview(id)}
        onFetchMatches={(targetSaleId, line) => void sales.handleFetchMatches(targetSaleId, line)}
        onAllocateScrap={(pieceId, targetScrapId) => void sales.handleAllocate(pieceId, targetScrapId)}
        onReleaseAllocation={(targetSaleId, saleLineId, pieceId) => void sales.handleRelease(targetSaleId, saleLineId, pieceId)}
        onUpdateSaleLineDraft={sales.updateSaleLineDraft}
        onUpdateSaleLine={(targetSaleId, draft, displayOrder) => void sales.handleUpdateSaleLine(targetSaleId, draft, displayOrder)}
        onRemoveSaleLine={(targetSaleId, saleLineId) => void sales.handleRemoveSaleLine(targetSaleId, saleLineId)}
        onNewLineSkuCodeChange={sales.setNewLineSkuCode}
        onNewLineQtyChange={sales.setNewLineQty}
        onNewLineWidthChange={sales.setNewLineWidth}
        onNewLineHeightChange={sales.setNewLineHeight}
        onAddSaleLine={(targetSaleId) => void sales.handleAddSaleLine(targetSaleId)}
      />

      <AutoScrapAssignmentDialog
        open={sales.isOfferPreviewOpen}
        preview={sales.offerPreviewResult}
        loadingActionId={sales.loadingActionId}
        onClose={sales.closeOfferPreview}
        onGeneratePickList={(saleId, items) => void sales.handleGeneratePickList(saleId, items)}
        onCommit={(saleId) => void sales.handleCommitAutoAssignment(saleId)}
      />
    </>
  );
}
