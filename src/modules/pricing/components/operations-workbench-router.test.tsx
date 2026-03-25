import assert from "node:assert/strict";
import test from "node:test";
import type { ComponentProps } from "react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuditWorkbench } from "../../audit/components/audit-workbench";
import { CutsWorkbenchContainer } from "../../cuts/components/cuts-workbench-container";
import { DashboardWorkbench } from "../../dashboard/components/dashboard-workbench";
import { LabelsWorkbenchContainer } from "../../labels/components/labels-workbench-container";
import type { MenuKey } from "../../operations/shared/workbench.shared-types";
import { SalesWorkbenchContainer } from "../../sales/components/sales-workbench-container";
import { ScrapsWorkbench } from "../../scraps/components/scraps-workbench";
import { SettingsWorkbench } from "../../settings/components/settings-workbench";
import { MarginBreakdownDialog } from "./margin-breakdown-dialog";
import { OperationsWorkbenchRouter } from "./operations-workbench-router";
import { PricingWorkbench } from "./pricing-workbench";
import { QuotePreviewDialog } from "./quote-preview-dialog";

function createRouterMarkup(activeMenu: MenuKey) {
  return renderToStaticMarkup(
    <OperationsWorkbenchRouter
      activeMenu={activeMenu}
      panelClassName="panel panel--plain"
      dashboardProps={{
        loadingMenu: false,
        dashboardKpis: {
          date: "2026-03-23",
          branchCode: "MAIN",
          quotesCreatedToday: 3,
          salesConfirmedToday: 2,
          salesCanceledToday: 1,
          pendingScraps: 4,
          labelsPrintedToday: 7
        },
        pendingScraps: [],
        auditEvents: [],
        onRefresh: () => undefined,
        onNavigate: () => undefined
      }}
      pricingProps={{} as ComponentProps<typeof PricingWorkbench>}
      salesProps={{} as ComponentProps<typeof SalesWorkbenchContainer>}
      cutsProps={{} as ComponentProps<typeof CutsWorkbenchContainer>}
      scrapsProps={{} as ComponentProps<typeof ScrapsWorkbench>}
      labelsProps={{} as ComponentProps<typeof LabelsWorkbenchContainer>}
      settingsProps={{} as ComponentProps<typeof SettingsWorkbench>}
      auditProps={{} as ComponentProps<typeof AuditWorkbench>}
      quotePreviewDialogProps={{
        open: false,
        previewMode: "CUSTOMER",
        previewData: null,
        amountPaid: 0,
        onClose: () => undefined,
        onSwitchMode: () => undefined
      } satisfies ComponentProps<typeof QuotePreviewDialog>}
      marginBreakdownDialogProps={{
        open: false,
        quoteItems: [],
        customerDiscountInfo: { text: "", pct: 0 },
        commercialAdjustmentPct: 0,
        commercialAdjustmentAmount: 0,
        installationAmount: 0,
        amountPaid: 0,
        onClose: () => undefined
      } satisfies ComponentProps<typeof MarginBreakdownDialog>}
    />
  );
}

test("OperationsWorkbenchRouter renders dashboard workbench for dashboard menu", () => {
  const markup = createRouterMarkup("dashboard");

  assert.match(markup, /Resumen operativo/);
  assert.match(markup, /Nueva cotización/);
  assert.doesNotMatch(markup, /Cotizador modular/);
});

test("OperationsWorkbenchRouter keeps dialogs out of the tree when they are closed", () => {
  const markup = createRouterMarkup("dashboard");

  assert.doesNotMatch(markup, /Vista previa/);
  assert.doesNotMatch(markup, /Desglose interno/);
});
