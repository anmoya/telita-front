import assert from "node:assert/strict";
import test from "node:test";
import { buildPricingProps } from "./build-quote-form-pricing-props";

test("buildPricingProps wires quote opportunity opening and reset callbacks", async () => {
  let quoteOpportunityOpen = false;
  let breakdownOpen = false;
  let resetWorkbenchCalls = 0;
  let clearSnapshotCalls = 0;
  let openOpportunityCalls = 0;

  const props = buildPricingProps({
    quoteItems: [],
    activeQuoteItemId: null,
    quoteOpportunityEligibleCount: 0,
    quoteItemMatches: [],
    quoteItemMatchesStatus: "",
    quoteOpportunitySummary: { pieces: 0, lines: 0, recoveredValue: 0, orderCoveragePct: 0 },
    quoteOpportunityOpen,
    loadingActionId: null,
    quoteHasCalcErrors: false,
    quoteSubtotal: 0,
    commercialAdjustmentPct: 0,
    commercialAdjustmentAmount: 0,
    installationAmount: 0,
    quoteTax: 0,
    quoteTotal: 0,
    quoteAmountPaid: 0,
    setQuoteAmountPaid: () => undefined,
    quoteBatchId: null,
    pricingDocumentStatus: "Cotización",
    pricingDocumentTone: "draft",
    selectedPriceListName: "Lista base",
    loadingSelectors: false,
    customers: [],
    quoteCustomerId: "",
    quoteCustomerReference: "",
    quoteCustomerName: "",
    customerDiscountInfo: { text: "", pct: 0 },
    priceListOptions: [],
    quoteManualDiscountPct: "0",
    quoteManualDiscountReason: "",
    categories: [],
    newCategoryName: "",
    skuOptions: [],
    loadingBatch: false,
    loadingPreview: false,
    loadingCreateDraft: false,
    loadingSave: false,
    quoteDirty: false,
    quoteReady: false,
    status: "",
    statusTone: null,
    setQuoteOpportunityOpen: (value) => {
      quoteOpportunityOpen = typeof value === "function" ? value(quoteOpportunityOpen) : value;
    },
    setQuoteCustomerReference: () => undefined,
    setQuoteCustomerName: () => undefined,
    setSelectedPriceListName: () => undefined,
    setCommercialAdjustmentPct: () => undefined,
    setInstallationAmount: () => undefined,
    setQuoteManualDiscountPct: () => undefined,
    setQuoteManualDiscountReason: () => undefined,
    setActiveQuoteItemId: () => undefined,
    setNewCategoryName: () => undefined,
    setBreakdownOpen: (value) => {
      breakdownOpen = typeof value === "function" ? value(breakdownOpen) : value;
    },
    clearQuoteBatchSnapshot: () => {
      clearSnapshotCalls += 1;
    },
    pricingSupport: {
      applyQuoteCustomerSelection: () => undefined,
      addQuoteItem: () => undefined,
      duplicateQuoteItem: () => undefined,
      moveItemUp: () => undefined,
      moveItemDown: () => undefined,
      updateQuoteItem: () => undefined,
      handleCreateCategoryForItem: async () => undefined,
      removeQuoteItem: () => undefined,
      resetQuoteWorkbench: () => {
        resetWorkbenchCalls += 1;
      }
    },
    pricingActions: {
      handleOpenQuoteOpportunityPreview: async () => {
        openOpportunityCalls += 1;
      },
      handleCalculateAll: async () => undefined,
      handleCalculateItem: async () => undefined,
      handleSaveToHistory: async () => undefined,
      handlePreview: async () => undefined,
      handleCreateDraftFromQuote: async () => undefined
    }
  });

  props.onOpenQuoteOpportunity();
  props.onShowBreakdown();
  props.onResetQuoteWorkbench();

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(quoteOpportunityOpen, true);
  assert.equal(openOpportunityCalls, 1);
  assert.equal(breakdownOpen, true);
  assert.equal(resetWorkbenchCalls, 1);
  assert.equal(clearSnapshotCalls, 1);
});
