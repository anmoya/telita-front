"use client";

import { useEffect, useState } from "react";

import type { AuditRow } from "../../operations/shared/workbench.shared-types";

type AuditEntityFilter = "ALL" | "sale" | "cut_job" | "scrap" | "label" | "quote_batch";

type UseAuditWorkbenchArgs = {
  apiUrl: string;
  accessToken: string;
  activeMenu: string;
};

export function useAuditWorkbench({ apiUrl, accessToken, activeMenu }: UseAuditWorkbenchArgs) {
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);
  const [auditEntityFilter, setAuditEntityFilter] = useState<AuditEntityFilter>("ALL");
  const [auditEntityIdInput, setAuditEntityIdInput] = useState("");
  const [appliedAuditEntityId, setAppliedAuditEntityId] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageCount, setAuditPageCount] = useState(1);
  const [totalAuditEvents, setTotalAuditEvents] = useState(0);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function loadAudit() {
    setLoadingMenu(true);
    try {
      const entityTypeQuery = auditEntityFilter === "ALL" ? "" : `&entityType=${encodeURIComponent(auditEntityFilter)}`;
      const entityIdQuery = appliedAuditEntityId ? `&entityId=${encodeURIComponent(appliedAuditEntityId)}` : "";
      const response = await authedFetch(`${apiUrl}/audit?branchCode=MAIN${entityTypeQuery}${entityIdQuery}&page=${auditPage}&limit=10`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        data: AuditRow[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      setAuditEvents(payload.data ?? []);
      setTotalAuditEvents(payload.total ?? 0);
      setAuditPageCount(Math.max(1, payload.totalPages ?? 1));
    } finally {
      setLoadingMenu(false);
    }
  }

  useEffect(() => {
    if (activeMenu === "audit") void loadAudit();
  }, [activeMenu, auditEntityFilter, appliedAuditEntityId, auditPage]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditEntityFilter, appliedAuditEntityId]);

  return {
    loadingMenu,
    auditEvents,
    auditEntityFilter,
    auditEntityIdInput,
    auditPage,
    auditPageCount,
    totalAuditEvents,
    setAuditEntityFilter,
    setAuditEntityIdInput,
    applyAuditEntityId: () => setAppliedAuditEntityId(auditEntityIdInput.trim()),
    clearAuditEntityId: () => {
      setAuditEntityIdInput("");
      setAppliedAuditEntityId("");
    },
    prevAuditPage: () => setAuditPage((page) => Math.max(1, page - 1)),
    nextAuditPage: () => setAuditPage((page) => Math.min(auditPageCount, page + 1)),
    loadAudit
  };
}
