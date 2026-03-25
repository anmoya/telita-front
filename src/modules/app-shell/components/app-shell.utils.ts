import type { MenuKey as WorkbenchMenuKey } from "../../operations/shared/workbench.shared-types";
import { PRIMARY_MENU_KEYS, WORKBENCH_MENU_KEYS } from "./app-shell.config";
import type { AppMenuKey, TokenInfo } from "./app-shell.types";

type OperationsWorkbenchMenuKey = Exclude<WorkbenchMenuKey, "historial-cotizaciones">;

export function decodeToken(token: string): TokenInfo | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"))) as TokenInfo;
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export function isOperationsWorkbenchMenu(menu: AppMenuKey): menu is OperationsWorkbenchMenuKey {
  return menu !== "historial-cotizaciones" && PRIMARY_MENU_KEYS.includes(menu);
}

export function isWorkbenchMenu(menu: string): menu is WorkbenchMenuKey {
  return WORKBENCH_MENU_KEYS.includes(menu as WorkbenchMenuKey);
}

export function shouldLockContentScroll(menu: AppMenuKey) {
  return menu === "pricing" || menu === "sales";
}
