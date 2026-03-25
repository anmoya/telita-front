import assert from "node:assert/strict";
import test from "node:test";
import { buildPricingWorkbenchModel } from "./use-pricing-workbench";

test("buildPricingWorkbenchModel computes quote totals and opportunity summary", () => {
  const result = buildPricingWorkbenchModel({
    quoteItems: [
      {
        id: "item-1",
        skuCode: "SKU-1",
        widthM: "1.5",
        heightM: "2.0",
        quantity: "2",
        subtotal: 15000,
        calcStatus: "ok",
        description: ""
      },
      {
        id: "item-2",
        skuCode: "SKU-2",
        widthM: "1.0",
        heightM: "1.0",
        quantity: "1",
        subtotal: 5000,
        calcStatus: "ok",
        description: ""
      }
    ],
    activeQuoteItemId: "item-1",
    quoteItemMatches: [
      { itemId: "item-1", recoveredValue: 4000 } as never,
      { itemId: "item-2", recoveredValue: 1500 } as never
    ],
    commercialAdjustmentPct: 10,
    installationAmount: 2000
  });

  assert.equal(result.activeQuoteItem?.id, "item-1");
  assert.equal(result.activeQuoteItemOpportunities.length, 1);
  assert.equal(result.quoteOpportunityEligibleCount, 2);
  assert.equal(result.commercialAdjustmentAmount, 2000);
  assert.equal(result.quoteSubtotal, 24000);
  assert.equal(result.quoteTax, 4560);
  assert.equal(result.quoteTotal, 28560);
  assert.equal(result.quoteOpportunitySummary.pieces, 2);
  assert.equal(result.quoteOpportunitySummary.lines, 2);
  assert.equal(result.quoteOpportunitySummary.recoveredValue, 5500);
  assert.equal(result.quoteReady, true);
  assert.equal(result.pricingDocumentStatus, "Calculada");
});

test("buildPricingWorkbenchModel marks quote as not ready when there are calc errors", () => {
  const result = buildPricingWorkbenchModel({
    quoteItems: [
      {
        id: "item-1",
        skuCode: "SKU-1",
        widthM: "1.5",
        heightM: "2.0",
        quantity: "2",
        subtotal: 0,
        calcStatus: "error",
        description: ""
      }
    ],
    activeQuoteItemId: "missing-item",
    quoteItemMatches: [],
    commercialAdjustmentPct: 0,
    installationAmount: 0
  });

  assert.equal(result.activeQuoteItem, null);
  assert.equal(result.quoteOpportunityEligibleCount, 1);
  assert.equal(result.quoteHasCalcErrors, true);
  assert.equal(result.quoteReady, false);
  assert.equal(result.pricingDocumentStatus, "Cotización");
  assert.equal(result.pricingDocumentTone, "draft");
});
