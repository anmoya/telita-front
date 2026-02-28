"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";
import { formatLocalDateTime } from "../../../shared/time/date-service";
import { fetchStatusLabels, getStatusLabel, type StatusLabelsByEntity, type EntityType } from "../../../shared/api/status-labels";

type MenuKey = "dashboard" | "pricing" | "sales" | "cuts" | "scraps" | "labels" | "audit" | "settings" | "historial-cotizaciones";

type ScrapRequiredAtStage = "NONE" | "AT_CUT" | "AT_SALE_CLOSE";

type ActiveModal =
  | { type: "pre-cut-location"; cutJobId: string }
  | { type: "post-cut-location"; scrapId: string }
  | { type: "assign-scrap-location"; scrapId: string }
  | null;

type QuoteItem = {
  id: string;
  widthM: string;
  heightM: string;
  quantity: string;
  description?: string;
  // SPEC-34: per-item SKU + calc status
  skuCode?: string;
  calcStatus?: "pending" | "ok" | "error";
  calcError?: string;
  unitPrice?: number;
  subtotal?: number;
  priceMethod?: string;
  // SPEC-33: category + metadata
  categoryId?: string;
  categoryName?: string;
  lineNote?: string;
};

type QuoteItemCategory = {
  id: string;
  name: string;
  isActive: boolean;
};

type PreviewLine = {
  index: number;
  skuCode: string;
  description: string;
  categoryName: string | null;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceMethod: string;
  linearMeters?: number;
  error?: string;
};

type PreviewResult = {
  header: { branchName: string; date: string; priceListName: string };
  customer: { name: string | null; reference: string | null };
  lines: PreviewLine[];
  totals: { subtotal: number; tax: number; total: number; currencyCode: string };
  hasErrors: boolean;
  internalBreakdown?: unknown;
};

type QuoteRow = {
  id: string;
  currencyCode: string;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  unitPrice: number;
  linearMeters: number;
  subtotalAmount: number;
  totalRounded: number;
  createdAt: string;
};

type SaleLineRow = {
  id: string;
  skuCode: string;
  quantity: number;
  requestedWidthM: number;
  requestedHeightM: number;
  unitPrice: number;
  lineTotal: number;
  allocatedScrapId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  displayOrder: number;
  lineNote: string | null;
};

type ScrapMatchRow = {
  id: string;
  widthM: number;
  heightM: number;
  areaM2: number;
  excessAreaM2: number;
  skuCode: string;
  locationCode: string | null;
};

type SaleRow = {
  id: string;
  status: string;
  quoteCode: string | null;
  quoteNumber: number | null;
  customerName: string | null;
  customerReference: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  lines: SaleLineRow[];
};

type ScrapRow = {
  id: string;
  status: string;
  areaM2: number;
  widthM: number;
  heightM: number;
  skuCode: string;
  locationCode: string | null;
  quoteId: string | null;
};

type DashboardKpis = {
  date: string;
  branchCode: string;
  quotesCreatedToday: number;
  salesConfirmedToday: number;
  salesCanceledToday: number;
  pendingScraps: number;
  labelsPrintedToday: number;
};

type PendingScrapRow = {
  id: string;
  createdAt: string;
  areaM2: number;
  widthM: number;
  heightM: number;
  skuCode: string;
  skuName: string;
  quoteId: string | null;
  quoteCreatedAt: string | null;
};

type BatchLabelResult = {
  labelId: string;
  saleLineId: string;
  skuCode: string;
  printEventId: string;
};

type LabelRow = {
  id: string;
  type: string;
  saleLineId: string | null;
  scrapId: string | null;
  quoteId: string | null;
  createdAt: string;
  lastPrintedAt: string | null;
};

type AuditRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: { email: string; fullName: string; role: string };
  createdAt: string;
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
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

const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  STATUS_CHANGE: "Cambio de estado",
  DELETE: "Eliminación",
  PRINT: "Impresión"
};

type CutJobStatus = "PENDING" | "IN_PROGRESS" | "CUT" | "DELIVERED";

type CutJobRow = {
  id: string;
  saleId: string;
  saleLineId: string;
  status: CutJobStatus;
  cutAt: string | null;
  requestedWidthM: number;
  requestedHeightM: number;
  quantity: number;
  skuCode: string;
  skuName: string;
  saleCreatedAt: string;
};

type QuoteFormProps = {
  accessToken: string;
  activeMenu: MenuKey;
  onNavigate: (menu: MenuKey) => void;
};

// SPEC-36: Bloque estándar de totales
function TotalsBlock({
  subtotal,
  tax,
  total,
  amountPaid,
  balanceDue,
  marginActive
}: {
  subtotal: number;
  tax: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  marginActive?: boolean;
}) {
  return (
    <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
      <div>Subtotal: <strong>${subtotal.toLocaleString()}</strong></div>
      <div>IVA (19%): <strong>${Math.round(tax).toLocaleString()}</strong></div>
      <div>Total: <strong>${Math.round(total).toLocaleString()} CLP</strong></div>
      {amountPaid !== undefined && (
        <div style={{ color: amountPaid > 0 ? "var(--ok, green)" : undefined }}>
          Abonado: <strong>${amountPaid.toLocaleString()}</strong>
        </div>
      )}
      {balanceDue !== undefined && (
        <div style={{ color: balanceDue > 0 ? "var(--error, red)" : "var(--ok, green)", fontWeight: 600 }}>
          Saldo: ${balanceDue.toLocaleString()}
        </div>
      )}
      {marginActive && (
        <div style={{ fontSize: "0.8em", color: "var(--muted)" }}>* Total ajustado con margen operador (solo vista)</div>
      )}
    </div>
  );
}

