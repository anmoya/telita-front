import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShellContentRouter } from "./app-shell-content-router";

test("AppShellContentRouter renders nothing when token info is missing", () => {
  const markup = renderToStaticMarkup(
    <AppShellContentRouter
      activeMenu="dashboard"
      accessToken="token"
      apiUrl="http://localhost:3001/v1"
      tokenInfo={null}
      editingBatchId={null}
      onNavigateWorkbench={() => undefined}
      onEditBatch={() => undefined}
      onClearEditingBatch={() => undefined}
      onStartTour={() => undefined}
    />
  );

  assert.equal(markup, "");
});

test("AppShellContentRouter renders quote history workspace for historial-cotizaciones", () => {
  const markup = renderToStaticMarkup(
    <AppShellContentRouter
      activeMenu="historial-cotizaciones"
      accessToken="token"
      apiUrl="http://localhost:3001/v1"
      tokenInfo={{ sub: "user-1", email: "ops@telita.cl", role: "admin" }}
      editingBatchId={null}
      onNavigateWorkbench={() => undefined}
      onEditBatch={() => undefined}
      onClearEditingBatch={() => undefined}
      onStartTour={() => undefined}
    />
  );

  assert.match(markup, /Cotización seleccionada/);
  assert.match(markup, /Historial de cotizaciones/);
  assert.match(markup, /Sin cotización seleccionada/);
});
