"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CustomerOption, QuoteItem, QuoteItemCategory } from "./pricing-workbench.shared-types";
import type { QuoteScrapOpportunityRow } from "./pricing-workbench.types";

type UsePricingWorkbenchSupportArgs = {
  apiUrl: string;
  authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  quoteItems: QuoteItem[];
  selectedPriceListName: string;
  customers: CustomerOption[];
  setQuoteItems: Dispatch<SetStateAction<QuoteItem[]>>;
  setStatus: (value: string) => void;
  setQuoteCustomerName: (value: string) => void;
  setQuoteCustomerReference: (value: string) => void;
  setQuoteCustomerId: (value: string) => void;
  setQuoteManualDiscountPct: (value: string) => void;
  setQuoteManualDiscountReason: (value: string) => void;
  setActiveQuoteItemId: (value: string | null) => void;
  setQuoteItemMatches: Dispatch<SetStateAction<QuoteScrapOpportunityRow[]>>;
  setQuoteItemMatchesStatus: (value: string) => void;
  setCategories: Dispatch<SetStateAction<QuoteItemCategory[]>>;
  setNewCategoryName: (value: string) => void;
  setLoadingSelectors: (value: boolean) => void;
  setSkuOptions: (value: Array<{ code: string; name: string }>) => void;
  setPriceListOptions: (value: Array<{ name: string; isActive: boolean }>) => void;
  setSelectedPriceListName: (value: string) => void;
  setCustomers: (value: CustomerOption[]) => void;
  setQuoteAmountPaid: (value: number) => void;
  setQuoteBatchId: (value: string | null) => void;
  setCustomerDiscountInfo: (value: { text: string; pct: number }) => void;
};

