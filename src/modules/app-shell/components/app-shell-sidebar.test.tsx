import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ALL_MENU_ITEMS } from "./app-shell.config";
import { AppShellSidebar } from "./app-shell-sidebar";

test("AppShellSidebar renders primary and admin menu groups", () => {
  const primaryMenuItems = ALL_MENU_ITEMS.filter((item) =>
    ["dashboard", "pricing", "sales"].includes(item.key)
  );
  const adminMenuItems = ALL_MENU_ITEMS.filter((item) =>
    ["catalogo", "usuarios"].includes(item.key)
  );

  const markup = renderToStaticMarkup(
    <AppShellSidebar
      activeMenu="sales"
      primaryMenuItems={primaryMenuItems}
      adminMenuItems={adminMenuItems}
      onSelectMenu={() => undefined}
    />
  );

  assert.match(markup, /Operacion/);
  assert.match(markup, /Administracion/);
  assert.match(markup, /Dashboard/);
  assert.match(markup, /Catalogo/);
  assert.match(markup, /Usuarios/);
  assert.match(markup, /nav-item-active/);
});
