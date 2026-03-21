"use client";

import { useEffect, useState } from "react";

import type { Dispatch, SetStateAction } from "react";

import type {
  ActiveModal,
  CompatibleScrapSuggestion,
  CompatibleScrapsResult,
  CutJobRow,
  CutJobStatus,
  CutScrapLookupPolicy,
  ScrapLocationPolicy,
  ScrapPolicy,
  SoftHoldInfo,
  SoftHoldPolicy
} from "./pricing-workbench.shared-types";

type UseCutsWorkbenchArgs = {
  apiUrl: string;
  authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  cutFilterStatus: CutJobStatus | "ALL";
  cutSearch: string;
  scrapPolicy: ScrapPolicy | null;
  softHoldPolicy: SoftHoldPolicy | null;
  activeModal: ActiveModal;
  modalLocationCode: string;
  setLoadingMenu: (value: boolean) => void;
  setCutsStatus: (value: string) => void;
  setCutJobs: (rows: CutJobRow[]) => void;
  setCutScrapPolicy: (value: CutScrapLookupPolicy | null) => void;
  setCompatibleScrapsStatus: (value: string) => void;
  setCompatibleScrapsResult: (value: CompatibleScrapsResult | null) => void;
  setLoadingActionId: (value: string | null) => void;
  setActiveModal: (value: ActiveModal) => void;
  setModalLocationCode: (value: string) => void;
  setModalStatus: (value: string) => void;
  setLoadingModal: (value: boolean) => void;
  setScrapPolicy: (value: ScrapPolicy | null) => void;
  setScrapMinWidthCmInput: (value: string) => void;
  setScrapId: (value: string) => void;
  setSoftHoldPolicy: (value: SoftHoldPolicy | null) => void;
  setSoftHolds: Dispatch<SetStateAction<Record<string, SoftHoldInfo>>>;
  onRefreshScraps: () => void;
};

