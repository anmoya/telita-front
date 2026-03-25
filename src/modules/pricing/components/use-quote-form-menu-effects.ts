"use client";

import { useEffect } from "react";
import type { MenuKey } from "../../operations/shared/workbench.shared-types";

type UseQuoteFormMenuEffectsArgs = {
  activeMenu: MenuKey;
  cutPage: number;
  editingBatchId?: string | null;
  onLoadDashboard: () => Promise<void>;
  onLoadCutJobs: () => Promise<void>;
  onLoadCutScrapPolicy: () => Promise<void>;
  onLoadSoftHoldPolicy: () => Promise<void>;
  onLoadScrapPolicy: () => Promise<void>;
  onLoadCutSheetPolicy: () => Promise<void>;
  onLoadEditingBatch: (batchId: string) => Promise<void>;
  onClearEditingBatch?: () => void;
};

export function useQuoteFormMenuEffects({
  activeMenu,
  cutPage,
  editingBatchId,
  onLoadDashboard,
  onLoadCutJobs,
  onLoadCutScrapPolicy,
  onLoadSoftHoldPolicy,
  onLoadScrapPolicy,
  onLoadCutSheetPolicy,
  onLoadEditingBatch,
  onClearEditingBatch
}: UseQuoteFormMenuEffectsArgs) {
  useEffect(() => {
    if (activeMenu === "dashboard") void onLoadDashboard();
    if (activeMenu === "cuts") {
      void onLoadCutJobs();
      void onLoadCutScrapPolicy();
      void onLoadSoftHoldPolicy();
    }
    if (activeMenu === "settings") {
      void onLoadScrapPolicy();
      void onLoadCutSheetPolicy();
      void onLoadCutScrapPolicy();
      void onLoadSoftHoldPolicy();
    }
    if (activeMenu === "sales") {
      void onLoadCutSheetPolicy();
    }
  }, [activeMenu, onLoadCutJobs, onLoadCutScrapPolicy, onLoadCutSheetPolicy, onLoadDashboard, onLoadScrapPolicy, onLoadSoftHoldPolicy]);

  useEffect(() => {
    if (activeMenu === "cuts") {
      void onLoadCutJobs();
    }
  }, [activeMenu, cutPage, onLoadCutJobs]);

  useEffect(() => {
    if (editingBatchId && activeMenu === "pricing") {
      void onLoadEditingBatch(editingBatchId);
      onClearEditingBatch?.();
    }
  }, [activeMenu, editingBatchId, onClearEditingBatch, onLoadEditingBatch]);
}
