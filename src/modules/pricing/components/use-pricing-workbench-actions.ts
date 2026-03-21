"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MenuKey, PreviewResult, QuoteItem } from "./pricing-workbench.shared-types";
import type { QuoteScrapOpportunityMatchRow, QuoteScrapOpportunityPreview, QuoteScrapOpportunityRow } from "./pricing-workbench.types";

type UsePricingWorkbenchActionsArgs = {
  apiUrl: string;
  authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  quoteItems: QuoteItem[];
  selectedPriceListName: string;
  quoteCustomerId: string;
  quoteCustomerName: string;
  quoteCustomerReference: string;
  quoteManualDiscountPct: string;
  quoteManualDiscountReason: string;
  quoteSubtotal: number;
  quoteAmountPaid: number;
  commercialAdjustmentPct: number;
  installationAmount: number;
  quoteBatchId: string | null;
  setQuoteBatchId: (value: string | null) => void;
  setQuoteItemMatches: (value: QuoteScrapOpportunityRow[]) => void;
  setQuoteItemMatchesStatus: (value: string) => void;
  setLoadingActionId: (value: string | null) => void;
  setLoadingBatch: (value: boolean) => void;
  setLoadingCreateDraft: (value: boolean) => void;
  setLoadingPreview: (value: boolean) => void;
  setLoadingSave: (value: boolean) => void;
  setPreviewData: (value: PreviewResult | null) => void;
  setPreviewMode: (value: "CUSTOMER" | "INTERNAL") => void;
  setPreviewOpen: (value: boolean) => void;
  setQuoteItems: Dispatch<SetStateAction<QuoteItem[]>>;
  setStatus: (value: string, tone?: "success" | "danger") => void;
  onRefreshQuotes: () => Promise<void>;
  onResetQuoteWorkbench: () => void;
  onNavigate: (menu: MenuKey) => void;
  onAfterSave?: () => void;
};

