import type { MenuKey as WorkbenchMenuKey } from "../../operations/shared/workbench.shared-types";
import type { AppMenuKey, MenuItem } from "./app-shell.types";

export const ALL_MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "historial-cotizaciones", label: "Cotizaciones" },
  { key: "pricing", label: "Crear Cotizacion" },
  { key: "sales", label: "Ventas" },
  { key: "cuts", label: "Cortes" },
  { key: "scraps", label: "Retazos" },
  { key: "labels", label: "Etiquetas" },
  { key: "audit", label: "Auditoria" },
  { key: "settings", label: "Configuracion" },
  { key: "catalogo", label: "Catalogo", roles: ["superadmin", "admin"] },
  { key: "listas-precios", label: "Listas Precios", roles: ["superadmin", "admin"] },
  { key: "ubicaciones", label: "Ubicaciones", roles: ["superadmin", "admin"] },
  { key: "categorias-cotizacion", label: "Cat. Cotizacion", roles: ["superadmin", "admin"] },
  { key: "clientes", label: "Clientes", roles: ["superadmin", "admin"] },
  { key: "usuarios", label: "Usuarios", roles: ["superadmin", "admin"] },
  { key: "perfil", label: "Mi perfil" }
];

export const PRIMARY_MENU_KEYS: AppMenuKey[] = [
  "dashboard",
  "historial-cotizaciones",
  "pricing",
  "sales",
  "cuts",
  "scraps",
  "labels",
  "audit",
  "settings"
];

export const WORKBENCH_MENU_KEYS: WorkbenchMenuKey[] = [
  "dashboard",
  "historial-cotizaciones",
  "pricing",
  "sales",
  "cuts",
  "scraps",
  "labels",
  "audit",
  "settings"
];
