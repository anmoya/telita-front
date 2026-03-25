import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShellTopbar } from "./app-shell-topbar";

test("AppShellTopbar renders title, role and user identity", () => {
  const markup = renderToStaticMarkup(
    <AppShellTopbar
      title="Ventas"
      role="admin"
      email="ops@telita.cl"
      onLogout={() => undefined}
    />
  );

  assert.match(markup, /Sistema operativo textil/);
  assert.match(markup, />Ventas</);
  assert.match(markup, />admin</);
  assert.match(markup, /ops@telita\.cl/);
  assert.match(markup, /Cerrar sesion/);
});
