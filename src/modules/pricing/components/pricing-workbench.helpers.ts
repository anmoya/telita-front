export const ENTITY_TYPE_LABELS: Record<string, string> = {
  sale: "Venta",
  sale_line: "Línea de venta",
  cut_job: "Trabajo de corte",
  scrap: "Retazo",
  label: "Etiqueta",
  quote_batch: "Cotización",
  price_list: "Lista de precios",
  fabric_sku: "SKU",
  app_user: "Usuario",
  storage_location: "Ubicación"
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  STATUS_CHANGE: "Cambio de estado",
  DELETE: "Eliminación",
  PRINT: "Impresión"
};

export function roundClpFront(value: number) {
  const rounded = Math.round(value);
  const remainder = rounded % 10;
  return remainder <= 5 ? rounded - remainder : rounded - remainder + 10;
}