export function useCutsWorkbench({
  apiUrl,
  authedFetch,
  cutFilterStatus,
  cutSearch,
  scrapPolicy,
  softHoldPolicy,
  activeModal,
  modalLocationCode,
  setLoadingMenu,
  setCutsStatus,
  setCutJobs,
  setCutScrapPolicy,
  setCompatibleScrapsStatus,
  setCompatibleScrapsResult,
  setLoadingActionId,
  setActiveModal,
  setModalLocationCode,
  setModalStatus,
  setLoadingModal,
  setScrapPolicy,
  setScrapMinWidthCmInput,
  setScrapId,
  setSoftHoldPolicy,
  setSoftHolds,
  onRefreshScraps
}: UseCutsWorkbenchArgs) {
  const [cutPage, setCutPage] = useState(1);
  const [cutPageCount, setCutPageCount] = useState(1);
  const [totalCuts, setTotalCuts] = useState(0);

  async function loadCutJobs() {
    setLoadingMenu(true);
    try {
      const statusQuery = cutFilterStatus === "ALL" ? "" : `&status=${encodeURIComponent(cutFilterStatus)}`;
      const searchQuery = cutSearch ? `&search=${encodeURIComponent(cutSearch)}` : "";
      const response = await authedFetch(`${apiUrl}/cut-jobs?branchCode=MAIN${statusQuery}${searchQuery}&page=${cutPage}&limit=8`);
      if (!response.ok) {
        setCutsStatus(`Error listando cortes: HTTP ${response.status}`);
        return;
      }
      const payload = (await response.json()) as {
        data: CutJobRow[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      setCutJobs(payload.data ?? []);
      setTotalCuts(payload.total ?? 0);
      setCutPageCount(Math.max(1, payload.totalPages ?? 1));
      setCutsStatus("");
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadCutScrapPolicy() {
    const response = await authedFetch(`${apiUrl}/settings/cut-scrap-lookup-policy`);
    if (!response.ok) return;
    const data = (await response.json()) as CutScrapLookupPolicy;
    setCutScrapPolicy(data);
  }

  async function loadSoftHoldPolicy() {
    const response = await authedFetch(`${apiUrl}/settings/scrap-soft-hold-policy`);
    if (!response.ok) return;
    const data = (await response.json()) as SoftHoldPolicy;
    setSoftHoldPolicy(data);
  }

  async function fetchSoftHoldForScrap(scrapId: string) {
    const response = await authedFetch(`${apiUrl}/scraps/${scrapId}/soft-hold`);
    if (!response.ok) return;
    const hold = (await response.json()) as SoftHoldInfo;
    setSoftHolds((prev) => ({ ...prev, [scrapId]: hold }));
  }

  async function loadSoftHoldsForSuggestions(suggestions: CompatibleScrapSuggestion[]) {
    if (!softHoldPolicy?.enabled) return;
    await Promise.all(suggestions.map((suggestion) => fetchSoftHoldForScrap(suggestion.scrapId)));
  }

  async function handleCheckCompatibleScraps(cutJobId: string) {
    setCompatibleScrapsStatus("Buscando retazos compatibles...");
    setCompatibleScrapsResult(null);
    setLoadingActionId(`compat-${cutJobId}`);
    try {
      const response = await authedFetch(`${apiUrl}/cut-jobs/${cutJobId}/compatible-scraps`);
      if (!response.ok) {
        setCompatibleScrapsStatus(`Error: HTTP ${response.status}`);
        return;
      }
      const result = (await response.json()) as CompatibleScrapsResult;
      setCompatibleScrapsResult(result);
      const total = result.lines.reduce((acc, line) => acc + line.suggestions.length, 0);
      if (total === 0) {
        setCompatibleScrapsStatus("Sin retazos compatibles disponibles.");
      } else {
        setCompatibleScrapsStatus(`${total} retazo(s) compatible(s) encontrado(s).`);
      }

      if (result.policy?.mode === "REQUIRE_DECISION" && total > 0) {
        setActiveModal({ type: "require-decision-scraps", cutJobId });
      } else if (total > 0) {
        setActiveModal({ type: "cut-compatible-scraps", cutJobId });
      }

      const allSuggestions = result.lines.flatMap((line) => line.suggestions);
      if (allSuggestions.length > 0) void loadSoftHoldsForSuggestions(allSuggestions);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function loadScrapPolicyAndReturn() {
    const response = await authedFetch(`${apiUrl}/settings/scrap-policy`);
    if (!response.ok) return null;
    const data = (await response.json()) as ScrapPolicy;
    setScrapPolicy(data);
    setScrapMinWidthCmInput(String(data.minWidthCm ?? 50));
    return data;
  }

  async function doMarkCut(cutJobId: string, locationCode?: string) {
    const body: { defaultLocationCode?: string; locationCode?: string } = {};
    if (locationCode) {
      body.defaultLocationCode = locationCode;
      body.locationCode = locationCode;
    }

    const response = await authedFetch(`${apiUrl}/cut-jobs/${cutJobId}/mark-cut`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = (await response.json()) as { message?: string };
      setCutsStatus(errorBody.message ?? `Error marcando corte: HTTP ${response.status}`);
      setActiveModal(null);
      return;
    }

    const result = (await response.json()) as {
      ok: boolean;
      locationPolicy: ScrapLocationPolicy;
      scrap: { id: string; status: string; widthM: number; heightM: number; areaM2: number } | null;
      scraps: Array<{ id: string; status: string; isUseful?: boolean }>;
    };
    setActiveModal(null);

    if (result.scraps.length > 0) {
      setScrapId(result.scraps[0].id);
      const usefulCount = result.scraps.filter((scrap) => scrap.isUseful).length;
      const inboundCount = result.scraps.filter((scrap) => scrap.status === "PENDING_INBOUND").length;
      const storedCount = result.scraps.filter((scrap) => scrap.status === "STORED").length;
      const discardedCount = result.scraps.filter((scrap) => scrap.status === "DISCARDED").length;
      setCutsStatus(
        `Corte marcado. Retazos: ${usefulCount} utiles, ${storedCount} ubicados, ${inboundCount} pendientes de ingreso, ${discardedCount} descartados.`
      );
    } else {
      setCutsStatus(`Corte marcado: ${cutJobId.slice(0, 8)} (sin retazo util)`);
    }

    await loadCutJobs();
    onRefreshScraps();
  }

  async function onMarkCutClick(cutJobId: string) {
    const policy = scrapPolicy ?? await loadScrapPolicyAndReturn();
    if (policy?.locationPolicy === "AT_CUT_REQUIRE_LOCATION") {
      setActiveModal({ type: "pre-cut-location", cutJobId });
      setModalLocationCode("");
      setModalStatus("");
      return;
    }

    setLoadingActionId(cutJobId);
    try {
      await doMarkCut(cutJobId);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleSkipCompatibleScraps(cutJobId: string) {
    setCompatibleScrapsResult(null);
    setCompatibleScrapsStatus("Omitido: continuando con corte nuevo.");
    setActiveModal(null);
    await onMarkCutClick(cutJobId);
  }

  async function handleAllocateFromOffer(offerSaleId: string, saleLineId: string, scrapId: string) {
    setLoadingActionId(scrapId);
    try {
      const response = await authedFetch(
        `${apiUrl}/sales/${offerSaleId}/lines/${saleLineId}/allocate-scrap`,
        { method: "POST", body: JSON.stringify({ scrapId }) }
      );
      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        setCompatibleScrapsStatus(err.message ?? "Error al asignar retazo.");
        return false;
      }
      setCompatibleScrapsStatus(`Retazo ${scrapId.slice(0, 8)} asignado.`);
      await loadCutJobs();
      onRefreshScraps();
      return true;
    } catch {
      setCompatibleScrapsStatus("No fue posible asignar el retazo en este momento.");
      return false;
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleModalMarkCut() {
    if (activeModal?.type !== "pre-cut-location") return;
    setLoadingModal(true);
    try {
      await doMarkCut(activeModal.cutJobId, modalLocationCode);
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleCreateSoftHold(scrapId: string, saleId: string, saleLineId?: string) {
    setLoadingActionId(`hold-${scrapId}`);
    try {
      const response = await authedFetch(`${apiUrl}/scraps/${scrapId}/soft-hold`, {
        method: "POST",
        body: JSON.stringify({ saleId, saleLineId })
      });
      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        setCompatibleScrapsStatus(err.message ?? "Error al reservar retazo.");
        return;
      }
      const hold = (await response.json()) as SoftHoldInfo;
      setSoftHolds((prev) => ({ ...prev, [scrapId]: { ...hold, active: true } }));
      setCompatibleScrapsStatus(`Retazo ${scrapId.slice(0, 8)} reservado.`);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleReleaseSoftHold(scrapId: string) {
    setLoadingActionId(`release-${scrapId}`);
    try {
      const response = await authedFetch(`${apiUrl}/scraps/${scrapId}/soft-hold`, { method: "DELETE" });
      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        setCompatibleScrapsStatus(err.message ?? "Error al liberar reserva.");
        return;
      }
      setSoftHolds((prev) => {
        const next = { ...prev };
        delete next[scrapId];
        return next;
      });
      setCompatibleScrapsStatus("Reserva liberada.");
    } finally {
      setLoadingActionId(null);
    }
  }

  useEffect(() => {
    setCutPage(1);
  }, [cutFilterStatus]);

  return {
    cutPage,
    cutPageCount,
    totalCuts,
    prevCutPage: () => setCutPage((page) => Math.max(1, page - 1)),
    nextCutPage: () => setCutPage((page) => Math.min(cutPageCount, page + 1)),
    loadCutJobs,
    loadCutScrapPolicy,
    loadSoftHoldPolicy,
    handleCheckCompatibleScraps,
    handleSkipCompatibleScraps,
    handleAllocateFromOffer,
    onMarkCutClick,
    handleModalMarkCut,
    handleCreateSoftHold,
    handleReleaseSoftHold
  };
}
