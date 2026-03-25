"use client";

import { useEffect, useState } from "react";

import type { BatchLabelResult, LabelRow } from "../../operations/shared/workbench.shared-types";

type LabelFilterType = "ALL" | "SALE_CUT" | "SCRAP";

type UseLabelsWorkbenchArgs = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
  quoteId: string | null;
  scrapId: string;
};

export function useLabelsWorkbench({
  apiUrl,
  accessToken,
  activeMenu,
  quoteId,
  scrapId
}: UseLabelsWorkbenchArgs) {
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [labelStatus, setLabelStatus] = useState("");
  const [batchSaleId, setBatchSaleId] = useState("");
  const [batchResults, setBatchResults] = useState<BatchLabelResult[]>([]);
  const [labelId, setLabelId] = useState("");
  const [labelList, setLabelList] = useState<LabelRow[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [labelPreview, setLabelPreview] = useState<{ id: string; html: string } | null>(null);
  const [labelFilterType, setLabelFilterType] = useState<LabelFilterType>("ALL");
  const [labelPage, setLabelPage] = useState(1);
  const [labelPageCount, setLabelPageCount] = useState(1);
  const [totalLabels, setTotalLabels] = useState(0);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function fetchAuthedText(url: string) {
    const response = await authedFetch(url);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.text();
  }

  async function openAuthedHtmlDocument(url: string, existingWin?: Window | null) {
    const win = existingWin ?? window.open("", "_blank", "noreferrer");
    if (!win) {
      setLabelStatus("El navegador bloqueó la ventana emergente. Permite ventanas emergentes para esta página e intenta de nuevo.");
      return;
    }
    try {
      const html = await fetchAuthedText(url);
      const blob = new Blob([html], { type: "text/html; charset=utf-8" });
      win.location.href = URL.createObjectURL(blob);
    } catch {
      win.close();
    }
  }

  async function openBatchPdf(labelIds: string[], existingWin?: Window | null) {
    if (labelIds.length === 0) return;
    const url = `${apiUrl}/labels/batch-pdf?labelIds=${labelIds.join(",")}`;
    await openAuthedHtmlDocument(url, existingWin);
  }

  async function registerBatchPrint(labelIds: string[]) {
    if (labelIds.length === 0) return;
    await authedFetch(`${apiUrl}/labels/batch-print`, {
      method: "POST",
      body: JSON.stringify({ labelIds })
    });
  }

  async function handleListLabels() {
    setLoadingMenu(true);
    try {
      const typeQuery = labelFilterType === "ALL" ? "" : `&type=${encodeURIComponent(labelFilterType)}`;
      const response = await authedFetch(`${apiUrl}/labels?branchCode=MAIN${typeQuery}&page=${labelPage}&limit=8`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        data: LabelRow[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      setLabelList(payload.data ?? []);
      setTotalLabels(payload.total ?? 0);
      setLabelPageCount(Math.max(1, payload.totalPages ?? 1));
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleBatchLabels() {
    if (!batchSaleId) return;
    setLoadingMenu(true);
    setBatchResults([]);
    try {
      const response = await authedFetch(`${apiUrl}/labels/sale/${batchSaleId}/batch`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setLabelStatus(body.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      const data = (await response.json()) as { total: number; labels: BatchLabelResult[] };
      setBatchResults(data.labels);
      setLabelId(data.labels[0]?.labelId ?? "");
      setLabelStatus(`${data.total} etiqueta(s) generada(s).`);
      await handleListLabels();
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handlePrintSelectedLabels() {
    if (selectedLabelIds.length === 0) return;
    const win = window.open("", "_blank", "noreferrer");
    if (!win) {
      setLabelStatus("El navegador bloqueó la ventana emergente. Permite ventanas emergentes para esta página e intenta de nuevo.");
      return;
    }
    setLoadingMenu(true);
    try {
      await openBatchPdf(selectedLabelIds, win);
      await registerBatchPrint(selectedLabelIds);
      setSelectedLabelIds([]);
      setLabelStatus(`${selectedLabelIds.length} etiqueta(s) enviadas a imprimir.`);
      await handleListLabels();
    } finally {
      setLoadingMenu(false);
    }
  }

  function toggleLabelSelection(id: string) {
    setSelectedLabelIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
  }

  async function openLabelPreview(labelId: string) {
    try {
      const html = await fetchAuthedText(`${apiUrl}/labels/${labelId}/pdf`);
      setLabelPreview({ id: labelId, html });
    } catch (error) {
      setLabelStatus(error instanceof Error ? error.message : "No se pudo cargar la etiqueta.");
    }
  }

  async function handleReprintById(id: string) {
    setLoadingActionId(id);
    try {
      await authedFetch(`${apiUrl}/labels/${id}/reprint`, {
        method: "POST",
        body: JSON.stringify({})
      });
      await openBatchPdf([id]);
      setLabelId(id);
      setLabelStatus("Impresión registrada.");
      await handleListLabels();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCreateQuoteLabel() {
    if (!quoteId) return;
    const response = await authedFetch(`${apiUrl}/labels/quote/${quoteId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const data = await response.json();
    setLabelId(data.labelId ?? "");
    setLabelStatus(`Etiqueta cotizacion creada: ${data.labelId ?? "error"}`);
    await handleListLabels();
  }

  async function handleCreateScrapLabel() {
    if (!scrapId) return;
    const response = await authedFetch(`${apiUrl}/labels/scrap/${scrapId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const body = await response.json();
    if (!response.ok) {
      setLabelStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setLabelId(body.labelId ?? "");
    setLabelStatus(`Etiqueta scrap creada: ${body.labelId ?? "error"}`);
    await handleListLabels();
  }

  async function handleReprintCurrentLabel() {
    if (!labelId) return;
    await authedFetch(`${apiUrl}/labels/${labelId}/reprint`, {
      method: "POST",
      body: JSON.stringify({})
    });
    await openBatchPdf([labelId]);
    setLabelStatus("Reimpresion registrada.");
    await handleListLabels();
  }

  function closeLabelPreview() {
    setLabelPreview(null);
  }

  async function fetchZplContent(labelId: string): Promise<string> {
    return fetchAuthedText(`${apiUrl}/labels/${labelId}/zpl`);
  }

  async function handleDownloadZpl(labelId: string) {
    try {
      const zplContent = await fetchZplContent(labelId);
      const blob = new Blob([zplContent], { type: "text/plain; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `etiqueta-${labelId.slice(0, 8)}.zpl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setLabelStatus("Archivo ZPL descargado.");
    } catch (error) {
      setLabelStatus(error instanceof Error ? error.message : "No se pudo descargar el archivo ZPL.");
    }
  }

  useEffect(() => {
    if (activeMenu === "labels") void handleListLabels();
  }, [activeMenu, labelFilterType, labelPage]);

  useEffect(() => {
    setLabelPage(1);
  }, [labelFilterType]);

  return {
    loadingMenu,
    loadingActionId,
    labelStatus,
    batchSaleId,
    batchResults,
    labelId,
    labelList,
    labelFilterType,
    labelPage,
    labelPageCount,
    totalLabels,
    selectedLabelIds,
    labelPreview,
    setBatchSaleId,
    setLabelFilterType,
    setSelectedLabelIds,
    prevLabelPage: () => setLabelPage((page) => Math.max(1, page - 1)),
    nextLabelPage: () => setLabelPage((page) => Math.min(labelPageCount, page + 1)),
    handleBatchLabels,
    openAuthedHtmlDocument,
    handleCreateQuoteLabel,
    handleCreateScrapLabel,
    handleReprintCurrentLabel,
    handleListLabels,
    handlePrintSelectedLabels,
    toggleLabelSelection,
    openLabelPreview,
    handleReprintById,
    closeLabelPreview,
    handleDownloadZpl,
    fetchZplContent
  };
}
