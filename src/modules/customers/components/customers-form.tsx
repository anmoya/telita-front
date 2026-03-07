"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";

type CustomerRow = {
  id: string;
  code: string;
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

type CustomersFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: "superadmin" | "admin" | "operador";
};

const EMPTY_FORM = {
  fullName: "",
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
    setForm({
      fullName: customer.fullName,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      companyOrReference: customer.companyOrReference ?? "",
      preferredPriceListName: customer.preferredPriceListName ?? "",
      discountCode: customer.discountCode ?? "",
      discountPct: String(customer.discountPct ?? 0),
      notes: customer.notes ?? ""
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const method = editingCustomer ? "PUT" : "POST";
    const url = editingCustomer ? `${apiUrl}/customers/${editingCustomer.id}` : `${apiUrl}/customers`;
    const response = await authedFetch(url, {
      method,
      body: JSON.stringify({
        ...(editingCustomer ? {} : { branchCode: "MAIN" }),
        fullName: form.fullName,
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

  if (currentUserRole === "operador") {
    return <article className="flow-card"><p className="flow-title">Clientes</p><p className="status-note">Solo administradores pueden gestionar clientes.</p></article>;
  }

  return (
    <article className="flow-card">
      <p className="flow-title">Clientes</p>
      <p className="status-note">{status}</p>

      <div className="inline-actions" style={{ marginBottom: "1rem" }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código o descuento" />
        <Button variant="secondary" onClick={() => void loadCustomers()} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Buscar"}
        </Button>
        <Button variant="primary" onClick={openCreate}>Nuevo cliente</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Código</th><th>Cliente</th><th>Contacto</th><th>Lista</th><th>Descuento</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={{ opacity: customer.isActive ? 1 : 0.55 }}>
                <td>{customer.code}</td>
                <td>
                  <strong>{customer.fullName}</strong>
                  <div style={{ fontSize: "0.8em", color: "var(--muted)" }}>{customer.companyOrReference ?? "—"}</div>
                </td>
                <td>
                  <div>{customer.phone ?? "—"}</div>
                  <div style={{ fontSize: "0.8em", color: "var(--muted)" }}>{customer.email ?? "—"}</div>
                </td>
                <td>{customer.preferredPriceListName ?? "—"}</td>
                <td>{customer.discountCode ? `${customer.discountCode} · ${customer.discountPct}%` : `${customer.discountPct}%`}</td>
                <td>{customer.isActive ? "Activo" : "Inactivo"}</td>
                <td>
                  <div className="inline-actions">
                    <Button variant="secondary" onClick={() => openEdit(customer)}>Editar</Button>
                    <Button variant="secondary" onClick={() => void toggleStatus(customer)} disabled={loadingActionId === customer.id}>
                      {loadingActionId === customer.id ? <Spinner size="sm" /> : customer.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr><td colSpan={7}>Sin clientes.</td></tr>
            ) : null}
          </tbody>
        </table>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? "Editar cliente" : "Nuevo cliente"}
      >
        <div className="form-row" style={{ flexWrap: "wrap" }}>
          <label className="field" style={{ flex: 1, minWidth: "220px" }}>
            <span>Nombre</span>
            <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
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
      </Dialog>
    </article>
  );
}
