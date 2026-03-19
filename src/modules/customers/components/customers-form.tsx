"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Badge } from "../../../shared/ui/primitives/badge";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";
import { normalizeRut, validateRut } from "../../../shared/utils/rut";

type CustomerRow = {
  id: string;
  code: string;
  rut: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  companyOrReference: string | null;
  preferredPriceListName: string | null;
  discountCode: string | null;
  discountPct: number;
  notes: string | null;
  isActive: boolean;
};

type PriceListOption = {
  name: string;
  isActive: boolean;
};

type DiscountRow = {
  id: string;
  customerId: string;
  discountCode: string | null;
  discountPct: number;
  reason: string | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  status: "VIGENTE" | "FUTURO" | "EXPIRADO" | "DESACTIVADO";
  createdAt: string;
  createdByName: string | null;
};

const EMPTY_DISCOUNT_FORM = {
  discountCode: "",
  discountPct: "",
  reason: "",
  validFrom: "",
  validTo: ""
};

type CustomersFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: "superadmin" | "admin" | "operador";
};

const EMPTY_FORM = {
  fullName: "",
  rut: "",
  phone: "",
  email: "",
  companyOrReference: "",
  preferredPriceListName: "",
  discountCode: "",
  discountPct: "0",
  notes: ""
};

export function CustomersForm({ accessToken, apiUrl, currentUserRole }: CustomersFormProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [priceLists, setPriceLists] = useState<PriceListOption[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rutError, setRutError] = useState("");

  // Discount management state
  const [discountsCustomer, setDiscountsCustomer] = useState<CustomerRow | null>(null);
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountRow | null>(null);
  const [discountForm, setDiscountForm] = useState(EMPTY_DISCOUNT_FORM);
  const [discountStatus, setDiscountStatus] = useState("");

  useEffect(() => {
    void Promise.all([loadCustomers(), loadPriceLists()]);
  }, []);

  async function authedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  async function loadCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ branchCode: "MAIN" });
      if (query.trim()) params.set("q", query.trim());
      const response = await authedFetch(`${apiUrl}/customers?${params.toString()}`);
      if (!response.ok) {
        const body = await response.json() as { message?: string };
        setStatus(body.message ?? "No se pudo cargar clientes.");
        return;
      }
      setCustomers(await response.json() as CustomerRow[]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPriceLists() {
    const response = await authedFetch(`${apiUrl}/price-lists?branchCode=MAIN`);
    if (!response.ok) return;
    setPriceLists(await response.json() as PriceListOption[]);
  }

  function openCreate() {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(customer: CustomerRow) {
    setEditingCustomer(customer);
    setDiscountsCustomer(customer);
    setForm({
      fullName: customer.fullName,
      rut: customer.rut ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      companyOrReference: customer.companyOrReference ?? "",
      preferredPriceListName: customer.preferredPriceListName ?? "",
      discountCode: customer.discountCode ?? "",
      discountPct: String(customer.discountPct ?? 0),
      notes: customer.notes ?? ""
    });
    setDiscountStatus("");
    setModalOpen(true);
    void loadDiscounts(customer.id);
  }

  function handleRutBlur() {
    if (!form.rut.trim()) { setRutError(""); return; }
    const normalized = normalizeRut(form.rut);
    if (!validateRut(normalized)) { setRutError("RUT inválido"); return; }
    setRutError("");
    setForm((prev) => ({ ...prev, rut: normalized }));
  }

  async function handleSubmit() {
    if (form.rut.trim() && !validateRut(normalizeRut(form.rut))) {
      setRutError("RUT inválido");
      return;
    }
    const method = editingCustomer ? "PUT" : "POST";
    const url = editingCustomer ? `${apiUrl}/customers/${editingCustomer.id}` : `${apiUrl}/customers`;
    const response = await authedFetch(url, {
      method,
      body: JSON.stringify({
        ...(editingCustomer ? {} : { branchCode: "MAIN" }),
        fullName: form.fullName,
        rut: form.rut || null,
        phone: form.phone || null,
        email: form.email || null,
        companyOrReference: form.companyOrReference || null,
        preferredPriceListName: form.preferredPriceListName || null,
        discountCode: form.discountCode || null,
        discountPct: Number(form.discountPct || 0),
        notes: form.notes || null
      })
    });
    const body = await response.json();
    if (!response.ok) {
      setStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setModalOpen(false);
    setStatus(editingCustomer ? "Cliente actualizado." : "Cliente creado.");
    await loadCustomers();
  }

  async function toggleStatus(customer: CustomerRow) {
    setLoadingActionId(customer.id);
    try {
      const response = await authedFetch(`${apiUrl}/customers/${customer.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !customer.isActive })
      });
      const body = await response.json();
      if (!response.ok) {
        setStatus(body.message ?? `Error HTTP ${response.status}`);
        return;
      }
      await loadCustomers();
    } finally {
      setLoadingActionId(null);
    }
  }

  async function loadDiscounts(customerId: string) {
    setLoadingDiscounts(true);
    try {
      const response = await authedFetch(`${apiUrl}/customers/${customerId}/discounts`);
      if (response.ok) setDiscounts(await response.json() as DiscountRow[]);
    } finally {
      setLoadingDiscounts(false);
    }
  }

  function openCreateDiscount() {
    setEditingDiscount(null);
    setDiscountForm(EMPTY_DISCOUNT_FORM);
    setDiscountModalOpen(true);
  }

  function openEditDiscount(d: DiscountRow) {
    setEditingDiscount(d);
    setDiscountForm({
      discountCode: d.discountCode ?? "",
      discountPct: String(d.discountPct),
      reason: d.reason ?? "",
      validFrom: d.validFrom,
      validTo: d.validTo ?? ""
    });
    setDiscountModalOpen(true);
  }

  async function handleDiscountSubmit() {
    if (!discountsCustomer) return;
    const payload = {
      discountCode: discountForm.discountCode || undefined,
      discountPct: Number(discountForm.discountPct || 0),
      reason: discountForm.reason || undefined,
      validFrom: discountForm.validFrom,
      validTo: discountForm.validTo || undefined
    };
    const url = editingDiscount
      ? `${apiUrl}/customers/${discountsCustomer.id}/discounts/${editingDiscount.id}`
      : `${apiUrl}/customers/${discountsCustomer.id}/discounts`;
    const method = editingDiscount ? "PUT" : "POST";
    const response = await authedFetch(url, { method, body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok) {
      setDiscountStatus(body.message ?? `Error HTTP ${response.status}`);
      return;
    }
    setDiscountModalOpen(false);
    setDiscountStatus(editingDiscount ? "Descuento actualizado." : "Descuento creado.");
    await loadDiscounts(discountsCustomer.id);
  }

  async function handleDeactivateDiscount(d: DiscountRow) {
    if (!discountsCustomer) return;
    const response = await authedFetch(`${apiUrl}/customers/${discountsCustomer.id}/discounts/${d.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json();
      setDiscountStatus(body.message ?? "Error al desactivar.");
      return;
    }
    setDiscountStatus("Descuento desactivado.");
    await loadDiscounts(discountsCustomer.id);
  }

  const discountStatusBadge: Record<string, { variant: "success" | "neutral" | "danger"; label: string }> = {
    VIGENTE: { variant: "success", label: "Vigente" },
    FUTURO: { variant: "neutral", label: "Futuro" },
    EXPIRADO: { variant: "neutral", label: "Expirado" },
    DESACTIVADO: { variant: "danger", label: "Desactivado" }
  };

  if (currentUserRole === "operador") {
    return <article className="flow-card"><p className="flow-title">Clientes</p><p className="status-note">Solo administradores pueden gestionar clientes.</p></article>;
  }

  return (
    <article className="module-panel">
      <div className="panel-toolbar">
        <div className="admin-module-title-group">
          <p className="admin-module-kicker">Relacion comercial</p>
          <h3 className="panel-heading">Clientes</h3>
          <p className="admin-module-summary">
            Gestiona cuentas, descuentos y listas preferidas para cotizacion y venta.
          </p>
          {status ? <p className="status-note">{status}</p> : null}
        </div>
      </div>

      <div className="admin-toolbar-inline">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código, RUT o descuento" />
        <Button variant="secondary" onClick={() => void loadCustomers()} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Buscar"}
        </Button>
        <Button variant="primary" onClick={openCreate}>Nuevo cliente</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : (
        <DataTable>
          <thead>
            <tr><th>Código</th><th>RUT</th><th>Cliente</th><th>Contacto</th><th>Lista</th><th>Descuento</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className={customer.isActive ? "" : "table-row-dim"}>
                <td>{customer.code}</td>
                <td>{customer.rut ?? "—"}</td>
                <td>
                  <div className="table-cell-primary">
                    <strong>{customer.fullName}</strong>
                    <div className="table-cell-meta">{customer.companyOrReference ?? "Sin empresa o referencia"}</div>
                  </div>
                </td>
                <td>
                  <div className="table-cell-primary">
                    <span>{customer.phone ?? "—"}</span>
                    <div className="table-cell-meta">{customer.email ?? "Sin correo"}</div>
                  </div>
                </td>
                <td>{customer.preferredPriceListName ?? "—"}</td>
                <td>{customer.discountCode ? `${customer.discountCode} · ${customer.discountPct}%` : `${customer.discountPct}%`}</td>
                <td>
                  <Badge variant={customer.isActive ? "success" : "danger"}>
                    {customer.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td>
                  <div className="table-actions">
                    <Button variant="secondary" onClick={() => openEdit(customer)}>Editar</Button>
                    <Button variant="secondary" onClick={() => void toggleStatus(customer)} disabled={loadingActionId === customer.id}>
                      {loadingActionId === customer.id ? <Spinner size="sm" /> : customer.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr><td colSpan={8} className="table-empty">Sin clientes.</td></tr>
            ) : null}
          </tbody>
        </DataTable>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? "Editar cliente" : "Nuevo cliente"}
        panelClassName={editingCustomer ? "dialog-panel--wide" : undefined}
      >
        <div className="form-row" style={{ flexWrap: "wrap" }}>
          <label className="field" style={{ flex: 1, minWidth: "220px" }}>
            <span>Nombre</span>
            <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
          </label>
          <label className="field" style={{ width: "180px" }}>
            <span>RUT</span>
            <Input
              value={form.rut}
              onChange={(e) => { setForm((prev) => ({ ...prev, rut: e.target.value })); setRutError(""); }}
              onBlur={handleRutBlur}
              placeholder="12.345.678-9"
            />
            {rutError ? <span className="field-error">{rutError}</span> : null}
          </label>
          <label className="field" style={{ flex: 1, minWidth: "220px" }}>
            <span>Referencia / empresa</span>
            <Input value={form.companyOrReference} onChange={(e) => setForm((prev) => ({ ...prev, companyOrReference: e.target.value }))} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: "180px" }}>
            <span>Teléfono</span>
            <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: "220px" }}>
            <span>Email</span>
            <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: "180px" }}>
            <span>Lista preferida</span>
            <Select value={form.preferredPriceListName} onChange={(e) => setForm((prev) => ({ ...prev, preferredPriceListName: e.target.value }))}>
              <option value="">Sin preferencia</option>
              {priceLists.filter((pl) => pl.isActive).map((priceList) => (
                <option key={priceList.name} value={priceList.name}>{priceList.name}</option>
              ))}
            </Select>
          </label>
          <label className="field" style={{ width: "180px" }}>
            <span>Código descuento</span>
            <Input value={form.discountCode} onChange={(e) => setForm((prev) => ({ ...prev, discountCode: e.target.value.toUpperCase() }))} />
          </label>
          <label className="field" style={{ width: "120px" }}>
            <span>Descuento %</span>
            <Input type="number" value={form.discountPct} onChange={(e) => setForm((prev) => ({ ...prev, discountPct: e.target.value }))} min="0" max="100" step="0.1" />
          </label>
          <label className="field" style={{ flex: 1, minWidth: "220px" }}>
            <span>Notas</span>
            <Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </label>
        </div>
        <div className="inline-actions" style={{ marginTop: "1rem" }}>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={() => void handleSubmit()}>
            {editingCustomer ? "Guardar" : "Crear"}
          </Button>
        </div>

        {/* Discounts section — only when editing */}
        {editingCustomer ? (
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Descuentos temporales</h4>
              <Button variant="primary" onClick={openCreateDiscount}>Nuevo descuento</Button>
            </div>
            {discountStatus ? <p className="status-note" style={{ marginBottom: "0.5rem" }}>{discountStatus}</p> : null}

            {loadingDiscounts ? (
              <TableSkeleton rows={2} cols={7} />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>%</th>
                    <th>Motivo</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => {
                    const badge = discountStatusBadge[d.status] ?? { variant: "neutral" as const, label: d.status };
                    return (
                      <tr key={d.id} className={d.isActive ? "" : "table-row-dim"}>
                        <td>{d.discountCode ?? "—"}</td>
                        <td>{d.discountPct}%</td>
                        <td>{d.reason ?? "—"}</td>
                        <td>{d.validFrom}</td>
                        <td>{d.validTo ?? "Indefinido"}</td>
                        <td><Badge variant={badge.variant}>{badge.label}</Badge></td>
                        <td>
                          <div className="table-actions">
                            {d.isActive ? (
                              <>
                                <Button variant="secondary" onClick={() => openEditDiscount(d)}>Editar</Button>
                                <Button variant="secondary" onClick={() => void handleDeactivateDiscount(d)}>Desactivar</Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {discounts.length === 0 ? (
                    <tr><td colSpan={7} className="table-empty">Sin descuentos registrados.</td></tr>
                  ) : null}
                </tbody>
              </DataTable>
            )}

            {/* Inline discount form */}
            {discountModalOpen ? (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
                <p style={{ margin: "0 0 0.5rem", fontWeight: 500, fontSize: "0.85rem" }}>
                  {editingDiscount ? "Editar descuento" : "Nuevo descuento"}
                </p>
                <div className="form-row" style={{ flexWrap: "wrap" }}>
                  <label className="field" style={{ width: "140px" }}>
                    <span>Código</span>
                    <Input
                      value={discountForm.discountCode}
                      onChange={(e) => setDiscountForm((prev) => ({ ...prev, discountCode: e.target.value.toUpperCase() }))}
                      placeholder="Ej: PROMO2026"
                    />
                  </label>
                  <label className="field" style={{ width: "100px" }}>
                    <span>%</span>
                    <Input
                      type="number"
                      value={discountForm.discountPct}
                      onChange={(e) => setDiscountForm((prev) => ({ ...prev, discountPct: e.target.value }))}
                      min="0" max="100" step="0.1"
                    />
                  </label>
                  <label className="field" style={{ flex: 1, minWidth: "160px" }}>
                    <span>Motivo</span>
                    <Input
                      value={discountForm.reason}
                      onChange={(e) => setDiscountForm((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="Razón del descuento"
                    />
                  </label>
                  <label className="field" style={{ width: "140px" }}>
                    <span>Desde</span>
                    <Input
                      type="date"
                      value={discountForm.validFrom}
                      onChange={(e) => setDiscountForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </label>
                  <label className="field" style={{ width: "140px" }}>
                    <span>Hasta</span>
                    <Input
                      type="date"
                      value={discountForm.validTo}
                      onChange={(e) => setDiscountForm((prev) => ({ ...prev, validTo: e.target.value }))}
                    />
                    <span style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Vacío = indefinido</span>
                  </label>
                </div>
                <div className="inline-actions" style={{ marginTop: "0.5rem" }}>
                  <Button variant="secondary" onClick={() => setDiscountModalOpen(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={() => void handleDiscountSubmit()} disabled={!discountForm.discountPct || !discountForm.validFrom}>
                    {editingDiscount ? "Guardar" : "Crear"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </article>
  );
}
