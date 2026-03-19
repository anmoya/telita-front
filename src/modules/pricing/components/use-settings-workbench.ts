"use client";

import { useState } from "react";

import type { CutScrapLookupPolicy, ScrapLocationPolicy, ScrapPolicy, SoftHoldPolicy } from "./pricing-workbench.shared-types";

type UseSettingsWorkbenchArgs = {
  apiUrl: string;
  accessToken: string;
};

export function useSettingsWorkbench({ apiUrl, accessToken }: UseSettingsWorkbenchArgs) {
  const [scrapPolicy, setScrapPolicy] = useState<ScrapPolicy | null>(null);
  const [scrapMinWidthCmInput, setScrapMinWidthCmInput] = useState("50");
  const [settingsStatus, setSettingsStatus] = useState("");
  const [cutScrapPolicy, setCutScrapPolicy] = useState<CutScrapLookupPolicy | null>(null);
  const [softHoldPolicy, setSoftHoldPolicy] = useState<SoftHoldPolicy | null>(null);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function loadScrapPolicy() {
    const response = await authedFetch(`${apiUrl}/settings/scrap-policy`);
    if (!response.ok) return;
    const data = (await response.json()) as ScrapPolicy;
    setScrapPolicy(data);
    setScrapMinWidthCmInput(String(data.minWidthCm ?? 50));
  }

  async function handleUpdateScrapPolicy(locationPolicy: ScrapLocationPolicy, loadingKey: (value: string | null) => void) {
    loadingKey(locationPolicy);
    try {
      const minWidthCm = Number(scrapMinWidthCmInput);
      const response = await authedFetch(`${apiUrl}/settings/scrap-policy`, {
        method: "PUT",
        body: JSON.stringify({ minWidthCm, locationPolicy })
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSettingsStatus(body.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      const saved = (await response.json()) as ScrapPolicy;
      setScrapPolicy(saved);
      setScrapMinWidthCmInput(String(saved.minWidthCm ?? minWidthCm));
      setSettingsStatus(`Regla actualizada: ancho sobrante >= ${saved.minWidthCm ?? minWidthCm} cm.`);
    } finally {
      loadingKey(null);
    }
  }

  async function handleUpdateCutScrapPolicy(updates: Partial<CutScrapLookupPolicy>, loadingKey: (value: string | null) => void) {
    loadingKey("cutScrapPolicy");
    try {
      const response = await authedFetch(`${apiUrl}/settings/cut-scrap-lookup-policy`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSettingsStatus(body.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      const saved = (await response.json()) as CutScrapLookupPolicy;
      setCutScrapPolicy(saved);
      setSettingsStatus(`Politica de verificacion actualizada: modo ${saved.mode}.`);
    } finally {
      loadingKey(null);
    }
  }

  async function handleUpdateSoftHoldPolicy(updates: Partial<SoftHoldPolicy>, loadingKey: (value: string | null) => void) {
    loadingKey("softHoldPolicy");
    try {
      const response = await authedFetch(`${apiUrl}/settings/scrap-soft-hold-policy`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSettingsStatus(body.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      const saved = (await response.json()) as SoftHoldPolicy;
      setSoftHoldPolicy(saved);
      setSettingsStatus("Politica de reserva temporal actualizada.");
    } finally {
      loadingKey(null);
    }
  }

  return {
    scrapPolicy,
    setScrapPolicy,
    scrapMinWidthCmInput,
    setScrapMinWidthCmInput,
    settingsStatus,
    cutScrapPolicy,
    setCutScrapPolicy,
    softHoldPolicy,
    setSoftHoldPolicy,
    loadScrapPolicy,
    handleUpdateScrapPolicy,
    handleUpdateCutScrapPolicy,
    handleUpdateSoftHoldPolicy
  };
}
