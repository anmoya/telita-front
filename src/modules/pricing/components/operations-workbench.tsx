"use client";

import type { MenuKey } from "../../operations/shared/workbench.shared-types";
import { OperationsWorkbenchRouter } from "./operations-workbench-router";
import { useOperationsWorkbenchEntry } from "./use-operations-workbench-entry";

type OperationsWorkbenchProps = {
  accessToken: string;
  activeMenu: MenuKey;
  onNavigate: (menu: MenuKey) => void;
  editingBatchId?: string | null;
  onClearEditingBatch?: () => void;
};

export function OperationsWorkbench({
  accessToken,
  activeMenu,
  onNavigate,
  editingBatchId,
  onClearEditingBatch
}: OperationsWorkbenchProps) {
  const {
    panelClassName,
    dashboardProps,
    pricingProps,
    salesProps,
    cutsProps,
    scrapsProps,
    labelsProps,
    settingsProps,
    auditProps,
    quotePreviewDialogProps,
    marginBreakdownDialogProps
  } = useOperationsWorkbenchEntry({
    accessToken,
    activeMenu,
    onNavigate,
    editingBatchId,
    onClearEditingBatch
  });

  return (
    <OperationsWorkbenchRouter
      activeMenu={activeMenu}
      panelClassName={panelClassName}
      dashboardProps={dashboardProps}
      pricingProps={pricingProps}
      salesProps={salesProps}
      cutsProps={cutsProps}
      scrapsProps={scrapsProps}
      labelsProps={labelsProps}
      settingsProps={settingsProps}
      auditProps={auditProps}
      quotePreviewDialogProps={quotePreviewDialogProps}
      marginBreakdownDialogProps={marginBreakdownDialogProps}
    />
  );
}
