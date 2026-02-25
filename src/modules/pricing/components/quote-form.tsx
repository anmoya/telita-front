"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { formatLocalDateTime } from "../../../shared/time/date-service";

type MenuKey = "dashboard" | "pricing" | "sales" | "cuts" | "scraps" | "labels" | "audit" | "settings";

type ScrapRequiredAtStage = "NONE" | "AT_CUT" | "AT_SALE_CLOSE";

type ActiveModal =
  | { type: "pre-cut-location"; cutJobId: string }
  | { type: "post-cut-location"; scrapId: string }
  | { type: "assign-scrap-location"; scrapId: string }
  | null;

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
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
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

export function QuoteForm({ accessToken, activeMenu, onNavigate }: QuoteFormProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

  const [heightM, setHeightM] = useState("2.0");
  const [widthM, setWidthM] = useState("2.0");
  const [quantity, setQuantity] = useState("1");

  const [status, setStatus] = useState<string>("");
  const [salesStatus, setSalesStatus] = useState<string>("");
  const [scrapStatus, setScrapStatus] = useState<string>("");
  const [labelStatus, setLabelStatus] = useState<string>("");
  const [cutsStatus, setCutsStatus] = useState<string>("");

  const [saleId, setSaleId] = useState("");
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

  const [dashboardKpis, setDashboardKpis] = useState<DashboardKpis | null>(null);
  const [pendingScraps, setPendingScraps] = useState<PendingScrapRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);

  const linearMeters = useMemo(() => Number(heightM || 0) * Number(quantity || 0), [heightM, quantity]);

  // Load flow rules on mount so cuts section is ready
  useEffect(() => {
    void loadFlowRules();
  }, []);

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
    const [kpisRes, pendingRes, auditRes] = await Promise.all([
      authedFetch(`${apiUrl}/dashboard/kpis?branchCode=MAIN`),
      authedFetch(`${apiUrl}/dashboard/pending-scraps?branchCode=MAIN&limit=10`),
      authedFetch(`${apiUrl}/audit?branchCode=MAIN&limit=8`)
    ]);

    if (kpisRes.ok) setDashboardKpis((await kpisRes.json()) as DashboardKpis);
    if (pendingRes.ok) setPendingScraps((await pendingRes.json()) as PendingScrapRow[]);
    if (auditRes.ok) setAuditEvents((await auditRes.json()) as AuditRow[]);
  }

  async function loadAudit() {
    const auditRes = await authedFetch(`${apiUrl}/audit?branchCode=MAIN&limit=50`);
    if (auditRes.ok) setAuditEvents((await auditRes.json()) as AuditRow[]);
  }

  async function loadCutJobs() {
    const statusQuery = cutFilterStatus === "ALL" ? "" : `&status=${encodeURIComponent(cutFilterStatus)}`;
    const response = await authedFetch(`${apiUrl}/cut-jobs?branchCode=MAIN${statusQuery}`);
    if (!response.ok) {
      setCutsStatus(`Error listando cortes: HTTP ${response.status}`);
      return;
    }
    const rows = (await response.json()) as CutJobRow[];
    setCutJobs(rows);
    setCutsStatus(`Cortes cargados: ${rows.length}`);
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
      await doMarkCut(cutJobId);
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
  }

  // Assign location to a scrap (used by both post-cut and scraps-table dialogs)
  async function doAssignLocation(scrapId: string, locationCode: string) {
    setModalStatus("Guardando...");
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
    setLabelStatus("Generando etiquetas...");
    setBatchResults([]);
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
  }

  async function handleListLabels() {
    const response = await authedFetch(`${apiUrl}/labels?branchCode=MAIN`);
    if (!response.ok) return;
    setLabelList((await response.json()) as LabelRow[]);
  }

  async function handleUpdateFlowRules(stage: ScrapRequiredAtStage) {
    setSettingsStatus("Guardando...");
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
  }

  async function handleRelease(saleId: string, saleLineId: string) {
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
  }

  async function handleConfirmSaleById(id: string) {
    const response = await authedFetch(`${apiUrl}/sales/${id}/confirm`, { method: "POST" });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setSalesStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setSalesStatus("Venta confirmada.");
    await handleListSales();
  }

  async function handleCancelSaleById(id: string) {
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
  }

  async function handleReprintById(id: string) {
    await authedFetch(`${apiUrl}/labels/${id}/reprint`, {
      method: "POST",
      body: JSON.stringify({})
    });
    setLabelStatus("Reimpresion registrada.");
    await handleListLabels();
  }

  async function handleCalculate() {
    setStatus("Calculando...");
    setQuoteResult(null);
    try {
      const response = await authedFetch(`${apiUrl}/pricing/quote`, {
        method: "POST",
        body: JSON.stringify({
          branchCode: "MAIN",
          skuCode: "BLACKOUT_3X5",
          priceListName: "LISTA_BASE",
          requestedWidthM: Number(widthM),
          requestedHeightM: Number(heightM),
          quantity: Number(quantity)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setQuoteResult(data);
      setStatus("Cotizacion guardada.");
    } catch (error) {
      setStatus(`Error al cotizar: ${String(error)}`);
    }
  }

  async function handleListQuotes() {
    const response = await authedFetch(`${apiUrl}/pricing/quotes?branchCode=MAIN`);
    const data: QuoteRow[] = await response.json();
    setQuotes(data);
  }

  async function handleCreateSaleDraft() {
    setSalesStatus("Creando venta...");
    const response = await authedFetch(`${apiUrl}/sales`, {
      method: "POST",
      body: JSON.stringify({
        branchCode: "MAIN",
        priceListName: "LISTA_BASE",
        customerName: "Cliente Demo"
      })
    });
    const data = await response.json();
    setSaleId(data.saleId ?? "");
    setSalesStatus(`Venta draft creada: ${data.saleId ?? "error"}`);
    await handleListSales();
  }

  async function handleAddSaleLine() {
    if (!saleId) return;
    await authedFetch(`${apiUrl}/sales/${saleId}/lines`, {
      method: "POST",
      body: JSON.stringify({
        skuCode: "BLACKOUT_3X5",
        requestedWidthM: Number(widthM),
        requestedHeightM: Number(heightM),
        quantity: Number(quantity)
      })
    });
    setSalesStatus("Linea agregada.");
    await handleListSales();
  }

  async function handleListSales() {
    const response = await authedFetch(`${apiUrl}/sales?branchCode=MAIN`);
    const data: SaleRow[] = await response.json();
    setSales(data);
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
    const response = await authedFetch(`${apiUrl}/scraps?branchCode=MAIN`);
    const data: ScrapRow[] = await response.json();
    setScraps(data);
  }

  async function handleCreateQuoteLabel() {
    if (!quoteResult) return;
    const response = await authedFetch(`${apiUrl}/labels/quote/${quoteResult.quoteId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const data = await response.json();
    setLabelId(data.labelId ?? "");
    setLabelStatus(`Etiqueta quote creada: ${data.labelId ?? "error"}`);
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
            <Button onClick={loadDashboard}>Refrescar</Button>
          </div>

          {dashboardKpis ? (
            <div className="kpi-grid">
              <article className="kpi-card"><span>Quotes Hoy</span><strong>{dashboardKpis.quotesCreatedToday}</strong></article>
              <article className="kpi-card"><span>Ventas Confirmadas</span><strong>{dashboardKpis.salesConfirmedToday}</strong></article>
              <article className="kpi-card"><span>Ventas Anuladas</span><strong>{dashboardKpis.salesCanceledToday}</strong></article>
              <article className="kpi-card"><span>Retazos Pendientes</span><strong>{dashboardKpis.pendingScraps}</strong></article>
              <article className="kpi-card"><span>Etiquetas Hoy</span><strong>{dashboardKpis.labelsPrintedToday}</strong></article>
            </div>
          ) : (
            <p className="status-note">Cargando KPIs...</p>
          )}

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
                    <td>{row.entityType}:{row.entityId.slice(0, 8)}</td>
                    <td>{row.action}</td>
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
          <label className="field"><span>Ancho (m)</span><Input value={widthM} onChange={(event) => setWidthM(event.target.value)} /></label>
          <label className="field"><span>Alto (m)</span><Input value={heightM} onChange={(event) => setHeightM(event.target.value)} /></label>
          <label className="field"><span>Cantidad</span><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
          <p className="status-note">Metros lineales estimados: {linearMeters.toFixed(2)}</p>
          <p className="status-note">{status}</p>
          <div className="inline-actions"><Button onClick={handleCalculate}>Calcular</Button><Button variant="secondary" onClick={handleListQuotes}>Listar Quotes</Button></div>
          {quoteResult ? <pre className="code-block">{JSON.stringify(quoteResult, null, 2)}</pre> : null}
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
          <div className="inline-actions">
            <Button variant="secondary" onClick={handleCreateSaleDraft}>Crear Draft</Button>
            <Button variant="secondary" onClick={handleAddSaleLine} disabled={!saleId}>Agregar Linea</Button>
            <Button variant="secondary" onClick={handleListSales}>Refrescar</Button>
          </div>
          {sales.length > 0 ? (
            <>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Estado</th><th>Lineas</th><th>Total</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {sales.map((row) => (
                    <tr key={row.id} style={{ cursor: "pointer" }} onClick={() => setSaleId(row.id)}>
                      <td>{row.id.slice(0, 8)}{row.id === saleId ? " ◀" : ""}</td>
                      <td>{row.status}</td>
                      <td>{row.lines.length}</td>
                      <td>{row.totalAmount}</td>
                      <td>
                        {row.status === "DRAFT" ? (
                          <div className="inline-actions" onClick={(e) => e.stopPropagation()}>
                            <Button variant="secondary" onClick={() => void handleConfirmSaleById(row.id)}>
                              Confirmar
                            </Button>
                            <Button variant="secondary" onClick={() => void handleCancelSaleById(row.id)}>
                              Anular
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
                        <tr><th>Linea</th><th>SKU</th><th>Medida</th><th>Cant.</th><th>Retazo asignado</th><th>Accion</th></tr>
                      </thead>
                      <tbody>
                        {selectedSale.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{line.id.slice(0, 8)}</td>
                            <td>{line.skuCode}</td>
                            <td>{line.requestedWidthM} x {line.requestedHeightM}</td>
                            <td>{line.quantity}</td>
                            <td>{line.allocatedScrapId ? `✓ ${line.allocatedScrapId.slice(0, 8)}` : "—"}</td>
                            <td>
                              {selectedSale.status === "DRAFT" && !line.allocatedScrapId ? (
                                <Button variant="secondary" onClick={() => void handleFetchMatches(saleId, line)}>
                                  Buscar Retazo
                                </Button>
                              ) : null}
                              {selectedSale.status === "DRAFT" && line.allocatedScrapId ? (
                                <Button variant="secondary" onClick={() => void handleRelease(saleId, line.id)}>
                                  Liberar
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

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
                                    <Button variant="secondary" onClick={() => void handleAllocate(s.id)}>
                                      Asignar
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
            <Button onClick={loadCutJobs}>Refrescar</Button>
          </div>
          {cutJobs.length > 0 ? (
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
                    <td>{row.status}</td>
                    <td>{row.cutAt ? formatLocalDateTime(row.cutAt) : "-"}</td>
                    <td>
                      {row.status === "PENDING" || row.status === "IN_PROGRESS" ? (
                        <Button variant="secondary" onClick={() => void onMarkCutClick(row.id)}>
                          Marcar Cortado
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
              Crear Scrap desde Quote
            </Button>
            <Button variant="secondary" onClick={handleListScraps}>Refrescar</Button>
          </div>
          {scraps.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Estado</th><th>Area m²</th><th>Medida</th><th>SKU</th><th>Ubicacion</th><th>Accion</th></tr>
              </thead>
              <tbody>
                {scraps.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id.slice(0, 8)}</td>
                    <td>{row.status}</td>
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
            <Button onClick={() => void handleBatchLabels()}>Emitir todas las etiquetas</Button>
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

          <p className="flow-title" style={{ marginTop: "1.5rem" }}>Etiqueta individual (quote/scrap)</p>
          <p className="status-note">LabelId actual: {labelId || "-"}</p>
          <div className="inline-actions">
            <Button variant="secondary" onClick={handleCreateQuoteLabel} disabled={!quoteResult}>Label Quote</Button>
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
            <Button variant="secondary" onClick={() => void handleListLabels()}>Refrescar</Button>
          </div>
          {labelList.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Tipo</th><th>Linea/Scrap/Quote</th><th>Creado</th><th>Ultimo print</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {labelList.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id.slice(0, 8)}</td>
                    <td>{l.type}</td>
                    <td>{(l.saleLineId ?? l.scrapId ?? l.quoteId ?? "—")?.slice(0, 8)}</td>
                    <td>{formatLocalDateTime(l.createdAt)}</td>
                    <td>{l.lastPrintedAt ? formatLocalDateTime(l.lastPrintedAt) : "—"}</td>
                    <td>
                      <div className="inline-actions">
                        <a
                          className="link-btn"
                          href={`${apiUrl}/labels/${l.id}/pdf?accessToken=${encodeURIComponent(accessToken)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver
                        </a>
                        <Button variant="secondary" onClick={() => void handleReprintById(l.id)}>
                          Reimprimir
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
            <Button variant="secondary" onClick={loadFlowRules}>Refrescar</Button>
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
                >
                  NONE (sin enforcement)
                </Button>
                <Button
                  variant={flowRules.scrapRequiredAtStage === "AT_CUT" ? "primary" : "secondary"}
                  onClick={() => void handleUpdateFlowRules("AT_CUT")}
                >
                  AT_CUT (requiere ubicacion al cortar)
                </Button>
                <Button
                  variant={flowRules.scrapRequiredAtStage === "AT_SALE_CLOSE" ? "primary" : "secondary"}
                  onClick={() => void handleUpdateFlowRules("AT_SALE_CLOSE")}
                >
                  AT_SALE_CLOSE (requiere retazos resueltos al confirmar)
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
          <div className="inline-actions"><Button onClick={loadAudit}>Refrescar</Button></div>
          {auditEvents.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Entidad</th><th>Accion</th><th>Actor</th><th>Fecha</th></tr></thead>
              <tbody>
                {auditEvents.map((row) => (
                  <tr key={row.id}><td>{row.entityType}:{row.entityId.slice(0, 8)}</td><td>{row.action}</td><td>{row.actor.email}</td><td>{formatLocalDateTime(row.createdAt)}</td></tr>
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
            onClick={() => {
              if (activeModal?.type === "pre-cut-location") {
                void doMarkCut(activeModal.cutJobId, modalLocationCode);
              }
            }}
            disabled={!modalLocationCode}
          >
            Confirmar y marcar cortado
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
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
            onClick={() => {
              if (activeModal?.type === "post-cut-location") {
                void doAssignLocation(activeModal.scrapId, modalLocationCode);
              }
            }}
            disabled={!modalLocationCode}
          >
            Asignar ubicacion
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal(null)}>Omitir por ahora</Button>
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
            onClick={() => {
              if (activeModal?.type === "assign-scrap-location") {
                void doAssignLocation(activeModal.scrapId, modalLocationCode);
              }
            }}
            disabled={!modalLocationCode}
          >
            Asignar ubicacion
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
        </div>
      </Dialog>
    </section>
  );
}
