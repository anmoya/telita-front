import assert from "node:assert/strict";
import test from "node:test";
import { buildScrapsProps, buildSettingsProps } from "./build-quote-form-operational-props";
import type { ActiveModal } from "../../operations/shared/workbench.shared-types";

test("buildScrapsProps maps labels and routes scraps actions to state setters", () => {
  let activeModal: ActiveModal = null;
  let modalLocationCode = "A-01";
  let modalStatus = "busy";
  let salesInitialSearch = "";
  let navigatedTo = "";

  const props = buildScrapsProps({
    loadingMenu: false,
    scrapStatus: "",
    scraps: [],
    scrapFilterStatus: "ALL",
    scrapSearchQuery: "",
    scrapPage: 1,
    scrapPageCount: 1,
    totalScraps: 0,
    selectedScrapIds: [],
    scrapId: "",
    activeModal,
    modalLocationCode,
    modalStatus,
    loadingModal: false,
    statusLabels: {
      sale: [],
      cut_job: [],
      scrap: [{ code: "STORED", label: "Almacenado", description: "" }]
    },
    setScrapId: () => undefined,
    setActiveModal: (value) => {
      activeModal = typeof value === "function" ? value(activeModal) : value;
    },
    setModalLocationCode: (value) => {
      modalLocationCode = typeof value === "function" ? value(modalLocationCode) : value;
    },
    setModalStatus: (value) => {
      modalStatus = typeof value === "function" ? value(modalStatus) : value;
    },
    setSalesInitialSearch: (value) => {
      salesInitialSearch = typeof value === "function" ? value(salesInitialSearch) : value;
    },
    onNavigate: (menu) => {
      navigatedTo = menu;
    },
    scrapsWorkbench: {
      setScrapFilterStatus: () => undefined,
      setScrapSearchQuery: () => undefined,
      prevScrapPage: () => undefined,
      nextScrapPage: () => undefined,
      handleListScraps: async () => undefined,
      handlePrintScrapLabels: async () => undefined,
      setSelectedScrapIds: () => undefined,
      toggleScrapSelection: () => undefined,
      handleCreateScrapLabel: async () => undefined,
      handleModalAssignLocation: async () => undefined,
      labelPreviewHtml: null,
      closeLabelPreview: () => undefined
    }
  });

  assert.equal(props.getScrapStatusLabel("STORED"), "Almacenado");

  props.onOpenAssignLocation("scrap-1");
  assert.ok(props.onNavigateToSale);
  props.onNavigateToSale("COT-42");

  assert.deepEqual(activeModal, { type: "assign-scrap-location", scrapId: "scrap-1" });
  assert.equal(modalLocationCode, "");
  assert.equal(modalStatus, "");
  assert.equal(salesInitialSearch, "COT-42");
  assert.equal(navigatedTo, "sales");
});

test("buildSettingsProps refreshes all policy loaders and preserves update callbacks", async () => {
  const calls: string[] = [];

  const props = buildSettingsProps({
    loadingMenu: false,
    loadingActionId: null,
    settingsStatus: "",
    scrapPolicy: null,
    scrapMinWidthCmInput: "50",
    cutScrapPolicy: null,
    softHoldPolicy: null,
    cutSheetPolicy: null,
    loadScrapPolicy: async () => {
      calls.push("scrap");
    },
    loadCutSheetPolicy: async () => {
      calls.push("cut-sheet");
    },
    loadCutScrapPolicy: async () => {
      calls.push("cut-scrap");
    },
    loadSoftHoldPolicy: async () => {
      calls.push("soft-hold");
    },
    setScrapMinWidthCmInput: () => undefined,
    handleUpdateScrapPolicy: () => undefined,
    handleUpdateCutScrapPolicy: () => undefined,
    handleUpdateSoftHoldPolicy: () => undefined,
    handleUpdateCutSheetPolicy: () => undefined
  });

  props.onRefreshScrapPolicy();
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(calls, ["scrap", "cut-sheet", "cut-scrap", "soft-hold"]);
  assert.equal(props.onUpdateScrapPolicy != null, true);
  assert.equal(props.onUpdateCutScrapPolicy != null, true);
  assert.equal(props.onUpdateSoftHoldPolicy != null, true);
  assert.equal(props.onUpdateCutSheetPolicy != null, true);
});
