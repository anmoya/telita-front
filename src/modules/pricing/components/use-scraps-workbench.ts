"use client";

import { useEffect, useState } from "react";

import type { ActiveModal, ScrapRow } from "./pricing-workbench.shared-types";

type ScrapFilterStatus = "ALL" | "PENDING_INBOUND" | "PENDING_STORAGE" | "STORED" | "USED" | "DISCARDED";

type UseScrapsWorkbenchArgs = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
  scrapId: string;
  activeModal: ActiveModal;
  modalLocationCode: string;
  setLoadingMenu: (value: boolean) => void;
  setLoadingModal: (value: boolean) => void;
  setScrapStatus: (value: string) => void;
  setScraps: (rows: ScrapRow[]) => void;
  setScrapId: (value: string) => void;
  setActiveModal: (value: ActiveModal) => void;
  setModalStatus: (value: string) => void;
};

export function useScrapsWorkbench({
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
}: UseScrapsWorkbenchArgs) {
  const [selectedScrapIds, setSelectedScrapIds] = useState<string[]>([]);
  const [scrapFilterStatus, setScrapFilterStatus] = useState<ScrapFilterStatus>("ALL");
  const [scrapPage, setScrapPage] = useState(1);
  const [scrapPageCount, setScrapPageCount] = useState(1);
  const [totalScraps, setTotalScraps] = useState(0);

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

  async function openAuthedHtmlDocument(url: string) {
    const html = await fetchAuthedText(url);
    const win = window.open("", "_blank", "noreferrer");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  async function openBatchPdf(labelIds: string[]) {
    if (labelIds.length === 0) return;
    const url = `${apiUrl}/labels/batch-pdf?labelIds=${labelIds.join(",")}`;
    await openAuthedHtmlDocument(url);
  }

  async function registerBatchPrint(labelIds: string[]) {
    if (labelIds.length === 0) return;
    await authedFetch(`${apiUrl}/labels/batch-print`, {
      method: "POST",
      body: JSON.stringify({ labelIds })
    });
  }

  async function handleListScraps() {
    setLoadingMenu(true);
    try {
      const statusQuery = scrapFilterStatus === "ALL" ? "" : `&status=${encodeURIComponent(scrapFilterStatus)}`;
      const response = await authedFetch(`${apiUrl}/scraps?branchCode=MAIN${statusQuery}&page=${scrapPage}&limit=8`);
      const payload = (await response.json()) as {
        data: ScrapRow[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      setScraps(payload.data ?? []);
      setTotalScraps(payload.total ?? 0);
      setScrapPageCount(Math.max(1, payload.totalPages ?? 1));
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleCreateScrapLabel(targetScrapId?: string) {
    const effectiveScrapId = targetScrapId ?? scrapId;
    if (!effectiveScrapId) return;
    if (targetScrapId && targetScrapId !== scrapId) {
      setScrapId(targetScrapId);
    }
    const response = await authedFetch(`${apiUrl}/labels/scrap/${effectiveScrapId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const body = await response.json();
    if (!response.ok) {
      setScrapStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setScrapStatus(`Etiqueta de retazo creada: ${body.labelId ?? "error"}`);
  }

  async function handlePrintScrapLabels() {
    if (selectedScrapIds.length === 0) return;
    setLoadingMenu(true);
    try {
      const response = await authedFetch(`${apiUrl}/labels/batch`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          items: selectedScrapIds.map((id) => ({ type: "SCRAP", scrapId: id }))
        })
      });
      if (!response.ok) return;
      const data = (await response.json()) as { labels: Array<{ labelId: string }> };
      const labelIds = data.labels.map((label) => label.labelId);
      await openBatchPdf(labelIds);
      await registerBatchPrint(labelIds);
      setSelectedScrapIds([]);
      setScrapStatus(`${labelIds.length} etiqueta(s) enviadas a imprimir.`);
    } finally {
      setLoadingMenu(false);
    }
  }

  function toggleScrapSelection(id: string) {
    setSelectedScrapIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
  }

  async function doAssignLocation(targetScrapId: string, locationCode: string) {
    const response = await authedFetch(`${apiUrl}/scraps/${targetScrapId}/assign-location`, {
      method: "PATCH",
      body: JSON.stringify({ locationCode })
    });
    const body = await response.json();
    if (!response.ok) {
      setModalStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setModalStatus("");
    setActiveModal(null);
    await handleListScraps();
  }

  async function handleModalAssignLocation() {
    if (activeModal?.type !== "assign-scrap-location") return;
    setLoadingModal(true);
    try {
      await doAssignLocation(activeModal.scrapId, modalLocationCode);
    } finally {
      setLoadingModal(false);
    }
  }

  useEffect(() => {
    if (activeMenu === "scraps") void handleListScraps();
  }, [activeMenu, scrapFilterStatus, scrapPage]);

  useEffect(() => {
    setScrapPage(1);
  }, [scrapFilterStatus]);

  return {
    selectedScrapIds,
    setSelectedScrapIds,
    scrapFilterStatus,
    scrapPage,
    scrapPageCount,
    totalScraps,
    setScrapFilterStatus,
    prevScrapPage: () => setScrapPage((page) => Math.max(1, page - 1)),
    nextScrapPage: () => setScrapPage((page) => Math.min(scrapPageCount, page + 1)),
    handleListScraps,
    handleCreateScrapLabel,
    handlePrintScrapLabels,
    toggleScrapSelection,
    handleModalAssignLocation
  };
}