export function usePricingWorkbenchSupport({
  apiUrl,
  authedFetch,
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
  setQuoteBatchId,
  setCustomerDiscountInfo
}: UsePricingWorkbenchSupportArgs) {
  function addQuoteItem() {
    setQuoteItems((current) => [
      ...current,
      { id: crypto.randomUUID(), widthM: "", heightM: "", quantity: "1", description: "" }
    ]);
  }

  function removeQuoteItem(id: string) {
    if (quoteItems.length === 1) {
      setStatus("Debe haber al menos un ítem");
      return;
    }
    setQuoteItems((current) => current.filter((item) => item.id !== id));
    setQuoteItemMatches((current) => current.filter((match) => match.itemId !== id));
  }

  function updateQuoteItem(id: string, updates: Partial<QuoteItem>) {
    const shouldInvalidateQuote =
      updates.skuCode !== undefined ||
      updates.quantity !== undefined ||
      updates.widthM !== undefined ||
      updates.heightM !== undefined;

    setQuoteItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...updates,
          ...(shouldInvalidateQuote
            ? {
                calcStatus: undefined,
                calcError: undefined,
                quoteId: undefined,
                unitPrice: undefined,
                subtotal: undefined,
                priceMethod: undefined
              }
            : {})
        };
      })
    );
    if (shouldInvalidateQuote) {
      setQuoteItemMatches((current) => current.filter((match) => match.itemId !== id));
      setQuoteItemMatchesStatus("Recalcula el preview comercial de retazos para actualizar esta línea.");
    }
  }

  function resetQuoteWorkbench() {
    setQuoteItems([{ id: crypto.randomUUID(), widthM: "2.0", heightM: "2.0", quantity: "1", description: "" }]);
    setQuoteCustomerName("");
    setQuoteCustomerReference("");
    setQuoteCustomerId("");
    setQuoteManualDiscountPct("0");
    setQuoteManualDiscountReason("");
    setQuoteAmountPaid(0);
    setQuoteBatchId(null);
    setCustomerDiscountInfo({ text: "", pct: 0 });
    setActiveQuoteItemId(null);
    setQuoteItemMatches([]);
    setQuoteItemMatchesStatus("");
    setStatus("");
  }

  function moveItemUp(id: string) {
    const idx = quoteItems.findIndex((item) => item.id === id);
    if (idx <= 0) return;
    const next = [...quoteItems];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setQuoteItems(next);
  }

  function moveItemDown(id: string) {
    const idx = quoteItems.findIndex((item) => item.id === id);
    if (idx < 0 || idx >= quoteItems.length - 1) return;
    const next = [...quoteItems];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setQuoteItems(next);
  }

  async function loadCategories() {
    try {
      const res = await authedFetch(`${apiUrl}/quote-item-categories?branchCode=MAIN&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      // non-blocking
    }
  }

  async function handleCreateCategoryForItem(itemId: string, name: string) {
    if (!name.trim()) return;
    try {
      const res = await authedFetch(`${apiUrl}/quote-item-categories`, {
        method: "POST",
        body: JSON.stringify({ branchCode: "MAIN", name: name.trim() })
      });
      if (res.ok) {
        const cat: QuoteItemCategory = await res.json();
        setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
        updateQuoteItem(itemId, { categoryId: cat.id, categoryName: cat.name });
        setNewCategoryName("");
      }
    } catch {
      // non-blocking
    }
  }

  async function loadSelectorsData() {
    setLoadingSelectors(true);
    try {
      const [skuRes, plRes] = await Promise.all([
        authedFetch(`${apiUrl}/catalog/all-skus?branchCode=MAIN`),
        authedFetch(`${apiUrl}/price-lists?branchCode=MAIN`)
      ]);
      if (skuRes.ok) {
        const skus = await skuRes.json();
        setSkuOptions(skus || []);
      }
      if (plRes.ok) {
        const pls = await plRes.json();
        const activeLists = pls?.filter((pl: { isActive: boolean }) => pl.isActive) || [];
        setPriceListOptions(activeLists);
        if (activeLists.length > 0 && !selectedPriceListName) {
          setSelectedPriceListName(activeLists[0].name);
        }
      }
    } catch (err) {
      console.error("Error loading selectors:", err);
    } finally {
      setLoadingSelectors(false);
    }
  }

  async function loadCustomers() {
    try {
      const response = await authedFetch(`${apiUrl}/customers?branchCode=MAIN&isActive=true`);
      if (!response.ok) return;
      const data = (await response.json()) as CustomerOption[];
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      // non-blocking
    }
  }

  function applyQuoteCustomerSelection(selectedId: string) {
    setQuoteCustomerId(selectedId);
    const selected = customers.find((customer) => customer.id === selectedId);
    if (!selected) {
      setQuoteCustomerName("");
      setQuoteCustomerReference("");
      setCustomerDiscountInfo({ text: "", pct: 0 });
      return;
    }
    setQuoteCustomerName(selected.fullName);
    setQuoteCustomerReference(selected.companyOrReference ?? "");
    if (!selectedPriceListName && selected.preferredPriceListName) {
      setSelectedPriceListName(selected.preferredPriceListName);
    }
    void fetchCustomerDiscountInfo(selectedId);
  }

  async function fetchCustomerDiscountInfo(customerId: string) {
    try {
      const response = await authedFetch(`${apiUrl}/customers/${customerId}/discounts`);
      if (!response.ok) { setCustomerDiscountInfo({ text: "", pct: 0 }); return; }
      type DiscountInfo = { discountPct: number; discountCode: string | null; validFrom: string; validTo: string | null; status: string };
      const discounts = (await response.json()) as DiscountInfo[];
      const vigente = discounts.find((d) => d.status === "VIGENTE");
      const futuro = discounts.find((d) => d.status === "FUTURO");
      if (vigente) {
        const hasta = vigente.validTo ? ` hasta ${vigente.validTo}` : " (sin vencimiento)";
        setCustomerDiscountInfo({
          text: `Descuento cliente: ${vigente.discountPct}%${vigente.discountCode ? ` (${vigente.discountCode})` : ""} vigente${hasta}`,
          pct: vigente.discountPct
        });
      } else if (futuro) {
        setCustomerDiscountInfo({
          text: `Descuento futuro: ${futuro.discountPct}%${futuro.discountCode ? ` (${futuro.discountCode})` : ""} desde ${futuro.validFrom}`,
          pct: 0
        });
      } else {
        setCustomerDiscountInfo({ text: "", pct: 0 });
      }
    } catch {
      setCustomerDiscountInfo({ text: "", pct: 0 });
    }
  }

  async function loadQuoteBatch(batchId: string) {
    try {
      const response = await authedFetch(`${apiUrl}/quotes/batch/${batchId}`);
      if (!response.ok) {
        setStatus("Error al cargar cotización.");
        return;
      }
      const batch = await response.json() as {
        id: string;
        priceListName: string;
        customerId: string | null;
        customerName: string | null;
        customerReference: string | null;
        amountPaid: number;
        lines: Array<{
          skuCode: string;
          requestedWidthM: number;
          requestedHeightM: number;
          quantity: number;
          unitPrice: number;
          lineSubtotal: number;
          priceMethod: string;
          categoryId: string | null;
          categoryName: string | null;
          lineNote: string | null;
          roomAreaName?: string | null;
          displayOrder: number;
        }>;
      };

      setQuoteBatchId(batch.id);
      setSelectedPriceListName(batch.priceListName);
      setQuoteCustomerId(batch.customerId ?? "");
      setQuoteCustomerName(batch.customerName ?? "");
      setQuoteCustomerReference(batch.customerReference ?? "");
      if (batch.customerId) {
        void fetchCustomerDiscountInfo(batch.customerId);
      } else {
        setCustomerDiscountInfo({ text: "", pct: 0 });
      }
      setQuoteAmountPaid(batch.amountPaid ?? 0);
      setQuoteManualDiscountPct("0");
      setQuoteManualDiscountReason("");
      setQuoteItems(
        batch.lines
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((l) => ({
            id: crypto.randomUUID(),
            widthM: String(l.requestedWidthM),
            heightM: String(l.requestedHeightM),
            quantity: String(l.quantity),
            skuCode: l.skuCode,
            unitPrice: l.unitPrice,
            subtotal: l.lineSubtotal,
            priceMethod: l.priceMethod,
            calcStatus: "ok" as const,
            categoryId: l.categoryId ?? undefined,
            categoryName: l.categoryName ?? undefined,
            lineNote: l.lineNote ?? undefined,
            roomAreaName: l.roomAreaName ?? undefined
          }))
      );
      setStatus(`Editando borrador cargado.`);
    } catch {
      setStatus("Error al cargar cotización.");
    }
  }

  return {
    addQuoteItem,
    removeQuoteItem,
    updateQuoteItem,
    resetQuoteWorkbench,
    moveItemUp,
    moveItemDown,
    loadCategories,
    handleCreateCategoryForItem,
    loadSelectorsData,
    loadCustomers,
    applyQuoteCustomerSelection,
    loadQuoteBatch
  };
}