export function usePricingWorkbenchActions({
  apiUrl,
  authedFetch,
  quoteItems,
  selectedPriceListName,
  quoteCustomerId,
  quoteCustomerName,
  quoteCustomerReference,
  quoteManualDiscountPct,
  quoteManualDiscountReason,
  quoteSubtotal,
  quoteAmountPaid,
  commercialAdjustmentPct,
  installationAmount,
  quoteBatchId,
  setQuoteBatchId,
  setQuoteItemMatches,
  setQuoteItemMatchesStatus,
  setLoadingActionId,
  setLoadingBatch,
  setLoadingCreateDraft,
  setLoadingPreview,
  setLoadingSave,
  setPreviewData,
  setPreviewMode,
  setPreviewOpen,
  setQuoteItems,
  setStatus,
  onRefreshQuotes,
  onResetQuoteWorkbench,
  onNavigate,
  onAfterSave
}: UsePricingWorkbenchActionsArgs) {
  async function loadQuoteScrapOpportunityPreview() {
    const eligibleItems = quoteItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const width = Number(item.widthM);
        const height = Number(item.heightM);
        const qty = Number(item.quantity);
        return Boolean(item.skuCode) && Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 && Number.isFinite(qty) && qty > 0;
      });

    if (eligibleItems.length === 0) {
      setQuoteItemMatches([]);
      setQuoteItemMatchesStatus("Completa SKU, ancho, alto y cantidad para revisar retazos útiles.");
      return false;
    }

    setQuoteItemMatchesStatus("Buscando retazos útiles para esta cotización...");
    try {
      const response = await authedFetch(`${apiUrl}/scraps/quote-opportunity-preview`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          items: eligibleItems.map(({ item, index }) => ({
            itemId: item.id,
            itemIndex: index + 1,
            skuCode: item.skuCode,
            requestedWidthM: Number(item.widthM),
            requestedHeightM: Number(item.heightM),
            quantity: Number(item.quantity)
          }))
        })
      });
      const data = await response.json().catch(() => null) as (QuoteScrapOpportunityPreview & { message?: string }) | null;
      if (!response.ok) {
        setQuoteItemMatches([]);
        setQuoteItemMatchesStatus(data?.message ?? "No se pudo calcular el preview de retazos.");
        return false;
      }

      const flattened = (data?.items ?? []).map((match) => {
        const item = quoteItems.find((entry) => entry.id === match.itemId);
        const qty = Math.max(1, Number(item?.quantity ?? match.pieceTotal));
        const pieceSalesValue = qty > 0 ? (item?.subtotal ?? 0) / qty : 0;
        return {
          ...(match as QuoteScrapOpportunityMatchRow),
          salesValue: pieceSalesValue,
          recoveredValue: pieceSalesValue
        } satisfies QuoteScrapOpportunityRow;
      });
      setQuoteItemMatches(flattened);

      if (!data || flattened.length === 0) {
        setQuoteItemMatchesStatus("Sin oportunidades con retazos para las líneas actuales.");
        return true;
      }

      const recoveredValue = flattened.reduce((sum, row) => sum + row.recoveredValue, 0);
      const orderCoveragePct = quoteSubtotal > 0 ? Math.min(100, (recoveredValue / quoteSubtotal) * 100) : 0;

      setQuoteItemMatchesStatus(
        `${data.summary.assignedPieces} pieza(s) reutilizable(s). Margen potencial recuperado: $${Math.round(recoveredValue).toLocaleString()} · Cobertura potencial de la orden: ${orderCoveragePct.toFixed(0)}%.`
      );
      return true;
    } catch {
      setQuoteItemMatches([]);
      setQuoteItemMatchesStatus("No se pudo calcular el preview de retazos.");
      return false;
    }
  }

  async function handleOpenQuoteOpportunityPreview() {
    setLoadingActionId("quote-opportunity");
    try {
      await loadQuoteScrapOpportunityPreview();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCalculateAll() {
    if (!selectedPriceListName) {
      setStatus("Selecciona una lista de precios");
      return;
    }
    const itemsWithSku = quoteItems.map((item) => ({ ...item, resolvedSku: item.skuCode ?? "" }));
    if (itemsWithSku.some((item) => !item.resolvedSku)) {
      setStatus("Asigna un SKU a todos los ítems");
      return;
    }

    setLoadingBatch(true);
    setQuoteItems((prev) => prev.map((item) => ({ ...item, calcStatus: "pending" as const, calcError: undefined })));
    try {
      const response = await authedFetch(`${apiUrl}/pricing/quote-batch`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          items: itemsWithSku.map((item) => ({
            clientItemId: item.id,
            skuCode: item.resolvedSku,
            requestedWidthM: Number(item.widthM),
            requestedHeightM: Number(item.heightM),
            quantity: Number(item.quantity),
            description: item.description
          }))
        })
      });
      const data = await response.json() as {
        lines?: Array<{
          clientItemId: string;
          ok: boolean;
          quoteId?: string;
          unitPrice?: number;
          subtotal?: number;
          totalRounded?: number;
          priceMethod?: string;
          error?: string;
        }>;
        subtotalAmount?: number;
        taxAmount?: number;
        totalAmount?: number;
        hasErrors?: boolean;
      };

      if (data.lines) {
        const lineErrors = data.lines
          .map((line, index) => (!line.ok && line.error ? `Línea ${index + 1}: ${line.error}` : null))
          .filter((value): value is string => Boolean(value));

        setQuoteItems((prev) =>
          prev.map((item) => {
            const line = data.lines!.find((entry) => entry.clientItemId === item.id);
            if (!line) return item;
            if (line.ok) {
              return {
                ...item,
                calcStatus: "ok" as const,
                calcError: undefined,
                quoteId: line.quoteId,
                unitPrice: line.unitPrice,
                subtotal: line.totalRounded ?? line.subtotal,
                priceMethod: line.priceMethod
              };
            }
            return { ...item, calcStatus: "error" as const, calcError: line.error };
          })
        );

        if (data.hasErrors) {
          setStatus(lineErrors[0] ?? "Cálculo con errores en algunas filas.", "danger");
        } else {
          setStatus(`Total: $${(data.totalAmount ?? 0).toLocaleString()} CLP (subtotal $${(data.subtotalAmount ?? 0).toLocaleString()} + IVA $${(data.taxAmount ?? 0).toLocaleString()})`, "success");
        }
      }
    } catch (err) {
      setStatus(`Error al calcular batch: ${String(err)}`, "danger");
    } finally {
      setLoadingBatch(false);
    }
  }

  async function handleCreateDraftFromQuote() {
    if (!selectedPriceListName) {
      setStatus("Selecciona una lista de precios");
      return;
    }
    if (!quoteItems.every((item) => item.calcStatus === "ok")) {
      setStatus("Calcula todos los ítems antes de crear el draft");
      return;
    }

    setLoadingCreateDraft(true);
    try {
      const response = await authedFetch(`${apiUrl}/sales/from-quote`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          customerId: quoteCustomerId || undefined,
          customerName: quoteCustomerName || undefined,
          customerReference: quoteCustomerReference || undefined,
          manualDiscountPct: Number(quoteManualDiscountPct || 0) || undefined,
          manualDiscountReason: quoteManualDiscountReason || undefined,
          amountPaid: quoteAmountPaid > 0 ? quoteAmountPaid : undefined,
          commercialAdjustmentPct: commercialAdjustmentPct > 0 ? commercialAdjustmentPct : undefined,
          installationAmount: installationAmount > 0 ? installationAmount : undefined,
          items: quoteItems.map((item, idx) => ({
            skuCode: item.skuCode ?? "",
            requestedWidthM: Number(item.widthM),
            requestedHeightM: Number(item.heightM),
            quantity: Number(item.quantity),
            roomAreaName: item.roomAreaName || undefined,
            categoryId: item.categoryId || undefined,
            categoryName: !item.categoryId && item.categoryName ? item.categoryName : undefined,
            lineNote: item.lineNote || undefined,
            displayOrder: idx
          }))
        })
      });
      const data = await response.json() as {
        message?: string;
        lineErrors?: Array<{ index: number; error: string }>;
      };
      if (!response.ok) {
        const detail = data.lineErrors
          ? data.lineErrors.map((error) => `Item ${error.index + 1}: ${error.error}`).join("; ")
          : (data.message ?? "Error desconocido");
        setStatus(`Error: ${detail}`, "danger");
        return;
      }

      // Guardar en historial y finalizar la cotización
      if (quoteBatchId) {
        // Modo edición: finalizar el borrador existente
        void authedFetch(`${apiUrl}/quotes/batch/${quoteBatchId}/finalize`, { method: "POST" });
      } else {
        // Modo nuevo: crear batch y finalizar
        void authedFetch(`${apiUrl}/quotes/batch`, {
          method: "POST",
          body: JSON.stringify({
            branchCode: "MAIN",
            priceListName: selectedPriceListName,
            customerId: quoteCustomerId || undefined,
            customerName: quoteCustomerName || undefined,
            customerReference: quoteCustomerReference || undefined,
            amountPaid: quoteAmountPaid > 0 ? quoteAmountPaid : undefined,
            commercialAdjustmentPct: commercialAdjustmentPct > 0 ? commercialAdjustmentPct : undefined,
            installationAmount: installationAmount > 0 ? installationAmount : undefined,
            lines: quoteItems.map((item, idx) => ({
              skuCode: item.skuCode ?? "",
              requestedWidthM: Number(item.widthM),
              requestedHeightM: Number(item.heightM),
              quantity: Number(item.quantity),
              unitPrice: item.unitPrice ?? 0,
              lineSubtotal: item.subtotal ?? 0,
              priceMethod: item.priceMethod ?? "LINEAR_METER",
              roomAreaName: item.roomAreaName || undefined,
              categoryId: item.categoryId || undefined,
              categoryName: !item.categoryId && item.categoryName ? item.categoryName : undefined,
              lineNote: item.lineNote || undefined,
              displayOrder: idx
            }))
          })
        }).then(async (res) => {
          if (res.ok) {
            const created = await res.json() as { id?: string };
            if (created.id) void authedFetch(`${apiUrl}/quotes/batch/${created.id}/finalize`, { method: "POST" });
          }
        });
      }

      onResetQuoteWorkbench();
      onNavigate("sales");
    } catch (err) {
      setStatus(`Error al crear draft: ${String(err)}`, "danger");
    } finally {
      setLoadingCreateDraft(false);
    }
  }

  async function handlePreview(mode: "CUSTOMER" | "INTERNAL") {
    if (!selectedPriceListName) {
      setStatus("Selecciona una lista de precios");
      return;
    }
    if (!quoteItems.every((item) => item.calcStatus === "ok")) {
      setStatus("Calcula todos los ítems antes de generar el preview");
      return;
    }

    setLoadingPreview(true);
    try {
      const response = await authedFetch(`${apiUrl}/pricing/preview`, {
        method: "POST",
        body: JSON.stringify({
          mode,
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          customerName: quoteCustomerName || undefined,
          customerReference: quoteCustomerReference || undefined,
          commercialAdjustmentPct: commercialAdjustmentPct > 0 ? commercialAdjustmentPct : undefined,
          installationAmount: installationAmount > 0 ? installationAmount : undefined,
          items: quoteItems.map((item) => ({
            skuCode: item.skuCode ?? "",
            requestedWidthM: Number(item.widthM),
            requestedHeightM: Number(item.heightM),
            quantity: Number(item.quantity),
            description: item.description || item.skuCode || "",
            categoryName: item.categoryName || undefined,
            roomAreaName: item.roomAreaName || undefined
          }))
        })
      });
      if (!response.ok) {
        const err = await response.json() as { message?: string };
        setStatus(err.message ?? "Error al generar preview");
        return;
      }
      const data = await response.json() as PreviewResult;
      setPreviewData(data);
      setPreviewMode(mode);
      setPreviewOpen(true);
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSaveToHistory() {
    if (!selectedPriceListName) return;
    setLoadingSave(true);
    const isUpdate = Boolean(quoteBatchId);
    const url = isUpdate ? `${apiUrl}/quotes/batch/${quoteBatchId}` : `${apiUrl}/quotes/batch`;
    const method = isUpdate ? "PATCH" : "POST";

    const lines = quoteItems.map((item, idx) => ({
      skuCode: item.skuCode ?? "",
      requestedWidthM: Number(item.widthM),
      requestedHeightM: Number(item.heightM),
      quantity: Number(item.quantity),
      unitPrice: item.unitPrice ?? 0,
      lineSubtotal: item.subtotal ?? 0,
      priceMethod: item.priceMethod ?? "LINEAR_METER",
      roomAreaName: item.roomAreaName || undefined,
      categoryId: item.categoryId || undefined,
      categoryName: !item.categoryId && item.categoryName ? item.categoryName : undefined,
      lineNote: item.lineNote || undefined,
      displayOrder: idx
    }));

    const payload = isUpdate
      ? { customerId: quoteCustomerId || null, customerName: quoteCustomerName || undefined, customerReference: quoteCustomerReference || undefined, amountPaid: quoteAmountPaid > 0 ? quoteAmountPaid : 0, commercialAdjustmentPct: commercialAdjustmentPct > 0 ? commercialAdjustmentPct : 0, installationAmount: installationAmount > 0 ? installationAmount : 0, lines }
      : { branchCode: "MAIN", priceListName: selectedPriceListName, customerId: quoteCustomerId || undefined, customerName: quoteCustomerName || undefined, customerReference: quoteCustomerReference || undefined, amountPaid: quoteAmountPaid > 0 ? quoteAmountPaid : undefined, commercialAdjustmentPct: commercialAdjustmentPct > 0 ? commercialAdjustmentPct : undefined, installationAmount: installationAmount > 0 ? installationAmount : undefined, lines };

    try {
      const response = await authedFetch(url, { method, body: JSON.stringify(payload) });
      if (response.ok) {
        if (!isUpdate) {
          const data = await response.json() as { id?: string };
          if (data.id) setQuoteBatchId(data.id);
        }
        setStatus(isUpdate ? "Cotización actualizada." : "Cotización guardada en historial.", "success");
        onAfterSave?.();
        await onRefreshQuotes();
      } else {
        setStatus("Error al guardar en historial.", "danger");
      }
    } catch {
      setStatus("Error al guardar en historial.", "danger");
    } finally {
      setLoadingSave(false);
    }
  }

  async function handleCalculateItem(itemId: string, updateQuoteItem: (itemId: string, updates: Partial<QuoteItem>) => void) {
    const item = quoteItems.find((entry) => entry.id === itemId);
    if (!item) return;

    const effectiveSkuCode = item.skuCode ?? "";
    if (!effectiveSkuCode || !selectedPriceListName) {
      setStatus("Asigna SKU y lista de precios a este ítem");
      return;
    }

    setLoadingActionId(itemId);
    try {
      const response = await authedFetch(`${apiUrl}/pricing/quote`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          skuCode: effectiveSkuCode,
          priceListName: selectedPriceListName,
          requestedWidthM: Number(item.widthM),
          requestedHeightM: Number(item.heightM),
          quantity: Number(item.quantity)
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = (body as { message?: string }).message ?? `HTTP ${response.status}`;
        updateQuoteItem(itemId, { calcStatus: "error", calcError: msg });
        throw new Error(msg);
      }
      const data = await response.json();
      updateQuoteItem(itemId, {
        quoteId: data.quoteId,
        unitPrice: data.unitPrice,
        subtotal: data.subtotal,
        priceMethod: data.priceMethod,
        calcStatus: "ok",
        calcError: undefined
      });
    } catch (error) {
      setStatus(`Error al calcular: ${String(error)}`, "danger");
    } finally {
      setLoadingActionId(null);
    }
  }

  return {
    loadQuoteScrapOpportunityPreview,
    handleOpenQuoteOpportunityPreview,
    handleCalculateAll,
    handleCreateDraftFromQuote,
    handlePreview,
    handleSaveToHistory,
    handleCalculateItem
  };
}
