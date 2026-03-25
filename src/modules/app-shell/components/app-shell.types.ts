import type { MenuKey as WorkbenchMenuKey } from "../../operations/shared/workbench.shared-types";

export type AppMenuKey =
  | WorkbenchMenuKey
  | "usuarios"
  | "catalogo"
  | "perfil"
  | "listas-precios"
  | "ubicaciones"
  | "categorias-cotizacion"
  | "clientes";

export type UserRole = "superadmin" | "admin" | "operador";

export type TokenInfo = {
  sub: string;
  email: string;
  role: UserRole;
};

export type MenuItem = {
  key: AppMenuKey;
  label: string;
  roles?: UserRole[];
};
