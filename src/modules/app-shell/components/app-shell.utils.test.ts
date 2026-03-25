import assert from "node:assert/strict";
import test from "node:test";
import { decodeToken, isOperationsWorkbenchMenu, isWorkbenchMenu, shouldLockContentScroll } from "./app-shell.utils";

function createToken(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.signature`;
}

test("decodeToken returns token info for a valid token payload", () => {
  const token = createToken({
    sub: "user-1",
    email: "ops@telita.cl",
    role: "admin"
  });

  assert.deepEqual(decodeToken(token), {
    sub: "user-1",
    email: "ops@telita.cl",
    role: "admin"
  });
});

test("decodeToken returns null for an invalid token", () => {
  assert.equal(decodeToken("invalid-token"), null);
});

test("menu helpers distinguish operations workbench menus and scroll-lock targets", () => {
  assert.equal(isOperationsWorkbenchMenu("pricing"), true);
  assert.equal(isOperationsWorkbenchMenu("historial-cotizaciones"), false);
  assert.equal(isWorkbenchMenu("cuts"), true);
  assert.equal(isWorkbenchMenu("catalogo"), false);
  assert.equal(shouldLockContentScroll("pricing"), true);
  assert.equal(shouldLockContentScroll("sales"), true);
  assert.equal(shouldLockContentScroll("dashboard"), false);
});