export function QuoteForm({ accessToken, activeMenu, onNavigate }: QuoteFormProps) {
  const apiUrl = process.env.NEXT_PUBLIC_TELITA_API_URL ?? "http://localhost:3001/v1";

  const [heightM, setHeightM] = useState("2.0");
  const [widthM, setWidthM] = useState("2.0");
  const [quantity, setQuantity] = useState("1");

  // SPEC-32: Selectores dinámicos
  const [selectedPriceListName, setSelectedPriceListName] = useState("");
  const [skuOptions, setSkuOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [priceListOptions, setPriceListOptions] = useState<Array<{ name: string; isActive: boolean }>>([]);
  const [loadingSelectors, setLoadingSelectors] = useState(false);

  // SPEC-32: Multi-item
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { id: crypto.randomUUID(), widthM: "2.0", heightM: "2.0", quantity: "1", description: "" }
  ]);

  // SPEC-33: Categories
  const [categories, setCategories] = useState<QuoteItemCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // SPEC-34: batch calculation state
  const [loadingBatch, setLoadingBatch] = useState(false);

  // SPEC-35: customer fields in cotizador + create draft state
  const [quoteCustomerName, setQuoteCustomerName] = useState("");
  const [quoteCustomerReference, setQuoteCustomerReference] = useState("");
  const [loadingCreateDraft, setLoadingCreateDraft] = useState(false);
  const [highlightedSaleId, setHighlightedSaleId] = useState<string | null>(null);

  // BUG-6: label preview modal
  const [labelPreview, setLabelPreview] = useState<{ id: string; url: string } | null>(null);

  // BUG-3: dedicated state for adding a single line to an existing sale
  const [newLineSkuCode, setNewLineSkuCode] = useState("");
  const [newLineWidth, setNewLineWidth] = useState("2.0");
  const [newLineHeight, setNewLineHeight] = useState("2.0");
  const [newLineQty, setNewLineQty] = useState("1");

  // SPEC-38: Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // SPEC-32: Operator margin (no persistido en BD)
  const [operatorMargin, setOperatorMargin] = useState(0);

  const [status, setStatus] = useState<string>("");
  const [salesStatus, setSalesStatus] = useState<string>("");
  const [scrapStatus, setScrapStatus] = useState<string>("");
  const [labelStatus, setLabelStatus] = useState<string>("");
  const [cutsStatus, setCutsStatus] = useState<string>("");

  const [saleId, setSaleId] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerReference, setCustomerReference] = useState("");
  const [scrapId, setScrapId] = useState("");
  const [labelId, setLabelId] = useState("");
  const [cutFilterStatus, setCutFilterStatus] = useState<CutJobStatus | "ALL">("PENDING");

  // Modal state
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [modalLocationCode, setModalLocationCode] = useState("");
  const [modalStatus, setModalStatus] = useState("");

  const [scrapSuggestions, setScrapSuggestions] = useState<ScrapMatchRow[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState("");
  const [activeLine, setActiveLine] = useState<SaleLineRow | null>(null);
  const [activeSaleIdForAlloc, setActiveSaleIdForAlloc] = useState("");

  const [flowRules, setFlowRules] = useState<{ scrapRequiredAtStage: ScrapRequiredAtStage } | null>(null);
  const [settingsStatus, setSettingsStatus] = useState("");

  const [quoteResult, setQuoteResult] = useState<{
    quoteId: string;
    linearMeters: number;
    subtotal: number;
    totalRounded: number;
    currencyCode: string;
  } | null>(null);

  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [scraps, setScraps] = useState<ScrapRow[]>([]);
  const [cutJobs, setCutJobs] = useState<CutJobRow[]>([]);

  const [batchResults, setBatchResults] = useState<BatchLabelResult[]>([]);
  const [labelList, setLabelList] = useState<LabelRow[]>([]);
  const [batchSaleId, setBatchSaleId] = useState("");

  // SPEC-25: multi-select for batch print
  const [selectedScrapIds, setSelectedScrapIds] = useState<string[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [dashboardKpis, setDashboardKpis] = useState<DashboardKpis | null>(null);
  const [pendingScraps, setPendingScraps] = useState<PendingScrapRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);

  // Status labels for localized display
  const [statusLabels, setStatusLabels] = useState<StatusLabelsByEntity>({ sale: [], cut_job: [], scrap: [] });

  // Loading states
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const linearMeters = useMemo(() => Number(heightM || 0) * Number(quantity || 0), [heightM, quantity]);

  // Load flow rules on mount so cuts section is ready
  useEffect(() => {
    void loadFlowRules();
    void loadStatusLabels();
    void loadSelectorsData();
    void loadCategories();
  }, []);

  // SPEC-32: Multi-item helpers
  function addQuoteItem() {
    setQuoteItems([
      ...quoteItems,
      { id: crypto.randomUUID(), widthM: "", heightM: "", quantity: "1", description: "" }
    ]);
  }

  function removeQuoteItem(id: string) {
    if (quoteItems.length === 1) {
      setStatus("Debe haber al menos un ítem");
      return;
    }
    setQuoteItems(quoteItems.filter((item) => item.id !== id));
  }

  function updateQuoteItem(id: string, updates: Partial<QuoteItem>) {
    setQuoteItems(
      quoteItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  // SPEC-34: Calcular todo vía quote-batch
  async function handleCalculateAll() {
    if (!selectedPriceListName) {
      setStatus("Selecciona una lista de precios");
      return;
    }
    const itemsWithSku = quoteItems.map((it) => ({ ...it, resolvedSku: it.skuCode ?? "" }));
    if (itemsWithSku.some((it) => !it.resolvedSku)) {
      setStatus("Asigna un SKU a todos los ítems");
      return;
    }
    setLoadingBatch(true);
    // Reset calc status
    setQuoteItems((prev) => prev.map((it) => ({ ...it, calcStatus: "pending" as const, calcError: undefined })));
    try {
      const response = await authedFetch(`${apiUrl}/pricing/quote-batch`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          items: itemsWithSku.map((it) => ({
            clientItemId: it.id,
            skuCode: it.resolvedSku,
            requestedWidthM: Number(it.widthM),
            requestedHeightM: Number(it.heightM),
            quantity: Number(it.quantity),
            description: it.description
          }))
        })
      });
      // Both 200 and 422 return the result body
      const data = await response.json() as {
        quoteBatchId?: string;
        currencyCode?: string;
        lines?: Array<{
          clientItemId: string;
          skuCode: string;
          ok: boolean;
          unitPrice?: number;
          subtotal?: number;
          totalRounded?: number;
          priceMethod?: string;
          error?: string;
        }>;
        subtotalAmount?: number;
        taxAmount?: number;
        totalAmount?: number;
        hasErrors?: boolean;
      };
      if (data.lines) {
        setQuoteItems((prev) =>
          prev.map((it) => {
            const line = data.lines!.find((l) => l.clientItemId === it.id);
            if (!line) return it;
            if (line.ok) {
              return {
                ...it,
                calcStatus: "ok" as const,
                calcError: undefined,
                unitPrice: line.unitPrice,
                subtotal: line.totalRounded ?? line.subtotal,  // BUG-2: usar totalRounded (post-descuento)
                priceMethod: line.priceMethod
              };
            } else {
              return { ...it, calcStatus: "error" as const, calcError: line.error };
            }
          })
        );
        if (data.hasErrors) {
          setStatus(`Calculo con errores en algunas filas.`);
        } else {
          setStatus(`Total: $${(data.totalAmount ?? 0).toLocaleString()} CLP (subtotal $${(data.subtotalAmount ?? 0).toLocaleString()} + IVA $${(data.taxAmount ?? 0).toLocaleString()})`);
        }
      }
    } catch (err) {
      setStatus(`Error al calcular batch: ${String(err)}`);
    } finally {
      setLoadingBatch(false);
    }
  }

  // SPEC-35: Create sale draft atomically from quote
  async function handleCreateDraftFromQuote() {
    if (!selectedPriceListName) {
      setStatus("Selecciona una lista de precios");
      return;
    }
    const allOk = quoteItems.every((it) => it.calcStatus === "ok");
    if (!allOk) {
      setStatus("Calcula todos los ítems antes de crear el draft");
      return;
    }
    setLoadingCreateDraft(true);
    try {
      const response = await authedFetch(`${apiUrl}/sales/from-quote`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          customerName: quoteCustomerName || undefined,
          customerReference: quoteCustomerReference || undefined,
          items: quoteItems.map((it, idx) => ({
            skuCode: it.skuCode ?? "",
            requestedWidthM: Number(it.widthM),
            requestedHeightM: Number(it.heightM),
            quantity: Number(it.quantity),
            categoryId: it.categoryId || undefined,
            categoryName: !it.categoryId && it.categoryName ? it.categoryName : undefined,
            lineNote: it.lineNote || undefined,
            displayOrder: idx
          }))
        })
      });
      const data = await response.json() as {
        saleId?: string;
        quoteCode?: string;
        status?: string;
        linesCreated?: number;
        subtotalAmount?: number;
        taxAmount?: number;
        totalAmount?: number;
        message?: string;
        lineErrors?: Array<{ index: number; error: string }>;
      };
      if (!response.ok) {
        const detail = data.lineErrors
          ? data.lineErrors.map((e) => `Item ${e.index + 1}: ${e.error}`).join("; ")
          : (data.message ?? "Error desconocido");
        setStatus(`Error: ${detail}`);
        return;
      }
      // SPEC-37: save to quote batch history (best-effort, non-blocking)
      void authedFetch(`${apiUrl}/quotes/batch`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          customerName: quoteCustomerName || undefined,
          customerReference: quoteCustomerReference || undefined,
          lines: quoteItems.map((it, idx) => ({
            skuCode: it.skuCode ?? "",
            requestedWidthM: Number(it.widthM),
            requestedHeightM: Number(it.heightM),
            quantity: Number(it.quantity),
            unitPrice: it.unitPrice ?? 0,
            lineSubtotal: it.subtotal ?? 0,
            priceMethod: it.priceMethod ?? "LINEAR_METER",
            categoryId: it.categoryId || undefined,
            categoryName: !it.categoryId && it.categoryName ? it.categoryName : undefined,
            lineNote: it.lineNote || undefined,
            displayOrder: idx
          }))
        })
      });
      // Success: reset cotizador, navigate to sales with highlight
      setQuoteItems([{ id: crypto.randomUUID(), widthM: "1", heightM: "1", quantity: "1" }]);
      setQuoteCustomerName("");
      setQuoteCustomerReference("");
      setStatus("");
      setHighlightedSaleId(data.saleId ?? null);
      // Load fresh sales list then navigate
      const salesRes = await authedFetch(`${apiUrl}/sales?branchCode=MAIN`);
      if (salesRes.ok) {
        const salesData = await salesRes.json() as SaleRow[];
        setSales(salesData);
      }
      onNavigate("sales");
    } catch (err) {
      setStatus(`Error al crear draft: ${String(err)}`);
    } finally {
      setLoadingCreateDraft(false);
    }
  }

  // SPEC-38: Generate preview (customer or internal)
  async function handlePreview(mode: "CUSTOMER" | "INTERNAL") {
    if (!selectedPriceListName) { setStatus("Selecciona una lista de precios"); return; }
    const allOk = quoteItems.every((it) => it.calcStatus === "ok");
    if (!allOk) { setStatus("Calcula todos los ítems antes de generar el preview"); return; }
    setLoadingPreview(true);
    try {
      const res = await authedFetch(`${apiUrl}/pricing/preview`, {
        method: "POST",
        body: JSON.stringify({
          mode,
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          customerName: quoteCustomerName || undefined,
          customerReference: quoteCustomerReference || undefined,
          items: quoteItems.map((it) => ({
            skuCode: it.skuCode ?? "",
            requestedWidthM: Number(it.widthM),
            requestedHeightM: Number(it.heightM),
            quantity: Number(it.quantity),
            description: it.description || it.skuCode || "",
            categoryName: it.categoryName || undefined
          }))
        })
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        setStatus(err.message ?? "Error al generar preview");
        return;
      }
      const data = await res.json() as PreviewResult;
      setPreviewData(data);
      setPreviewMode(mode);
      setPreviewOpen(true);
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setLoadingPreview(false);
    }
  }

  // SPEC-37: Save to quote batch history only (without creating a sale draft)
  async function handleSaveToHistory() {
    if (!selectedPriceListName) return;
    try {
      const res = await authedFetch(`${apiUrl}/quotes/batch`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          priceListName: selectedPriceListName,
          customerName: quoteCustomerName || undefined,
          customerReference: quoteCustomerReference || undefined,
          lines: quoteItems.map((it, idx) => ({
            skuCode: it.skuCode ?? "",
            requestedWidthM: Number(it.widthM),
            requestedHeightM: Number(it.heightM),
            quantity: Number(it.quantity),
            unitPrice: it.unitPrice ?? 0,
            lineSubtotal: it.subtotal ?? 0,
            priceMethod: it.priceMethod ?? "LINEAR_METER",
            categoryId: it.categoryId || undefined,
            categoryName: !it.categoryId && it.categoryName ? it.categoryName : undefined,
            lineNote: it.lineNote || undefined,
            displayOrder: idx
          }))
        })
      });
      if (res.ok) {
        setStatus("Cotización guardada en historial.");
      } else {
        setStatus("Error al guardar en historial.");
      }
    } catch {
      setStatus("Error al guardar en historial.");
    }
  }

  // SPEC-33: Move item up/down
  function moveItemUp(id: string) {
    const idx = quoteItems.findIndex((it) => it.id === id);
    if (idx <= 0) return;
    const next = [...quoteItems];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setQuoteItems(next);
  }

  function moveItemDown(id: string) {
    const idx = quoteItems.findIndex((it) => it.id === id);
    if (idx < 0 || idx >= quoteItems.length - 1) return;
    const next = [...quoteItems];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setQuoteItems(next);
  }

  // SPEC-33: Load categories
  async function loadCategories() {
    try {
      const res = await authedFetch(`${apiUrl}/quote-item-categories?branchCode=MAIN&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      // non-blocking
    }
  }

  // SPEC-33: Create category inline and assign to item
  async function handleCreateCategoryForItem(itemId: string, name: string) {
    if (!name.trim()) return;
    try {
      const res = await authedFetch(`${apiUrl}/quote-item-categories`, {
        method: "POST",
        body: JSON.stringify({ branchCode: "MAIN", name: name.trim() })
      });
      if (res.ok) {
        const cat: QuoteItemCategory = await res.json();
        setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
        updateQuoteItem(itemId, { categoryId: cat.id, categoryName: cat.name });
        setNewCategoryName("");
      }
    } catch {
      // non-blocking
    }
  }

  async function handleCalculateItem(itemId: string) {
    const item = quoteItems.find((it) => it.id === itemId);
    if (!item) return;
    
    const effectiveSkuCode = item.skuCode ?? "";
    if (!effectiveSkuCode || !selectedPriceListName) {
      setStatus("Asigna SKU y lista de precios a este ítem");
      return;
    }

    setLoadingActionId(itemId);
    try {
      const response = await authedFetch(`${apiUrl}/pricing/quote`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          skuCode: effectiveSkuCode,
          priceListName: selectedPriceListName,
          requestedWidthM: Number(item.widthM),
          requestedHeightM: Number(item.heightM),
          quantity: Number(item.quantity)
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = (body as { message?: string }).message ?? `HTTP ${response.status}`;
        updateQuoteItem(itemId, { calcStatus: "error", calcError: msg });
        throw new Error(msg);
      }
      const data = await response.json();
      updateQuoteItem(itemId, {
        unitPrice: data.unitPrice,
        subtotal: data.subtotal,
        priceMethod: data.priceMethod,
        calcStatus: "ok",
        calcError: undefined
      });
    } catch (error) {
      setStatus(`Error al calcular: ${String(error)}`);
    } finally {
      setLoadingActionId(null);
    }
  }

  // SPEC-32: Load SKU and price list options
  async function loadSelectorsData() {
    setLoadingSelectors(true);
    try {
      const [skuRes, plRes] = await Promise.all([
        authedFetch(`${apiUrl}/catalog/all-skus?branchCode=MAIN`),
        authedFetch(`${apiUrl}/price-lists?branchCode=MAIN`)
      ]);
      if (skuRes.ok) {
        const skus = await skuRes.json();
        setSkuOptions(skus || []);
      }
      if (plRes.ok) {
        const pls = await plRes.json();
        const activeLists = pls?.filter((pl: { isActive: boolean }) => pl.isActive) || [];
        setPriceListOptions(activeLists);
        if (activeLists?.length > 0 && !selectedPriceListName) {
          setSelectedPriceListName(activeLists[0].name);
        }
      }
    } catch (err) {
      console.error("Error loading selectors:", err);
    } finally {
      setLoadingSelectors(false);
    }
  }

  async function loadStatusLabels() {
    const labels = await fetchStatusLabels(apiUrl);
    setStatusLabels(labels);
  }

  useEffect(() => {
    if (activeMenu === "dashboard") void loadDashboard();
    if (activeMenu === "audit") void loadAudit();
    if (activeMenu === "cuts") void loadCutJobs();
    if (activeMenu === "scraps") void handleListScraps();
    if (activeMenu === "labels") void handleListLabels();
    if (activeMenu === "settings") void loadFlowRules();
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "cuts") {
      void loadCutJobs();
    }
  }, [activeMenu, cutFilterStatus]);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function loadDashboard() {
    setLoadingMenu(true);
    try {
      const [kpisRes, pendingRes, auditRes] = await Promise.all([
        authedFetch(`${apiUrl}/dashboard/kpis?branchCode=MAIN`),
        authedFetch(`${apiUrl}/dashboard/pending-scraps?branchCode=MAIN&limit=10`),
        authedFetch(`${apiUrl}/audit?branchCode=MAIN&limit=8`)
      ]);
      if (kpisRes.ok) setDashboardKpis((await kpisRes.json()) as DashboardKpis);
      if (pendingRes.ok) setPendingScraps((await pendingRes.json()) as PendingScrapRow[]);
      if (auditRes.ok) { const d = await auditRes.json() as { data: AuditRow[] }; setAuditEvents(d.data ?? []); }
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadAudit() {
    setLoadingMenu(true);
    try {
      const auditRes = await authedFetch(`${apiUrl}/audit?branchCode=MAIN&limit=20`);
      if (auditRes.ok) { const d = await auditRes.json() as { data: AuditRow[] }; setAuditEvents(d.data ?? []); }
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadCutJobs() {
    setLoadingMenu(true);
    try {
      const statusQuery = cutFilterStatus === "ALL" ? "" : `&status=${encodeURIComponent(cutFilterStatus)}`;
      const response = await authedFetch(`${apiUrl}/cut-jobs?branchCode=MAIN${statusQuery}`);
      if (!response.ok) {
        setCutsStatus(`Error listando cortes: HTTP ${response.status}`);
        return;
      }
      const rows = (await response.json()) as CutJobRow[];
      setCutJobs(rows);
      setCutsStatus("");
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadFlowRules() {
    const response = await authedFetch(`${apiUrl}/settings/flow-rules`);
    if (response.ok) setFlowRules((await response.json()) as { scrapRequiredAtStage: ScrapRequiredAtStage });
  }

  // Step 1: click "Marcar Cortado" — decide AT_CUT or direct
  async function onMarkCutClick(cutJobId: string) {
    const rules = flowRules ?? await loadFlowRulesAndReturn();
    if (rules?.scrapRequiredAtStage === "AT_CUT") {
      setActiveModal({ type: "pre-cut-location", cutJobId });
      setModalLocationCode("");
      setModalStatus("");
    } else {
      setLoadingActionId(cutJobId);
      try {
        await doMarkCut(cutJobId);
      } finally {
        setLoadingActionId(null);
      }
    }
  }

  async function handleModalMarkCut() {
    if (activeModal?.type !== "pre-cut-location") return;
    setLoadingModal(true);
    try {
      await doMarkCut(activeModal.cutJobId, modalLocationCode);
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleModalAssignLocation() {
    if (activeModal?.type !== "post-cut-location" && activeModal?.type !== "assign-scrap-location") return;
    setLoadingModal(true);
    try {
      await doAssignLocation(activeModal.scrapId, modalLocationCode);
    } finally {
      setLoadingModal(false);
    }
  }

  async function loadFlowRulesAndReturn() {
    const response = await authedFetch(`${apiUrl}/settings/flow-rules`);
    if (!response.ok) return null;
    const data = (await response.json()) as { scrapRequiredAtStage: ScrapRequiredAtStage };
    setFlowRules(data);
    return data;
  }

  // Step 2: call the API and react to the scrap result
  async function doMarkCut(cutJobId: string, locationCode?: string) {
    const body: { locationCode?: string } = {};
    if (locationCode) body.locationCode = locationCode;

    const response = await authedFetch(`${apiUrl}/cut-jobs/${cutJobId}/mark-cut`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = (await response.json()) as { message?: string };
      setCutsStatus(errorBody.message ?? `Error marcando corte: HTTP ${response.status}`);
      setActiveModal(null);
      return;
    }
    const result = (await response.json()) as {
      ok: boolean;
      scrap: { id: string; status: string; widthM: number; heightM: number; areaM2: number } | null;
    };
    setActiveModal(null);

    if (result.scrap) {
      setScrapId(result.scrap.id);
      if (result.scrap.status === "PENDING_STORAGE") {
        setCutsStatus(`Corte marcado. Retazo ${result.scrap.id.slice(0, 8)} pendiente de ubicacion.`);
        setActiveModal({ type: "post-cut-location", scrapId: result.scrap.id });
        setModalLocationCode("");
        setModalStatus("");
      } else {
        setCutsStatus(`Corte marcado. Retazo: ${result.scrap.id.slice(0, 8)} (${result.scrap.status})`);
      }
    } else {
      setCutsStatus(`Corte marcado: ${cutJobId.slice(0, 8)} (sin retazo util)`);
    }
    await loadCutJobs();
    void handleListScraps();
  }

  // Assign location to a scrap (used by both post-cut and scraps-table dialogs)
  async function doAssignLocation(scrapId: string, locationCode: string) {
    const response = await authedFetch(`${apiUrl}/scraps/${scrapId}/assign-location`, {
      method: "PATCH",
      body: JSON.stringify({ locationCode })
    });
    const body = await response.json();
    if (!response.ok) {
      setModalStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setModalStatus("");
    setActiveModal(null);
    await handleListScraps();
  }

  async function handleBatchLabels() {
    if (!batchSaleId) return;
    setLoadingMenu(true);
    setBatchResults([]);
    try {
      const response = await authedFetch(`${apiUrl}/labels/sale/${batchSaleId}/batch`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setLabelStatus(body.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      const data = (await response.json()) as { total: number; labels: BatchLabelResult[] };
      setBatchResults(data.labels);
      setLabelStatus(`${data.total} etiqueta(s) generada(s).`);
    } finally {
      setLoadingMenu(false);
    }
  }

  // SPEC-25: open batch-pdf in new tab, then register print events
  function openBatchPdf(labelIds: string[]) {
    if (labelIds.length === 0) return;
    const url = `${apiUrl}/labels/batch-pdf?labelIds=${labelIds.join(",")}&accessToken=${encodeURIComponent(accessToken)}`;
    window.open(url, "_blank", "noreferrer");
  }

  async function registerBatchPrint(labelIds: string[]) {
    if (labelIds.length === 0) return;
    await authedFetch(`${apiUrl}/labels/batch-print`, {
      method: "POST",
      body: JSON.stringify({ labelIds })
    });
  }

  // SPEC-25: print all labels for a confirmed sale
  async function handlePrintSaleLabels(saleId: string) {
    setLoadingActionId(saleId);
    try {
      const response = await authedFetch(`${apiUrl}/labels/sale/${saleId}/batch`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) return;
      const data = (await response.json()) as { labels: BatchLabelResult[] };
      const labelIds = data.labels.map((l) => l.labelId);
      openBatchPdf(labelIds);
      // print events already registered by sale/batch endpoint
    } finally {
      setLoadingActionId(null);
    }
  }

  // SPEC-25: print labels for selected scraps
  async function handlePrintScrapLabels() {
    if (selectedScrapIds.length === 0) return;
    setLoadingMenu(true);
    try {
      const response = await authedFetch(`${apiUrl}/labels/batch`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          items: selectedScrapIds.map((id) => ({ type: "SCRAP", scrapId: id }))
        })
      });
      if (!response.ok) return;
      const data = (await response.json()) as { labels: Array<{ labelId: string }> };
      const labelIds = data.labels.map((l) => l.labelId);
      openBatchPdf(labelIds);
      await registerBatchPrint(labelIds);
      setSelectedScrapIds([]);
      setScrapStatus(`${labelIds.length} etiqueta(s) enviadas a imprimir.`);
    } finally {
      setLoadingMenu(false);
    }
  }

  // SPEC-25: print selected labels from historial
  async function handlePrintSelectedLabels() {
    if (selectedLabelIds.length === 0) return;
    openBatchPdf(selectedLabelIds);
    await registerBatchPrint(selectedLabelIds);
    setSelectedLabelIds([]);
    setLabelStatus(`${selectedLabelIds.length} etiqueta(s) enviadas a imprimir.`);
  }

  function toggleScrapSelection(id: string) {
    setSelectedScrapIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleLabelSelection(id: string) {
    setSelectedLabelIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleListLabels() {
    setLoadingMenu(true);
    try {
      const response = await authedFetch(`${apiUrl}/labels?branchCode=MAIN`);
      if (!response.ok) return;
      setLabelList((await response.json()) as LabelRow[]);
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleUpdateFlowRules(stage: ScrapRequiredAtStage) {
    setLoadingActionId(stage);
    try {
      const response = await authedFetch(`${apiUrl}/settings/flow-rules`, {
        method: "PUT",
        body: JSON.stringify({ scrapRequiredAtStage: stage })
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSettingsStatus(body.message ?? `Error: HTTP ${response.status}`);
        return;
      }
      setFlowRules({ scrapRequiredAtStage: stage });
      setSettingsStatus(`Regla actualizada: ${stage}`);
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleFetchMatches(saleId: string, line: SaleLineRow) {
    setActiveLine(line);
    setActiveSaleIdForAlloc(saleId);
    setScrapSuggestions([]);
    setSuggestionStatus("Buscando retazos compatibles...");
    const url = `${apiUrl}/scraps/match?branchCode=MAIN&skuCode=${encodeURIComponent(line.skuCode)}&requestedWidthM=${line.requestedWidthM}&requestedHeightM=${line.requestedHeightM}&limit=5`;
    const response = await authedFetch(url);
    if (!response.ok) {
      setSuggestionStatus(`Error buscando: HTTP ${response.status}`);
      return;
    }
    const rows = (await response.json()) as ScrapMatchRow[];
    setScrapSuggestions(rows);
    setSuggestionStatus(rows.length > 0 ? `${rows.length} retazo(s) compatible(s) encontrado(s).` : "Sin retazos compatibles disponibles.");
  }

  async function handleAllocate(scrapId: string) {
    if (!activeLine || !activeSaleIdForAlloc) return;
    setLoadingActionId(scrapId);
    try {
      const response = await authedFetch(
        `${apiUrl}/sales/${activeSaleIdForAlloc}/lines/${activeLine.id}/allocate-scrap`,
        { method: "POST", body: JSON.stringify({ scrapId }) }
      );
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSuggestionStatus(body.message ?? `Error asignando: HTTP ${response.status}`);
        return;
      }
      setSuggestionStatus(`Retazo ${scrapId.slice(0, 8)} asignado a linea.`);
      setScrapSuggestions([]);
      setActiveLine(null);
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleRelease(saleId: string, saleLineId: string) {
    setLoadingActionId(saleLineId);
    try {
      const response = await authedFetch(
        `${apiUrl}/sales/${saleId}/lines/${saleLineId}/allocate-scrap`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error liberando: HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Asignacion liberada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleConfirmSaleById(id: string) {
    setLoadingActionId(id);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${id}/confirm`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Venta confirmada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleCancelSaleById(id: string) {
    setLoadingActionId(id);
    try {
      const response = await authedFetch(`${apiUrl}/sales/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      setSalesStatus("Venta anulada.");
      await handleListSales();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleReprintById(id: string) {
    setLoadingActionId(id);
    try {
      await authedFetch(`${apiUrl}/labels/${id}/reprint`, {
        method: "POST",
        body: JSON.stringify({})
      });
      // Abre el PDF con auto-print (batch-pdf tiene window.print() en onload)
      openBatchPdf([id]);
      setLabelStatus("Impresión registrada.");
      await handleListLabels();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleListQuotes() {
    const response = await authedFetch(`${apiUrl}/pricing/quotes?branchCode=MAIN`);
    const data: QuoteRow[] = await response.json();
    setQuotes(data);
  }

  async function handleCreateSaleDraft() {
    if (!selectedPriceListName) {
      setSalesStatus("Selecciona una lista de precios");
      return;
    }
    if (!customerName.trim()) {
      setSalesStatus("Ingresa el nombre del cliente");
      return;
    }
    setSalesStatus("Creando venta...");
    const response = await authedFetch(`${apiUrl}/sales`, {
      method: "POST",
      body: JSON.stringify({
        branchCode: "MAIN",
        priceListName: selectedPriceListName,
        customerName: customerName,
        customerReference: customerReference || null
      })
    });
    const data = await response.json();
    setSaleId(data.saleId ?? "");
    setSalesStatus(`Venta draft creada: ${data.quoteCode ?? "error"}`);
    setCustomerName("");
    setCustomerReference("");
    await handleListSales();
  }

  async function handleUpdateSaleCustomer() {
    if (!saleId) return;
    setSalesStatus("Actualizando cliente...");
    const response = await authedFetch(`${apiUrl}/sales/${saleId}`, {
      method: "PATCH",
      body: JSON.stringify({
        customerName: customerName || null,
        customerReference: customerReference || null
      })
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setSalesStatus("Cliente actualizado.");
    setCustomerName("");
    setCustomerReference("");
    await handleListSales();
  }

  async function handleUpdatePaymentSummary() {
    if (!saleId) return;
    const amountPaid = Number(amountPaidInput);
    if (isNaN(amountPaid) || amountPaid < 0) {
      setSalesStatus("Monto abonado inválido");
      return;
    }
    try {
      await authedFetch(`${apiUrl}/sales/${saleId}/payment-summary`, {
        method: "PATCH",
        body: JSON.stringify({ amountPaid })
      });
      setSalesStatus("Abono registrado.");
      setAmountPaidInput("");
      await handleListSales();
    } catch (err) {
      setSalesStatus(`Error: ${String(err)}`);
    }
  }

  async function handleAddSaleLine() {
    if (!saleId) { setSalesStatus("Selecciona una venta primero"); return; }
    if (!newLineSkuCode) { setSalesStatus("Selecciona un SKU"); return; }
    const res = await authedFetch(`${apiUrl}/sales/${saleId}/lines`, {
      method: "POST",
      body: JSON.stringify({
        skuCode: newLineSkuCode,
        requestedWidthM: Number(newLineWidth),
        requestedHeightM: Number(newLineHeight),
        quantity: Number(newLineQty)
      })
    });
    if (!res.ok) {
      const body = await res.json() as { message?: string };
      setSalesStatus(body.message ?? `Error HTTP ${res.status}`);
      return;
    }
    setSalesStatus("Línea agregada.");
    setNewLineSkuCode("");
    await handleListSales();
  }

  async function handleListSales() {
    setLoadingMenu(true);
    try {
      const response = await authedFetch(`${apiUrl}/sales?branchCode=MAIN`);
      const data: SaleRow[] = await response.json();
      setSales(data);
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleRegisterScrapFromQuote() {
    if (!quoteResult) return;
    const response = await authedFetch(`${apiUrl}/scraps/register-from-quote`, {
      method: "POST",
      body: JSON.stringify({ quoteId: quoteResult.quoteId })
    });
    const data = await response.json();
    setScrapId(data.id ?? "");
    setScrapStatus(`Retazo creado: ${data.id ?? "error"} (${data.status ?? "?"})`);
    await handleListScraps();
  }

  async function handleListScraps() {
    setLoadingMenu(true);
    try {
      const response = await authedFetch(`${apiUrl}/scraps?branchCode=MAIN`);
      const data: ScrapRow[] = await response.json();
      setScraps(data);
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleCreateQuoteLabel() {
    if (!quoteResult) return;
    const response = await authedFetch(`${apiUrl}/labels/quote/${quoteResult.quoteId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const data = await response.json();
    setLabelId(data.labelId ?? "");
    setLabelStatus(`Etiqueta cotizacion creada: ${data.labelId ?? "error"}`);
  }

  async function handleCreateScrapLabel() {
    if (!scrapId) return;
    const response = await authedFetch(`${apiUrl}/labels/scrap/${scrapId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const body = await response.json();
    if (!response.ok) {
      setLabelStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setLabelId(body.labelId ?? "");
    setLabelStatus(`Etiqueta scrap creada: ${body.labelId ?? "error"}`);
  }

  async function handleReprint() {
    if (!labelId) return;
    await authedFetch(`${apiUrl}/labels/${labelId}/reprint`, {
      method: "POST",
      body: JSON.stringify({})
    });
    setLabelStatus("Reimpresion registrada.");
  }

  return (
    <section className="panel">
      {activeMenu === "dashboard" ? (
        <article className="flow-card">
          <p className="flow-title">Dashboard Operativo</p>
          <div className="inline-actions">
            <Button onClick={loadDashboard} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          </div>

          {loadingMenu && !dashboardKpis ? (
            <div className="kpi-grid">
              {Array.from({ length: 5 }).map((_, i) => (
                <article key={i} className="kpi-card"><span className="skeleton-cell" style={{ width: "80%" }} /><strong><span className="skeleton-cell" style={{ width: "40%" }} /></strong></article>
              ))}
            </div>
          ) : dashboardKpis ? (
            <div className="kpi-grid">
              <article className="kpi-card"><span>Cotizaciones Hoy</span><strong>{dashboardKpis.quotesCreatedToday}</strong></article>
              <article className="kpi-card"><span>Ventas Confirmadas</span><strong>{dashboardKpis.salesConfirmedToday}</strong></article>
              <article className="kpi-card"><span>Ventas Anuladas</span><strong>{dashboardKpis.salesCanceledToday}</strong></article>
              <article className="kpi-card"><span>Retazos Pendientes</span><strong>{dashboardKpis.pendingScraps}</strong></article>
              <article className="kpi-card"><span>Etiquetas Hoy</span><strong>{dashboardKpis.labelsPrintedToday}</strong></article>
            </div>
          ) : null}

          <p className="flow-title">Retazos pendientes</p>
          {pendingScraps.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>ID</th><th>SKU</th><th>Area</th><th>Creado</th></tr></thead>
              <tbody>
                {pendingScraps.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id.slice(0, 8)}</td>
                    <td>{row.skuCode}</td>
                    <td>{row.areaM2}</td>
                    <td>{formatLocalDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="status-note">Sin retazos pendientes.</p>
          )}

          <p className="flow-title">Actividad reciente</p>
          {auditEvents.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Entidad</th><th>Accion</th><th>Usuario</th><th>Hora</th></tr></thead>
              <tbody>
                {auditEvents.map((row) => (
                  <tr key={row.id}>
                    <td>{ENTITY_TYPE_LABELS[row.entityType] ?? row.entityType}: {row.entityId.slice(0, 8).toUpperCase()}</td>
                    <td>{AUDIT_ACTION_LABELS[row.action] ?? row.action}</td>
                    <td>{row.actor.email}</td>
                    <td>{formatLocalDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="status-note">Sin actividad reciente.</p>
          )}

          <p className="flow-title">Acciones rapidas</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => onNavigate("pricing")}>
              Nueva Cotizacion
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("sales")}>
              Nueva Venta Draft
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("cuts")}>
              Ir a Cortes
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("scraps")}>
              Crear/Asignar Ubicacion
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("labels")}>
              Reimprimir Etiqueta
            </Button>
          </div>
        </article>
      ) : null}

      {activeMenu === "pricing" ? (
        <article className="flow-card">
          <p className="flow-title">Cotizacion</p>
          {/* SPEC-32: Dynamic selectors */}
          {loadingSelectors ? (
            <div><Spinner /> Cargando opciones...</div>
          ) : (
            <>
              <label className="field">
                <span>Lista de precios</span>
                <Select
                  value={selectedPriceListName}
                  onChange={(e) => setSelectedPriceListName(e.target.value)}
                >
                  <option value="">-- Selecciona lista --</option>
                  {priceListOptions.map((pl) => (
                    <option key={pl.name} value={pl.name}>
                      {pl.name}
                    </option>
                  ))}
                </Select>
              </label>
            </>
          )}

          {/* SPEC-32/34: Multi-item table */}
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Ítems de cotización</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button variant="secondary" onClick={addQuoteItem}>
                  + Agregar ítem
                </Button>
                {/* SPEC-34: Calcular todo */}
                <Button
                  variant="primary"
                  onClick={() => void handleCalculateAll()}
                  disabled={loadingBatch || !selectedPriceListName}
                  title="Calcula todos los ítems en una sola operación"
                >
                  {loadingBatch ? <Spinner size="sm" /> : "Calcular todo"}
                </Button>
                {/* SPEC-37: Guardar en historial sin crear draft */}
                <Button
                  variant="secondary"
                  onClick={() => void handleSaveToHistory()}
                  disabled={loadingBatch || !selectedPriceListName || quoteItems.some((it) => it.calcStatus !== "ok") || quoteItems.every((it) => !it.calcStatus)}
                  title="Guarda la cotización en el historial sin crear venta"
                >
                  Guardar cotización
                </Button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>SKU</th>
                    <th>Ancho (m)</th>
                    <th>Alto (m)</th>
                    <th>Cantidad</th>
                    <th>Categoria</th>
                    <th>Nota</th>
                    <th>Precio unit.</th>
                    <th>Subtotal</th>
                    <th>Método</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <button
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: "0.75em" }}
                            onClick={() => moveItemUp(item.id)}
                            disabled={idx === 0}
                            title="Subir"
                          >
                            ▲
                          </button>
                          <span style={{ textAlign: "center", fontSize: "0.8em" }}>{idx + 1}</span>
                          <button
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: "0.75em" }}
                            onClick={() => moveItemDown(item.id)}
                            disabled={idx === quoteItems.length - 1}
                            title="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      {/* SPEC-34: per-item SKU selector */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                          <Select
                            style={{ width: "130px", fontSize: "0.8em" }}
                            value={item.skuCode ?? ""}
                            onChange={(e) => updateQuoteItem(item.id, { skuCode: e.target.value, calcStatus: undefined })}
                          >
                            <option value="">-- SKU --</option>
                            {skuOptions.map((sku) => (
                              <option key={sku.code} value={sku.code}>
                                {sku.code}
                              </option>
                            ))}
                          </Select>
                          {/* calc status badge */}
                          {item.calcStatus === "ok" && (
                            <span style={{ fontSize: "0.7em", color: "var(--ok)", fontWeight: 600 }}>✓ OK</span>
                          )}
                          {item.calcStatus === "error" && (
                            <span style={{ fontSize: "0.7em", color: "var(--error)", fontWeight: 600 }} title={item.calcError}>✗ Error</span>
                          )}
                          {item.calcStatus === "pending" && (
                            <span style={{ fontSize: "0.7em", color: "var(--muted)" }}>...</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.widthM}
                          onChange={(e) => updateQuoteItem(item.id, { widthM: e.target.value })}
                          step="0.1"
                          min="0"
                          style={{ width: "80px" }}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.heightM}
                          onChange={(e) => updateQuoteItem(item.id, { heightM: e.target.value })}
                          step="0.1"
                          min="0"
                          style={{ width: "80px" }}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuoteItem(item.id, { quantity: e.target.value })}
                          min="1"
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td>
                        {/* SPEC-33: category selector + new inline */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <Select
                            style={{ width: "120px", fontSize: "0.8em" }}
                            value={item.categoryId || ""}
                            onChange={(e) => {
                              const cat = categories.find((c) => c.id === e.target.value);
                              updateQuoteItem(item.id, {
                                categoryId: e.target.value || undefined,
                                categoryName: cat?.name ?? undefined
                              });
                            }}
                          >
                            <option value="">Sin categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                            <option value="__new__">+ Nueva...</option>
                          </Select>
                          {item.categoryId === "__new__" || (item.categoryId === "" && item.categoryName === "__new__") ? null : null}
                          {/* Inline creation when "__new__" selected */}
                          {item.categoryId === "__new__" && (
                            <div style={{ display: "flex", gap: "2px" }}>
                              <Input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nombre"
                                style={{ width: "80px", fontSize: "0.8em" }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    void handleCreateCategoryForItem(item.id, newCategoryName);
                                  }
                                }}
                              />
                              <button
                                style={{ background: "none", border: "1px solid var(--gray-300)", borderRadius: "4px", cursor: "pointer", padding: "0 4px", fontSize: "0.75em" }}
                                onClick={() => void handleCreateCategoryForItem(item.id, newCategoryName)}
                              >
                                OK
                              </button>
                              <button
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: "0.75em" }}
                                onClick={() => { updateQuoteItem(item.id, { categoryId: undefined, categoryName: undefined }); setNewCategoryName(""); }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <Input
                          type="text"
                          value={item.lineNote || ""}
                          onChange={(e) => updateQuoteItem(item.id, { lineNote: e.target.value })}
                          placeholder="Nota..."
                          style={{ width: "100px", fontSize: "0.8em" }}
                        />
                      </td>
                      <td>{item.unitPrice ? `$${item.unitPrice.toLocaleString()}` : "—"}</td>
                      <td>{item.subtotal ? `$${item.subtotal.toLocaleString()}` : "—"}</td>
                      <td style={{ fontSize: "0.8em" }}>{item.priceMethod || "—"}</td>
                      <td className="actions-cell" style={{ whiteSpace: "nowrap" }}>
                        <Button
                          variant="secondary"
                          onClick={() => handleCalculateItem(item.id)}
                          disabled={loadingActionId === item.id}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8em" }}
                        >
                          {loadingActionId === item.id ? <Spinner size="sm" /> : "Calc"}
                        </Button>
                        {quoteItems.length > 1 && (
                          <Button
                            variant="secondary"
                            onClick={() => removeQuoteItem(item.id)}
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8em" }}
                          >
                            Quit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total with operator margin */}
          {(() => {
            const hasCalcErrors = quoteItems.some((it) => it.calcStatus === "error");
            const subtotalLines = quoteItems.reduce((sum, it) => sum + (it.subtotal || 0), 0);
            const totalBefore = subtotalLines * (1 - operatorMargin / 100);  // aplica margen
            const tax = Math.round(totalBefore * 0.19);
            const totalAfterMargin = roundClpFront(totalBefore + tax);  // BUG-1: total con IVA
            return (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    {hasCalcErrors ? (
                      <p className="status-note" style={{ color: "var(--error)" }}>
                        ⚠ Total bloqueado — corrige los ítems con error
                      </p>
                    ) : (
                      <TotalsBlock
                        subtotal={totalBefore}
                        tax={tax}
                        total={totalAfterMargin}
                        marginActive={operatorMargin > 0}
                      />
                    )}
                  </div>
                  {/* SPEC-32: Operator margin field */}
                  <div style={{ width: "200px" }}>
                    <label className="field">
                      <span>Margen operador (%)</span>
                      <Input
                        type="number"
                        value={operatorMargin}
                        onChange={(e) => setOperatorMargin(Math.max(0, Math.min(100, Number(e.target.value))))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <small style={{ color: "var(--muted)" }}>* No se guarda en BD</small>
                    </label>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SPEC-35: Customer fields + Create Draft button */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="field" style={{ flex: 1, minWidth: "180px" }}>
              <span>Cliente</span>
              <Input
                value={quoteCustomerName}
                onChange={(e) => setQuoteCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </label>
            <label className="field" style={{ flex: 1, minWidth: "180px" }}>
              <span>Referencia</span>
              <Input
                value={quoteCustomerReference}
                onChange={(e) => setQuoteCustomerReference(e.target.value)}
                placeholder="Obra / referencia"
              />
            </label>
            <Button
              variant="secondary"
              onClick={() => void handlePreview("CUSTOMER")}
              disabled={
                loadingPreview ||
                !selectedPriceListName ||
                quoteItems.some((it) => it.calcStatus !== "ok") ||
                quoteItems.every((it) => !it.calcStatus)
              }
              title="Vista previa para el cliente"
            >
              {loadingPreview ? <Spinner size="sm" /> : "Vista previa"}
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateDraftFromQuote()}
              disabled={
                loadingCreateDraft ||
                !selectedPriceListName ||
                quoteItems.some((it) => it.calcStatus !== "ok") ||
                quoteItems.every((it) => !it.calcStatus)
              }
              title="Crea venta draft con todos los ítems calculados"
            >
              {loadingCreateDraft ? <Spinner size="sm" /> : "Crear Draft"}
            </Button>
          </div>

          <p className="status-note">{status}</p>
          {quotes.length > 0 ? (
            <table className="data-table"><thead><tr><th>ID</th><th>Medida</th><th>Cant.</th><th>Total</th><th>Fecha</th></tr></thead><tbody>
              {quotes.map((row) => (
                <tr key={row.id}><td>{row.id.slice(0, 8)}</td><td>{row.requestedWidthM} x {row.requestedHeightM}</td><td>{row.quantity}</td><td>{row.totalRounded} {row.currencyCode}</td><td>{formatLocalDateTime(row.createdAt)}</td></tr>
              ))}
            </tbody></table>
          ) : null}
        </article>
      ) : null}

      {activeMenu === "sales" ? (
        <article className="flow-card">
          <p className="flow-title">Ventas y Corte</p>
          <p className="status-note">{salesStatus}</p>
          <p className="status-note">SaleId activo: {saleId ? saleId.slice(0, 8) : "ninguno — click en una fila para seleccionar"}</p>
          <div className="form-row" style={{ marginBottom: "0.5rem" }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label style={{ fontSize: "0.85em" }}>Cliente</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label style={{ fontSize: "0.85em" }}>Referencia</label>
              <Input
                value={customerReference}
                onChange={(e) => setCustomerReference(e.target.value)}
                placeholder="Referencia (opcional)"
              />
            </div>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={handleCreateSaleDraft} disabled={loadingMenu}>Crear Draft</Button>
            <Button variant="secondary" onClick={handleUpdateSaleCustomer} disabled={!saleId || loadingMenu}>Actualizar Cliente</Button>
            <Button variant="secondary" onClick={handleListSales} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          </div>
          {/* BUG-3: form para agregar línea a venta seleccionada */}
          {saleId && (
            <div className="form-row" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
              <div className="form-field" style={{ minWidth: "150px", flex: 2 }}>
                <label style={{ fontSize: "0.85em" }}>SKU</label>
                <Select value={newLineSkuCode} onChange={(e) => setNewLineSkuCode(e.target.value)}>
                  <option value="">— Seleccionar SKU —</option>
                  {skuOptions.map((s) => (
                    <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="form-field" style={{ width: "80px" }}>
                <label style={{ fontSize: "0.85em" }}>Ancho (m)</label>
                <Input value={newLineWidth} onChange={(e) => setNewLineWidth(e.target.value)} />
              </div>
              <div className="form-field" style={{ width: "80px" }}>
                <label style={{ fontSize: "0.85em" }}>Alto (m)</label>
                <Input value={newLineHeight} onChange={(e) => setNewLineHeight(e.target.value)} />
              </div>
              <div className="form-field" style={{ width: "60px" }}>
                <label style={{ fontSize: "0.85em" }}>Cant.</label>
                <Input value={newLineQty} onChange={(e) => setNewLineQty(e.target.value)} />
              </div>
              <Button variant="secondary" onClick={() => void handleAddSaleLine()} disabled={loadingMenu}>
                + Agregar línea
              </Button>
            </div>
          )}
          {loadingMenu && sales.length === 0 ? (
            <TableSkeleton rows={4} cols={6} />
          ) : sales.length > 0 ? (
            <>
              <table className="data-table">
                <thead>
                  <tr><th>COT</th><th>Cliente</th><th>Estado</th><th>Lineas</th><th>Total</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {sales.map((row) => (
                    <tr
                      key={row.id}
                      style={{ cursor: "pointer", background: row.id === highlightedSaleId ? "var(--ok-bg, #d4edda)" : undefined }}
                      onClick={() => { setSaleId(row.id); setHighlightedSaleId(null); }}
                    >
                      <td>{row.quoteCode ?? "—"}{row.id === saleId ? " ◀" : ""}</td>
                      <td>{row.customerName ?? "—"}</td>
                      <td>{getStatusLabel(statusLabels, "sale", row.status)}</td>
                      <td>{row.lines.length}</td>
                      <td>{row.totalAmount}</td>
                      <td>
                        {row.status === "DRAFT" ? (
                          <div className="inline-actions" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="secondary"
                              onClick={() => void handleConfirmSaleById(row.id)}
                              disabled={loadingActionId === row.id}
                            >
                              {loadingActionId === row.id ? <Spinner size="sm" /> : "Confirmar"}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => void handleCancelSaleById(row.id)}
                              disabled={loadingActionId === row.id}
                            >
                              {loadingActionId === row.id ? <Spinner size="sm" /> : "Anular"}
                            </Button>
                          </div>
                        ) : row.status === "CONFIRMED" ? (
                          <div className="inline-actions" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="secondary"
                              onClick={() => void handlePrintSaleLabels(row.id)}
                              disabled={loadingActionId === row.id}
                              title="Imprimir etiquetas de todos los cortes"
                            >
                              {loadingActionId === row.id ? <Spinner size="sm" /> : "🖨️ Etiquetas"}
                            </Button>
                          </div>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{row.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {saleId && (() => {
                const selectedSale = sales.find((s) => s.id === saleId);
                if (!selectedSale || selectedSale.lines.length === 0) return null;
                return (
                  <div style={{ marginTop: "1rem" }}>
                    <p className="flow-title">Lineas de venta {saleId.slice(0, 8)}</p>
                    <table className="data-table">
                      <thead>
                        <tr><th>#</th><th>Categoria</th><th>SKU</th><th>Medida</th><th>Cant.</th><th>Nota</th><th>Retazo asignado</th><th>Accion</th></tr>
                      </thead>
                      <tbody>
                        {selectedSale.lines.map((line, li) => (
                          <tr key={line.id}>
                            <td>{li + 1}</td>
                            <td>{line.categoryName ?? "—"}</td>
                            <td>{line.skuCode}</td>
                            <td>{line.requestedWidthM} x {line.requestedHeightM}</td>
                            <td>{line.quantity}</td>
                            <td style={{ fontSize: "0.8em", color: "var(--muted)" }}>{line.lineNote ?? "—"}</td>
                            <td>{line.allocatedScrapId ? `✓ ${line.allocatedScrapId.slice(0, 8)}` : "—"}</td>
                            <td>
                              {selectedSale.status === "DRAFT" && !line.allocatedScrapId ? (
                                <Button variant="secondary" onClick={() => void handleFetchMatches(saleId, line)} disabled={!!loadingActionId}>
                                  Buscar Retazo
                                </Button>
                              ) : null}
                              {selectedSale.status === "DRAFT" && line.allocatedScrapId ? (
                                <Button
                                  variant="secondary"
                                  onClick={() => void handleRelease(saleId, line.id)}
                                  disabled={loadingActionId === line.id}
                                >
                                  {loadingActionId === line.id ? <Spinner size="sm" /> : "Liberar"}
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* SPEC-36: Totals + payment block */}
                    <div style={{ marginTop: "1rem", display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <TotalsBlock
                        subtotal={selectedSale.subtotalAmount}
                        tax={selectedSale.taxAmount}
                        total={selectedSale.totalAmount}
                        amountPaid={selectedSale.amountPaid}
                        balanceDue={selectedSale.balanceDue}
                      />
                      {selectedSale.status === "DRAFT" && (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                          <label className="field" style={{ margin: 0 }}>
                            <span>Registrar abono</span>
                            <Input
                              type="number"
                              value={amountPaidInput}
                              onChange={(e) => setAmountPaidInput(e.target.value)}
                              placeholder="0"
                              min="0"
                              style={{ width: "140px" }}
                            />
                          </label>
                          <Button variant="secondary" onClick={() => void handleUpdatePaymentSummary()}>
                            Guardar
                          </Button>
                        </div>
                      )}
                    </div>

                    {activeLine && activeLine.id && sales.find((s) => s.id === activeSaleIdForAlloc)?.lines.some((l) => l.id === activeLine.id) ? (
                      <div style={{ marginTop: "0.75rem" }}>
                        <p className="status-note">{suggestionStatus}</p>
                        {scrapSuggestions.length > 0 ? (
                          <table className="data-table">
                            <thead>
                              <tr><th>Retazo</th><th>Medida</th><th>Excedente m²</th><th>Posicion</th><th>Asignar</th></tr>
                            </thead>
                            <tbody>
                              {scrapSuggestions.map((s) => (
                                <tr key={s.id}>
                                  <td>{s.id.slice(0, 8)}</td>
                                  <td>{s.widthM} x {s.heightM}</td>
                                  <td>{s.excessAreaM2}</td>
                                  <td>{s.locationCode ?? "—"}</td>
                                  <td>
                                    <Button
                                      variant="secondary"
                                      onClick={() => void handleAllocate(s.id)}
                                      disabled={loadingActionId === s.id}
                                    >
                                      {loadingActionId === s.id ? <Spinner size="sm" /> : "Asignar"}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </>
          ) : (
            <p className="status-note">Sin ventas. Usa "Crear Draft" para comenzar.</p>
          )}
        </article>
      ) : null}

      {activeMenu === "cuts" ? (
        <article className="flow-card">
          <p className="flow-title">Cortes (Cut Jobs)</p>
          <p className="status-note">{cutsStatus}</p>
          {flowRules ? (
            <p className="status-note">
              Regla activa: <strong>{flowRules.scrapRequiredAtStage}</strong>
              {flowRules.scrapRequiredAtStage === "AT_CUT" ? " — se pedira ubicacion al marcar cortado" : ""}
            </p>
          ) : null}
          <div className="inline-actions">
            <Button variant={cutFilterStatus === "PENDING" ? "primary" : "secondary"} onClick={() => setCutFilterStatus("PENDING")}>
              Pendientes
            </Button>
            <Button variant={cutFilterStatus === "IN_PROGRESS" ? "primary" : "secondary"} onClick={() => setCutFilterStatus("IN_PROGRESS")}>
              En Progreso
            </Button>
            <Button variant={cutFilterStatus === "CUT" ? "primary" : "secondary"} onClick={() => setCutFilterStatus("CUT")}>
              Cortados
            </Button>
            <Button variant={cutFilterStatus === "DELIVERED" ? "primary" : "secondary"} onClick={() => setCutFilterStatus("DELIVERED")}>
              Entregados
            </Button>
            <Button variant={cutFilterStatus === "ALL" ? "primary" : "secondary"} onClick={() => setCutFilterStatus("ALL")}>
              Todos
            </Button>
            <Button onClick={loadCutJobs} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          </div>
          {loadingMenu && cutJobs.length === 0 ? (
            <TableSkeleton rows={5} cols={8} />
          ) : cutJobs.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Venta</th><th>SKU</th><th>Medida</th><th>Cant.</th><th>Estado</th><th>Cortado</th><th>Accion</th></tr>
              </thead>
              <tbody>
                {cutJobs.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id.slice(0, 8)}</td>
                    <td>{row.saleId.slice(0, 8)}</td>
                    <td>{row.skuCode}</td>
                    <td>{row.requestedWidthM} x {row.requestedHeightM}</td>
                    <td>{row.quantity}</td>
                    <td>{getStatusLabel(statusLabels, "cut_job", row.status)}</td>
                    <td>{row.cutAt ? formatLocalDateTime(row.cutAt) : "-"}</td>
                    <td>
                      {row.status === "PENDING" || row.status === "IN_PROGRESS" ? (
                        <Button
                          variant="secondary"
                          onClick={() => void onMarkCutClick(row.id)}
                          disabled={loadingActionId === row.id}
                        >
                          {loadingActionId === row.id ? <Spinner size="sm" /> : "Marcar Cortado"}
                        </Button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="status-note">Sin cortes para el filtro seleccionado.</p>
          )}
        </article>
      ) : null}

      {activeMenu === "scraps" ? (
        <article className="flow-card">
          <p className="flow-title">Retazos y Ubicaciones</p>
          <p className="status-note">{scrapStatus}</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={handleRegisterScrapFromQuote} disabled={!quoteResult}>
              Crear Retazo desde Cotizacion
            </Button>
            <Button variant="secondary" onClick={handleListScraps} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
            {/* SPEC-25: bulk print selected scraps */}
            <Button
              variant="primary"
              onClick={() => void handlePrintScrapLabels()}
              disabled={selectedScrapIds.length === 0 || loadingMenu}
            >
              {loadingMenu ? <Spinner size="sm" /> : `🖨️ Imprimir seleccionados (${selectedScrapIds.length})`}
            </Button>
          </div>
          {loadingMenu && scraps.length === 0 ? (
            <TableSkeleton rows={4} cols={8} />
          ) : scraps.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      title="Seleccionar todos los STORED"
                      checked={scraps.filter((s) => s.status === "STORED").length > 0 && scraps.filter((s) => s.status === "STORED").every((s) => selectedScrapIds.includes(s.id))}
                      onChange={(e) => {
                        const storedIds = scraps.filter((s) => s.status === "STORED").map((s) => s.id);
                        setSelectedScrapIds(e.target.checked ? storedIds : []);
                      }}
                    />
                  </th>
                  <th>ID</th><th>Estado</th><th>Area m²</th><th>Medida</th><th>SKU</th><th>Ubicacion</th><th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {scraps.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.status === "STORED" && (
                        <input
                          type="checkbox"
                          checked={selectedScrapIds.includes(row.id)}
                          onChange={() => toggleScrapSelection(row.id)}
                        />
                      )}
                    </td>
                    <td>{row.id.slice(0, 8)}</td>
                    <td>{getStatusLabel(statusLabels, "scrap", row.status)}</td>
                    <td>{row.areaM2}</td>
                    <td>{row.widthM} x {row.heightM}</td>
                    <td>{row.skuCode}</td>
                    <td>{row.locationCode ?? "—"}</td>
                    <td>
                      {row.status === "PENDING_STORAGE" ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setActiveModal({ type: "assign-scrap-location", scrapId: row.id });
                            setModalLocationCode("");
                            setModalStatus("");
                          }}
                        >
                          Asignar Ubicacion
                        </Button>
                      ) : row.status === "STORED" ? (
                        <span style={{ color: "var(--ok)", fontSize: "0.78rem" }}>✓ {row.locationCode}</span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{row.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="status-note">Sin retazos para mostrar.</p>
          )}

          <p className="flow-title" style={{ marginTop: "0.5rem" }}>Etiqueta de retazo</p>
          <p className="status-note">ScrapId actual: {scrapId ? scrapId.slice(0, 8) : "—"}</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={handleCreateScrapLabel} disabled={!scrapId}>
              Crear Etiqueta Scrap
            </Button>
          </div>
        </article>
      ) : null}

      {activeMenu === "labels" ? (
        <article className="flow-card">
          <p className="flow-title">Etiquetas</p>
          <p className="status-note">{labelStatus}</p>

          <p className="flow-title">Lote por venta</p>
          <label className="field">
            <span>Sale ID</span>
            <Input
              value={batchSaleId}
              onChange={(e) => setBatchSaleId(e.target.value)}
              placeholder="UUID de la venta"
            />
          </label>
          <div className="inline-actions">
            <Button onClick={() => void handleBatchLabels()} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Emitir todas las etiquetas"}
            </Button>
          </div>
          {batchResults.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Label ID</th><th>SKU</th><th>Linea</th><th>Imprimir</th></tr>
              </thead>
              <tbody>
                {batchResults.map((r) => (
                  <tr key={r.labelId}>
                    <td>{r.labelId.slice(0, 8)}</td>
                    <td>{r.skuCode}</td>
                    <td>{r.saleLineId.slice(0, 8)}</td>
                    <td>
                      <a
                        className="link-btn"
                        href={`${apiUrl}/labels/${r.labelId}/pdf?accessToken=${encodeURIComponent(accessToken)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver/Imprimir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <p className="flow-title" style={{ marginTop: "1.5rem" }}>Etiqueta individual (cotizacion/retazo)</p>
          <p className="status-note">LabelId actual: {labelId || "-"}</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={handleCreateQuoteLabel} disabled={!quoteResult}>Etiqueta Cotizacion</Button>
            <Button variant="secondary" onClick={handleCreateScrapLabel} disabled={!scrapId}>Label Scrap</Button>
            <Button variant="secondary" onClick={handleReprint} disabled={!labelId}>Reprint</Button>
            {labelId ? (
              <a
                className="link-btn"
                href={`${apiUrl}/labels/${labelId}/pdf?accessToken=${encodeURIComponent(accessToken)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver PDF
              </a>
            ) : null}
          </div>

          <p className="flow-title" style={{ marginTop: "1.5rem" }}>Historial de etiquetas</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => void handleListLabels()} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
            {/* SPEC-25: print selected labels */}
            <Button
              variant="primary"
              onClick={() => void handlePrintSelectedLabels()}
              disabled={selectedLabelIds.length === 0}
            >
              {`🖨️ Imprimir seleccionadas (${selectedLabelIds.length})`}
            </Button>
          </div>
          {loadingMenu && labelList.length === 0 ? (
            <TableSkeleton rows={4} cols={7} />
          ) : labelList.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      title="Seleccionar todas"
                      checked={labelList.length > 0 && labelList.every((l) => selectedLabelIds.includes(l.id))}
                      onChange={(e) => setSelectedLabelIds(e.target.checked ? labelList.map((l) => l.id) : [])}
                    />
                  </th>
                  <th>ID</th><th>Tipo</th><th>Linea/Retazo/Cotiz.</th><th>Creado</th><th>Ultimo print</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {labelList.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLabelIds.includes(l.id)}
                        onChange={() => toggleLabelSelection(l.id)}
                      />
                    </td>
                    <td>{l.id.slice(0, 8)}</td>
                    <td>{l.type}</td>
                    <td>{(l.saleLineId ?? l.scrapId ?? l.quoteId ?? "—")?.slice(0, 8)}</td>
                    <td>{formatLocalDateTime(l.createdAt)}</td>
                    <td>{l.lastPrintedAt ? formatLocalDateTime(l.lastPrintedAt) : "—"}</td>
                    <td>
                      <div className="inline-actions">
                        <Button
                          variant="secondary"
                          onClick={() => setLabelPreview({ id: l.id, url: `${apiUrl}/labels/${l.id}/pdf?accessToken=${encodeURIComponent(accessToken)}` })}
                          title="Ver la etiqueta antes de imprimir"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.82em" }}
                        >
                          Vista previa
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => void handleReprintById(l.id)}
                          disabled={loadingActionId === l.id}
                          title="Registra reimpresión y abre el diálogo de impresión"
                        >
                          {loadingActionId === l.id ? <Spinner size="sm" /> : "Imprimir"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="status-note">Sin etiquetas registradas.</p>
          )}
        </article>
      ) : null}

      {activeMenu === "settings" ? (
        <article className="flow-card">
          <p className="flow-title">Configuracion de Flujo</p>
          <p className="status-note">{settingsStatus}</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={loadFlowRules} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          </div>
          {flowRules ? (
            <>
              <p className="status-note">
                Regla activa: <strong>{flowRules.scrapRequiredAtStage}</strong>
              </p>
              <p className="flow-title">Cambiar regla de retazo obligatorio</p>
              <div className="inline-actions">
                <Button
                  variant={flowRules.scrapRequiredAtStage === "NONE" ? "primary" : "secondary"}
                  onClick={() => void handleUpdateFlowRules("NONE")}
                  disabled={!!loadingActionId}
                >
                  {loadingActionId === "NONE" ? <Spinner size="sm" /> : "NONE (sin enforcement)"}
                </Button>
                <Button
                  variant={flowRules.scrapRequiredAtStage === "AT_CUT" ? "primary" : "secondary"}
                  onClick={() => void handleUpdateFlowRules("AT_CUT")}
                  disabled={!!loadingActionId}
                >
                  {loadingActionId === "AT_CUT" ? <Spinner size="sm" /> : "AT_CUT (requiere ubicacion al cortar)"}
                </Button>
                <Button
                  variant={flowRules.scrapRequiredAtStage === "AT_SALE_CLOSE" ? "primary" : "secondary"}
                  onClick={() => void handleUpdateFlowRules("AT_SALE_CLOSE")}
                  disabled={!!loadingActionId}
                >
                  {loadingActionId === "AT_SALE_CLOSE" ? <Spinner size="sm" /> : "AT_SALE_CLOSE (requiere retazos resueltos al confirmar)"}
                </Button>
              </div>
              <p className="status-note" style={{ marginTop: "1rem", fontSize: "0.85em", opacity: 0.7 }}>
                NONE: sin bloqueos. AT_CUT: al marcar corte con retazo util, se debe proveer ubicacion (locationCode). AT_SALE_CLOSE: al confirmar venta, no puede haber retazos en estado PENDING_STORAGE de esa venta.
              </p>
            </>
          ) : (
            <p className="status-note">Cargando configuracion...</p>
          )}
        </article>
      ) : null}

      {activeMenu === "audit" ? (
        <article className="flow-card">
          <p className="flow-title">Auditoria</p>
          <div className="inline-actions">
            <Button onClick={loadAudit} disabled={loadingMenu}>
              {loadingMenu ? <Spinner size="sm" /> : "Refrescar"}
            </Button>
          </div>
          {loadingMenu && auditEvents.length === 0 ? (
            <TableSkeleton rows={6} cols={4} />
          ) : auditEvents.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Entidad</th><th>Accion</th><th>Actor</th><th>Fecha</th></tr></thead>
              <tbody>
                {auditEvents.map((row) => (
                  <tr key={row.id}>
                    <td>{ENTITY_TYPE_LABELS[row.entityType] ?? row.entityType}: {row.entityId.slice(0, 8).toUpperCase()}</td>
                    <td>{AUDIT_ACTION_LABELS[row.action] ?? row.action}</td>
                    <td>{row.actor.email}</td>
                    <td>{formatLocalDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="status-note">Sin eventos para mostrar.</p>
          )}
        </article>
      ) : null}

      {/* Dialog: pedir ubicacion ANTES del corte (AT_CUT) */}
      <Dialog
        open={activeModal?.type === "pre-cut-location"}
        onClose={() => setActiveModal(null)}
        title="Ubicacion del retazo (requerida)"
      >
        <p className="status-note">
          La regla AT_CUT requiere indicar donde se almacenara el retazo antes de registrar el corte.
        </p>
        <label className="field">
          <span>Codigo de posicion</span>
          <Input
            value={modalLocationCode}
            onChange={(e) => setModalLocationCode(e.target.value)}
            placeholder="ej. A-01"
          />
        </label>
        {modalStatus ? <p className="status-note" style={{ color: "var(--danger)" }}>{modalStatus}</p> : null}
        <div className="inline-actions">
          <Button
            onClick={() => void handleModalMarkCut()}
            disabled={!modalLocationCode || loadingModal}
          >
            {loadingModal ? <Spinner size="sm" /> : "Confirmar y marcar cortado"}
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal(null)} disabled={loadingModal}>Cancelar</Button>
        </div>
      </Dialog>

      {/* Dialog: asignar ubicacion DESPUES del corte (retazo PENDING_STORAGE) */}
      <Dialog
        open={activeModal?.type === "post-cut-location"}
        onClose={() => setActiveModal(null)}
        title="Asignar ubicacion al retazo"
      >
        <p className="status-note">
          El retazo generado quedo pendiente de almacenamiento. Indica donde lo vas a guardar.
        </p>
        <label className="field">
          <span>Codigo de posicion</span>
          <Input
            value={modalLocationCode}
            onChange={(e) => setModalLocationCode(e.target.value)}
            placeholder="ej. A-01"
          />
        </label>
        {modalStatus ? <p className="status-note" style={{ color: "var(--danger)" }}>{modalStatus}</p> : null}
        <div className="inline-actions">
          <Button
            onClick={() => void handleModalAssignLocation()}
            disabled={!modalLocationCode || loadingModal}
          >
            {loadingModal ? <Spinner size="sm" /> : "Asignar ubicacion"}
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal(null)} disabled={loadingModal}>Omitir por ahora</Button>
        </div>
      </Dialog>

      {/* Dialog: asignar ubicacion desde tabla de retazos */}
      <Dialog
        open={activeModal?.type === "assign-scrap-location"}
        onClose={() => setActiveModal(null)}
        title="Asignar ubicacion al retazo"
      >
        <p className="status-note">
          Indica el codigo de posicion donde se almacenara este retazo.
        </p>
        <label className="field">
          <span>Codigo de posicion</span>
          <Input
            value={modalLocationCode}
            onChange={(e) => setModalLocationCode(e.target.value)}
            placeholder="ej. A-01"
          />
        </label>
        {modalStatus ? <p className="status-note" style={{ color: "var(--danger)" }}>{modalStatus}</p> : null}
        <div className="inline-actions">
          <Button
            onClick={() => void handleModalAssignLocation()}
            disabled={!modalLocationCode || loadingModal}
          >
            {loadingModal ? <Spinner size="sm" /> : "Asignar ubicacion"}
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal(null)} disabled={loadingModal}>Cancelar</Button>
        </div>
      </Dialog>

      {/* BUG-6: Label preview modal */}
      <Dialog open={!!labelPreview} onClose={() => setLabelPreview(null)} title="Vista previa de etiqueta">
        {labelPreview && (
          <>
            <iframe
              src={labelPreview.url}
              style={{ width: "100%", height: "520px", border: "none", display: "block" }}
              title="Vista previa etiqueta"
            />
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <Button
                variant="primary"
                onClick={() => { void handleReprintById(labelPreview.id); setLabelPreview(null); }}
                disabled={loadingActionId === labelPreview.id}
              >
                {loadingActionId === labelPreview.id ? <Spinner size="sm" /> : "Imprimir"}
              </Button>
              <Button variant="secondary" onClick={() => setLabelPreview(null)}>Cerrar</Button>
            </div>
          </>
        )}
      </Dialog>

      {/* SPEC-38: Preview dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title="Vista previa de cotización">
        <div className="dialog-header">
          <span className="dialog-title">Vista previa — {previewMode === "CUSTOMER" ? "Cliente" : "Interna"}</span>
          <button className="dialog-close" onClick={() => setPreviewOpen(false)}>✕</button>
        </div>
        <div className="dialog-body">
          {previewData && (
            <div id="quote-preview-printable" style={{ fontFamily: "sans-serif", fontSize: "0.9em", lineHeight: "1.6" }}>
              {/* Header */}
              <div style={{ marginBottom: "1rem", borderBottom: "2px solid #333", paddingBottom: "0.5rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1.1em" }}>{previewData.header.branchName}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.85em" }}>
                  {new Date(previewData.header.date).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
                  {" · "}Lista: {previewData.header.priceListName}
                </div>
              </div>

              {/* Customer */}
              {(previewData.customer.name || previewData.customer.reference) && (
                <div style={{ marginBottom: "0.75rem", fontSize: "0.88em" }}>
                  {previewData.customer.name && <div>Cliente: <strong>{previewData.customer.name}</strong></div>}
                  {previewData.customer.reference && <div>Referencia: <strong>{previewData.customer.reference}</strong></div>}
                </div>
              )}

              {/* Lines */}
              <table className="data-table" style={{ fontSize: "0.85em", marginBottom: "0.75rem" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Descripción</th>
                    {previewMode === "INTERNAL" && <th>SKU</th>}
                    <th>Medida (m)</th>
                    <th>Cant.</th>
                    <th>P. unit.</th>
                    <th>Subtotal</th>
                    {previewMode === "INTERNAL" && <th>Método</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewData.lines.map((l) => (
                    <tr key={l.index}>
                      <td>{l.index + 1}</td>
                      <td>
                        {l.description}
                        {l.categoryName && <span style={{ color: "var(--muted)", fontSize: "0.85em" }}> [{l.categoryName}]</span>}
                        {l.error && <span style={{ color: "var(--error, red)" }}> ⚠ {l.error}</span>}
                      </td>
                      {previewMode === "INTERNAL" && <td style={{ fontSize: "0.82em" }}>{l.skuCode}</td>}
                      <td>{l.requestedWidthM} × {l.requestedHeightM}</td>
                      <td>{l.quantity}</td>
                      <td>${(l.unitPrice ?? 0).toLocaleString()}</td>
                      <td>${(l.subtotal ?? 0).toLocaleString()}</td>
                      {previewMode === "INTERNAL" && (
                        <td style={{ fontSize: "0.8em", color: "var(--muted)" }}>
                          {l.priceMethod === "TABLE_LOOKUP" ? "Tabla" : `${(l.linearMeters ?? 0).toFixed(2)} m`}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ textAlign: "right", fontSize: "0.9em", lineHeight: "1.8" }}>
                <div>Subtotal: <strong>${previewData.totals.subtotal.toLocaleString()}</strong></div>
                <div>IVA (19%): <strong>${Math.round(previewData.totals.tax).toLocaleString()}</strong></div>
                <div style={{ fontSize: "1.05em", fontWeight: 700 }}>
                  Total: ${Math.round(previewData.totals.total).toLocaleString()} {previewData.totals.currencyCode}
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => window.print()}>Imprimir</Button>
                {previewMode === "CUSTOMER" && (
                  <Button variant="secondary" onClick={() => void handlePreview("INTERNAL")}>
                    Ver vista interna
                  </Button>
                )}
                {previewMode === "INTERNAL" && (
                  <Button variant="secondary" onClick={() => void handlePreview("CUSTOMER")}>
                    Ver vista cliente
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setPreviewOpen(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </section>
  );
}

function roundClpFront(v: number) {
  const int = Math.round(v);
  const rem = int % 10;
  return rem <= 5 ? int - rem : int - rem + 10;
}
