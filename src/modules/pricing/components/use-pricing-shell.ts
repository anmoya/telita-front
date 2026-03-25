"use client";

import { useState } from "react";

import { fetchStatusLabels, type StatusLabelsByEntity } from "../../../shared/api/status-labels";
import type { AuditRow, DashboardKpis, PendingScrapRow, QuoteRow } from "../../operations/shared/workbench.shared-types";

type UsePricingShellArgs = {
  apiUrl: string;
  accessToken: string;
};

export function usePricingShell({ apiUrl, accessToken }: UsePricingShellArgs) {
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [dashboardKpis, setDashboardKpis] = useState<DashboardKpis | null>(null);
  const [pendingScraps, setPendingScraps] = useState<PendingScrapRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);
  const [statusLabels, setStatusLabels] = useState<StatusLabelsByEntity>({ sale: [], cut_job: [], scrap: [] });
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function loadStatusLabels() {
    const labels = await fetchStatusLabels(apiUrl);
    setStatusLabels(labels);
  }

  async function loadDashboard() {
    setLoadingMenu(true);
    try {
      const [kpisRes, pendingRes, auditRes] = await Promise.all([
        authedFetch(`${apiUrl}/dashboard/kpis?branchCode=MAIN`),
        authedFetch(`${apiUrl}/dashboard/pending-scraps?branchCode=MAIN&limit=10`),
        authedFetch(`${apiUrl}/audit?branchCode=MAIN&limit=8`)
      ]);
      if (kpisRes.ok) setDashboardKpis((await kpisRes.json()) as DashboardKpis);
      if (pendingRes.ok) setPendingScraps((await pendingRes.json()) as PendingScrapRow[]);
      if (auditRes.ok) {
        const data = (await auditRes.json()) as { data: AuditRow[] };
        setAuditEvents(data.data ?? []);
      }
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadAudit() {
    setLoadingMenu(true);
    try {
      const auditRes = await authedFetch(`${apiUrl}/audit?branchCode=MAIN&limit=20`);
      if (auditRes.ok) {
        const data = (await auditRes.json()) as { data: AuditRow[] };
        setAuditEvents(data.data ?? []);
      }
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadQuotes() {
    const response = await authedFetch(`${apiUrl}/pricing/quotes?branchCode=MAIN`);
    const data = (await response.json()) as QuoteRow[];
    setQuotes(data);
  }

  return {
    loadingMenu,
    dashboardKpis,
    pendingScraps,
    auditEvents,
    statusLabels,
    quotes,
    setLoadingMenu,
    authedFetch,
    loadStatusLabels,
    loadDashboard,
    loadAudit,
    loadQuotes
  };
}
