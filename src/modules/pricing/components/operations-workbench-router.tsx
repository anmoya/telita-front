"use client";

import type { ComponentProps } from "react";
import { AuditWorkbench } from "../../audit/components/audit-workbench";
import { CutsWorkbenchContainer } from "../../cuts/components/cuts-workbench-container";
import { DashboardWorkbench } from "../../dashboard/components/dashboard-workbench";
import { LabelsWorkbenchContainer } from "../../labels/components/labels-workbench-container";
import { MarginBreakdownDialog } from "./margin-breakdown-dialog";
import { PricingWorkbench } from "./pricing-workbench";
import { QuotePreviewDialog } from "./quote-preview-dialog";
import type { MenuKey } from "../../operations/shared/workbench.shared-types";
import { SalesWorkbenchContainer } from "../../sales/components/sales-workbench-container";
import { ScrapsWorkbench } from "../../scraps/components/scraps-workbench";
import { SettingsWorkbench } from "../../settings/components/settings-workbench";

type OperationsWorkbenchRouterProps = {
  activeMenu: MenuKey;
  panelClassName: string;
  dashboardProps: ComponentProps<typeof DashboardWorkbench>;
  pricingProps: ComponentProps<typeof PricingWorkbench>;
  salesProps: ComponentProps<typeof SalesWorkbenchContainer>;
  cutsProps: ComponentProps<typeof CutsWorkbenchContainer>;
  scrapsProps: ComponentProps<typeof ScrapsWorkbench>;
  labelsProps: ComponentProps<typeof LabelsWorkbenchContainer>;
  settingsProps: ComponentProps<typeof SettingsWorkbench>;
  auditProps: ComponentProps<typeof AuditWorkbench>;
  quotePreviewDialogProps: ComponentProps<typeof QuotePreviewDialog>;
  marginBreakdownDialogProps: ComponentProps<typeof MarginBreakdownDialog>;
};

export function OperationsWorkbenchRouter({
  activeMenu,
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
}: OperationsWorkbenchRouterProps) {
  return (
    <section className={panelClassName}>
      {activeMenu === "dashboard" ? <DashboardWorkbench {...dashboardProps} /> : null}
      {activeMenu === "pricing" ? <PricingWorkbench {...pricingProps} /> : null}
      {activeMenu === "sales" ? <SalesWorkbenchContainer {...salesProps} /> : null}
      {activeMenu === "cuts" ? <CutsWorkbenchContainer {...cutsProps} /> : null}
      {activeMenu === "scraps" ? <ScrapsWorkbench {...scrapsProps} /> : null}
      {activeMenu === "labels" ? <LabelsWorkbenchContainer {...labelsProps} /> : null}
      {activeMenu === "settings" ? <SettingsWorkbench {...settingsProps} /> : null}
      {activeMenu === "audit" ? <AuditWorkbench {...auditProps} /> : null}

      <QuotePreviewDialog {...quotePreviewDialogProps} />
      <MarginBreakdownDialog {...marginBreakdownDialogProps} />
    </section>
  );
}
