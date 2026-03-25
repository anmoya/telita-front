"use client";

import { useEffect, useMemo, useState } from "react";

import type { AutoScrapAssignmentPreview } from "../../operations/shared/workbench.types";
import type { CutSheetPolicy, QuoteItemCategory, SaleLineCompatibleScrapsResponse, SaleLineDraft, SaleLineRow, SaleRow, ScrapMatchRow } from "../../operations/shared/workbench.shared-types";

type UseSalesWorkbenchArgs = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
  cutSheetPolicy: CutSheetPolicy | null;
  initialSearchQuery?: string;
};

export function useSalesWorkbench({ apiUrl, accessToken, activeMenu, cutSheetPolicy, initialSearchQuery }: UseSalesWorkbenchArgs) {
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [salesStatus, setSalesStatus] = useState("");
  const [salesSearchQuery, setSalesSearchQuery] = useState(initialSearchQuery ?? "");
  const [salesPage, setSalesPage] = useState(1);
  const [saleId, setSaleId] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [saleLinesModalSaleId, setSaleLinesModalSaleId] = useState<string | null>(null);
  const [saleLineDrafts, setSaleLineDrafts] = useState<SaleLineDraft[]>([]);
  const [saleLinesStatus, setSaleLinesStatus] = useState("");
  const [newLineSkuCode, setNewLineSkuCode] = useState("");
  const [newLineWidth, setNewLineWidth] = useState("2.0");
  const [newLineHeight, setNewLineHeight] = useState("2.0");
  const [newLineQty, setNewLineQty] = useState("1");
  const [scrapSuggestions, setScrapSuggestions] = useState<ScrapMatchRow[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState("");
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [activeSaleIdForAlloc, setActiveSaleIdForAlloc] = useState("");
  const [activeSuggestionPieceId, setActiveSuggestionPieceId] = useState<string | null>(null);
  const [offerPreviewResult, setOfferPreviewResult] = useState<AutoScrapAssignmentPreview | null>(null);
  const [offerPreviewStatus, setOfferPreviewStatus] = useState("");
  const [isOfferPreviewOpen, setIsOfferPreviewOpen] = useState(false);
  const [docPreviewHtml, setDocPreviewHtml] = useState<string | null>(null);
  const [cutSheetPromptSaleId, setCutSheetPromptSaleId] = useState<string | null>(null);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function fetchAuthedText(url: string, options: RequestInit = {}) {
    const response = await authedFetch(url, options);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.text();
  }

  async function openAuthedHtmlDocument(url: string, options: RequestInit = {}) {
    try {
      const html = await fetchAuthedText(url, options);
      setDocPreviewHtml(html);
    } catch (err) {
      setSalesStatus(`No se pudo cargar el documento. ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  }

  async function openBatchPdf(labelIds: string[]) {
    if (labelIds.length === 0) return;
    await openAuthedHtmlDocument(`${apiUrl}/labels/batch-pdf?labelIds=${labelIds.join(",")}`);
  }

  function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  async function handleListSales() {
    setLoadingMenu(true);
    try {
      const response = await authedFetch(`${apiUrl}/sales?branchCode=MAIN`);
      const data = await response.json() as SaleRow[] | { message?: string };
      if (!response.ok) {
        const rawMessage = ("message" in data && data.message) ? data.message : `Error HTTP ${response.status}`;
        setSales([]);
        setSalesStatus(rawMessage === "Internal server error" ? "La API de ventas no pudo responder. Revisa la conexion a base de datos." : rawMessage);
        return;
      }
      if (!Array.isArray(data)) {
        setSales([]);
        setSalesStatus("La API de ventas respondió un formato inesperado.");
        return;
      }
      setSales(data);
      setSalesStatus("");
    } catch {
      setSales([]);
      setSalesStatus("No fue posible cargar las ventas. Revisa la sesion o la API.");
    } finally {
      setLoadingMenu(false);
    }
  }

  const SALES_PAGE_SIZE = 8;
  const filteredSales = useMemo(() => {
    const needle = salesSearchQuery.trim().toLowerCase();
    if (!needle) return sales;
    return sales.filter((sale) => {
      const haystack = [
        sale.quoteCode,
        sale.customerName,
        sale.customer?.fullName,
        sale.customer?.code,
        sale.customerReference
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [sales, salesSearchQuery]);

  const salesPageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredSales.length / SALES_PAGE_SIZE)),
    [filteredSales.length]
  );

  const pagedSales = useMemo(() => {
    const safePage = Math.min(salesPage, salesPageCount);
    const start = (safePage - 1) * SALES_PAGE_SIZE;
    return filteredSales.slice(start, start + SALES_PAGE_SIZE);
  }, [filteredSales, salesPage, salesPageCount]);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === saleId) ?? null,
    [sales, saleId]
  );

  const saleLinesModalSale = useMemo(
    () => saleLinesModalSaleId ? sales.find((sale) => sale.id === saleLinesModalSaleId) ?? null : null,
    [saleLinesModalSaleId, sales]
  );

  const selectedSaleTone: "success" | "danger" | "draft" = selectedSale?.status === "CONFIRMED"
    ? "success"
    : selectedSale?.status === "CANCELED"
      ? "danger"
      : "draft";

  const activeLine = useMemo(
    () => saleLinesModalSale?.lines.find((line) => line.id === activeLineId) ?? null,
    [activeLineId, saleLinesModalSale]
  );

  useEffect(() => {
    if (activeMenu === "sales") void handleListSales();
  }, [activeMenu]);

  useEffect(() => {
    setSalesPage(1);
  }, [salesSearchQuery]);

  useEffect(() => {
    if (salesPage > salesPageCount) {
      setSalesPage(salesPageCount);
    }
  }, [salesPage, salesPageCount]);

  useEffect(() => {
    if (activeMenu !== "sales") return;
    if (!saleId && pagedSales.length > 0) {
      selectSale(pagedSales[0]);
      return;
    }
    if (saleId && !sales.some((sale) => sale.id === saleId) && pagedSales.length > 0) {
      selectSale(pagedSales[0]);
    }
  }, [activeMenu, saleId, sales, pagedSales]);

  useEffect(() => {
    if (!saleLinesModalSale) return;
    setSaleLineDrafts(
      saleLinesModalSale.lines.map((line) => ({
        id: line.id,
        skuCode: line.skuCode,
        categoryId: line.categoryId ?? "",
        widthM: String(line.requestedWidthM),
        heightM: String(line.requestedHeightM),
        quantity: String(line.quantity),
        lineNote: line.lineNote ?? "",
        isNew: false
      }))
    );
    setNewLineSkuCode("");
    setNewLineWidth("2.0");
    setNewLineHeight("2.0");
    setNewLineQty("1");
    setSaleLinesStatus("");
    setScrapSuggestions([]);
    setSuggestionStatus("");
    setActiveLineId(null);
    setActiveSuggestionPieceId(null);
  }, [saleLinesModalSale]);

  function selectSale(row: SaleRow) {
    setSaleId(row.id);
  }

  function openSaleLinesModal(row: SaleRow) {
    selectSale(row);
    setSaleLinesModalSaleId(row.id);
  }

  function closeSaleLinesModal() {
    setSaleLinesModalSaleId(null);
    setActiveLineId(null);
    setActiveSuggestionPieceId(null);
    setScrapSuggestions([]);
    setSuggestionStatus("");
  }

  function updateSaleLineDraft(lineId: string, patch: Partial<SaleLineDraft>) {
    setSaleLineDrafts((current) =>
      current.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  }

  async function handleOfferPreview(offerSaleId: string) {
    setOfferPreviewStatus("Calculando autoasignación de retazos...");
    setOfferPreviewResult(null);
    setLoadingActionId(`offer-${offerSaleId}`);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${offerSaleId}/auto-scrap-assignment/preview`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setOfferPreviewStatus(body?.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      const result = (await response.json()) as AutoScrapAssignmentPreview;
      setOfferPreviewResult(result);
      if (result.summary.assignedPieces === 0) {
        setOfferPreviewStatus("Sin retazos compatibles para autoasignar.");
      } else {
        setOfferPreviewStatus(
          `${result.summary.assignedPieces} pieza(s) con propuesta de autoasignación. ${result.summary.unmatchedPieces} pieza(s) quedarían para corte nuevo.`
        );
        setIsOfferPreviewOpen(true);
      }
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleGeneratePickList(pickSaleId: string, items: Array<{ saleLineId: string; scrapId: string }>) {
    if (items.length === 0) return;
    const response = await authedFetch(`${apiUrl}/sales/${pickSaleId}/compatible-scraps/pick-list`, {
      method: "POST",
      body: JSON.stringify({ items })
    });
    if (!response.ok) return;
    const html = await response.text();
    const w = window.open("", "_blank", "noreferrer");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  }

  function openCutSheetPrompt(targetSaleId: string) {
    if (cutSheetPolicy?.mode === "DISABLED") {
      setSalesStatus("La hoja de corte está deshabilitada en configuración.");
      return;
    }
    if (cutSheetPolicy?.mode === "GUIDE_ONLY") {
      void handlePrintCutSheet(targetSaleId, false);
      return;
    }
    setCutSheetPromptSaleId(targetSaleId);
  }

  function closeCutSheetPrompt() {
    setCutSheetPromptSaleId(null);
  }

  async function handlePrintCutSheet(targetSaleId: string, reserveSuggestedScraps: boolean) {
    setLoadingActionId(`cut-sheet-${targetSaleId}`);
    try {
      await openAuthedHtmlDocument(`${apiUrl}/sales/${targetSaleId}/print/cut-sheet/html`, {
        method: "POST",
        body: JSON.stringify({ reserveSuggestedScraps })
      });
      setCutSheetPromptSaleId(null);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCommitAutoAssignment(offerSaleId: string) {
    if (!offerPreviewResult || offerPreviewResult.items.length === 0) return;
    setLoadingActionId(`offer-commit-${offerSaleId}`);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${offerSaleId}/auto-scrap-assignment/commit`, {
        method: "POST",
        body: JSON.stringify({
          items: offerPreviewResult.items.map((item) => ({
            saleLineId: item.saleLineId,
            saleLinePieceId: item.saleLinePieceId,
            scrapId: item.scrapId
          }))
        })
      });
      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        setOfferPreviewStatus(err.message ?? "Error al aplicar autoasignación.");
        return;
      }
      const body = (await response.json()) as { assignedCount?: number };
      setOfferPreviewStatus(`Autoasignación aplicada. ${body.assignedCount ?? offerPreviewResult.items.length} pieza(s) asignada(s).`);
      await handleListSales();
      setIsOfferPreviewOpen(false);
      setOfferPreviewResult(null);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleFetchMatches(targetSaleId: string, line: SaleLineRow) {
    setLoadingActionId(`match-${line.id}`);
    try {
      setActiveLineId(line.id);
      setActiveSaleIdForAlloc(targetSaleId);
      setActiveSuggestionPieceId(null);
      setScrapSuggestions([]);
      setSuggestionStatus("Buscando retazos compatibles...");
      const url = `${apiUrl}/sales/${targetSaleId}/lines/${line.id}/compatible-scraps?limit=5`;
      const response = await authedFetch(url);
      if (!response.ok) {
        setSuggestionStatus(`Error buscando: HTTP ${response.status}`);
        return;
      }
      const payload = (await response.json()) as SaleLineCompatibleScrapsResponse;
      const rows = payload.suggestions.map((suggestion) => ({
        id: suggestion.scrapId,
        labelCode: suggestion.labelCode,
        widthM: suggestion.widthM,
        heightM: suggestion.heightM,
        areaM2: suggestion.areaM2,
        excessAreaM2: suggestion.excessAreaM2,
        skuCode: payload.skuCode,
        locationCode: suggestion.locationCode
      }));
      setScrapSuggestions(rows);
      setActiveSuggestionPieceId(payload.freePieces[0]?.id ?? null);
      setSuggestionStatus(
        payload.freePieces.length === 0
          ? "Todas las piezas de esta línea ya tienen retazo asignado."
          : rows.length > 0
            ? `${rows.length} retazo(s) compatible(s) encontrado(s) para ${payload.freePieces.length} pieza(s) libre(s).`
            : "Sin retazos compatibles disponibles."
      );
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleAllocate(pieceId: string, scrapId: string) {
    if (!activeLine || !activeSaleIdForAlloc) return;
    setLoadingActionId(scrapId);
    try {
      const response = await authedFetch(
        `${apiUrl}/sales/${activeSaleIdForAlloc}/lines/${activeLine.id}/pieces/${pieceId}/allocate-scrap`,
        { method: "POST", body: JSON.stringify({ scrapId }) }
      );
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSuggestionStatus(body.message ?? `Error asignando: HTTP ${response.status}`);
        return;
      }
      setSuggestionStatus(`Retazo ${scrapId.slice(0, 8)} asignado a pieza.`);
      setScrapSuggestions([]);
      setActiveLineId(null);
      setActiveSuggestionPieceId(null);
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleRelease(targetSaleId: string, saleLineId: string, pieceId: string) {
    setLoadingActionId(pieceId);
    try {
      const response = await authedFetch(
        `${apiUrl}/sales/${targetSaleId}/lines/${saleLineId}/pieces/${pieceId}/allocate-scrap`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error liberando: HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Asignacion liberada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleUpdateSaleCustomer(id: string, customerId: string) {
    setLoadingActionId(`customer-${id}`);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ customerId })
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Cliente actualizado.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleConfirmSaleById(id: string) {
    const targetSale = sales.find((sale) => sale.id === id) ?? null;
    const hasCustomerInfo = Boolean(
      targetSale?.customerId ||
      targetSale?.customer?.id ||
      targetSale?.customerName?.trim() ||
      targetSale?.customer?.fullName?.trim()
    );
    if (!hasCustomerInfo) {
      setSalesStatus("La venta necesita cliente antes de confirmarse.");
      return;
    }

    setLoadingActionId(id);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${id}/confirm`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Venta confirmada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCancelSaleById(id: string) {
    setLoadingActionId(id);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Venta anulada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handlePrintSaleLabels(id: string) {
    setLoadingActionId(id);
    try {
      const response = await authedFetch(`${apiUrl}/labels/sale/${id}/batch`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) return;
      const data = (await response.json()) as { labels: Array<{ labelId: string }> };
      const labelIds = data.labels.map((label) => label.labelId);
      await openBatchPdf(labelIds);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleDownloadSaleLabelsZpl(id: string) {
    setLoadingActionId(`zpl-${id}`);
    try {
      const response = await authedFetch(`${apiUrl}/labels/sale/${id}/batch`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setSalesStatus(body?.message ?? `Error HTTP ${response.status}`);
        return;
      }

      const data = (await response.json()) as { labels: Array<{ labelId: string }> };
      const labelIds = data.labels.map((label) => label.labelId);
      if (labelIds.length === 0) {
        setSalesStatus("La venta no generó etiquetas para descargar.");
        return;
      }

      const zplContent = await fetchAuthedText(`${apiUrl}/labels/batch-zpl?labelIds=${labelIds.join(",")}`);
      downloadTextFile(`telita-sale-${id.slice(0, 8)}-labels.zpl`, zplContent, "application/zpl");
      setSalesStatus(`${labelIds.length} etiqueta(s) descargadas en ZPL.`);
    } catch (err) {
      setSalesStatus(`No se pudo descargar el ZPL. ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleUpdatePaymentSummary() {
    if (!saleId) return;
    const amountPaid = Number(amountPaidInput);
    if (isNaN(amountPaid) || amountPaid < 0) {
      setSalesStatus("Monto abonado inválido");
      return;
    }
    try {
      await authedFetch(`${apiUrl}/sales/${saleId}/payment-summary`, {
        method: "PATCH",
        body: JSON.stringify({ amountPaid })
      });
      setSalesStatus("Abono registrado.");
      setAmountPaidInput("");
      await handleListSales();
    } catch (err) {
      setSalesStatus(`Error: ${String(err)}`);
    }
  }

  async function handleAddSaleLine(targetSaleId: string) {
    if (!targetSaleId) {
      setSalesStatus("Selecciona una venta primero");
      return;
    }
    if (!newLineSkuCode) {
      setSaleLinesStatus("Selecciona un SKU");
      return;
    }
    const response = await authedFetch(`${apiUrl}/sales/${targetSaleId}/lines`, {
      method: "POST",
      body: JSON.stringify({
        skuCode: newLineSkuCode,
        requestedWidthM: Number(newLineWidth),
        requestedHeightM: Number(newLineHeight),
        quantity: Number(newLineQty)
      })
    });
    if (!response.ok) {
      const body = await response.json() as { message?: string };
      setSaleLinesStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setSaleLinesStatus("Línea agregada.");
    setNewLineSkuCode("");
    setNewLineWidth("2.0");
    setNewLineHeight("2.0");
    setNewLineQty("1");
    await handleListSales();
  }

  async function handleUpdateSaleLine(targetSaleId: string, draft: SaleLineDraft, displayOrder: number) {
    const width = Number(draft.widthM);
    const height = Number(draft.heightM);
    const qty = Number(draft.quantity);
    if (!draft.skuCode) {
      setSaleLinesStatus("Cada línea debe tener un SKU.");
      return;
    }
    if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(qty) || width <= 0 || height <= 0 || qty <= 0) {
      setSaleLinesStatus("Ancho, alto y cantidad deben ser mayores a cero.");
      return;
    }

    setLoadingActionId(`sale-line-save-${draft.id}`);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${targetSaleId}/lines/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          skuCode: draft.skuCode,
          categoryId: draft.categoryId || null,
          requestedWidthM: width,
          requestedHeightM: height,
          quantity: qty,
          displayOrder,
          lineNote: draft.lineNote || null
        })
      });
      if (!response.ok) {
        const body = await response.json() as { message?: string };
        setSaleLinesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSaleLinesStatus("Línea actualizada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleRemoveSaleLine(targetSaleId: string, saleLineId: string) {
    setLoadingActionId(`sale-line-remove-${saleLineId}`);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${targetSaleId}/lines/${saleLineId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const body = await response.json() as { message?: string };
        setSaleLinesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSaleLinesStatus("Línea eliminada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  return {
    loadingMenu,
    loadingActionId,
    sales,
    salesStatus,
    salesSearchQuery,
    saleId,
    salesPage,
    salesPageCount,
    filteredSalesCount: filteredSales.length,
    pagedSales,
    selectedSale,
    selectedSaleTone,
    amountPaidInput,
    saleLinesModalSale,
    isSaleLinesModalOpen: Boolean(saleLinesModalSaleId),
    saleLinesStatus,
    saleLineDrafts,
    newLineSkuCode,
    newLineQty,
    newLineWidth,
    newLineHeight,
    showOfferPreviewStatus: Boolean(offerPreviewStatus && offerPreviewResult?.saleId === saleLinesModalSale?.id),
    offerPreviewStatus,
    offerPreviewResult,
    isOfferPreviewOpen,
    scrapSuggestions,
    suggestionStatus,
    activeSuggestionLineId: activeLine?.id ?? null,
    activeSuggestionPieceId,
    setSalesSearchQuery,
    selectSale,
    openSaleLinesModal,
    closeSaleLinesModal,
    handleListSales,
    handleUpdateSaleCustomer,
    handleConfirmSaleById,
    handleCancelSaleById,
    handlePrintSaleLabels,
    handleDownloadSaleLabelsZpl,
    openAuthedHtmlDocument,
    docPreviewHtml,
    isCutSheetPromptOpen: Boolean(cutSheetPromptSaleId),
    cutSheetPromptSaleId,
    closeDocPreview: () => setDocPreviewHtml(null),
    openCutSheetPrompt,
    closeCutSheetPrompt,
    handlePrintCutSheet,
    setAmountPaidInput,
    handleUpdatePaymentSummary,
    prevPage: () => setSalesPage((page) => Math.max(1, page - 1)),
    nextPage: () => setSalesPage((page) => Math.min(salesPageCount, page + 1)),
    handleOfferPreview,
    handleGeneratePickList,
    closeOfferPreview: () => setIsOfferPreviewOpen(false),
    handleCommitAutoAssignment,
    handleFetchMatches,
    handleAllocate,
    handleRelease,
    updateSaleLineDraft,
    handleUpdateSaleLine,
    handleRemoveSaleLine,
    setNewLineSkuCode,
    setNewLineQty,
    setNewLineWidth,
    setNewLineHeight,
    handleAddSaleLine
  };
}
