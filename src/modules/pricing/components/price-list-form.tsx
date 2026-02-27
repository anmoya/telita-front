"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Alert } from "../../../shared/ui/primitives/alert";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";
import { formatLocalDateTime } from "../../../shared/time/date-service";

type PriceList = {
  id: string;
  name: string;
  currencyCode: string;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  itemCount: number;
};

type PriceListItem = {
  id: string;
  skuId: string;
  skuCode: string;
  skuName: string;
  basePrice: number;
  discountPct: number;
  finalPrice: number;
};

type SkuOption = {
  code: string;
  name: string;
};

type PriceListCell = {
  id: string;
  skuCode: string;
  maxWidthM: number;
  maxHeightM: number;
  unitPrice: number;
};

type PriceListFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: "superadmin" | "admin" | "operador";
};

type CreateListBody = {
  branchCode: string;
  name: string;
  currencyCode: string;
  validFrom: string;
  validTo: string | null;
};

type UpdateListBody = {
  name: string;
  currencyCode: string;
  validFrom: string;
  validTo: string | null;
};

type CreateItemBody = {
  skuCode: string;
  basePrice: number;
  discountPct: number;
};

type UpdateItemBody = {
  basePrice: number;
  discountPct: number;
};

type CreateCellBody = {
  skuCode: string;
  maxWidthM: number;
  maxHeightM: number;
  unitPrice: number;
};

type UpdateCellBody = {
  maxWidthM?: number;
  maxHeightM?: number;
  unitPrice?: number;
};

export function PriceListForm({ accessToken, apiUrl, currentUserRole }: PriceListFormProps) {
  const [view, setView] = useState<"lists" | "items" | "cells">("lists");
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [cells, setCells] = useState<PriceListCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog states
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);
  const [showEditListDialog, setShowEditListDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [showCreateCellDialog, setShowCreateCellDialog] = useState(false);
  const [showEditCellDialog, setShowEditCellDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form states
  const [listForm, setListForm] = useState<CreateListBody>({
    branchCode: "MAIN",
    name: "",
    currencyCode: "CLP",
    validFrom: new Date().toISOString().split("T")[0],
    validTo: null
  });
  const [itemForm, setItemForm] = useState<CreateItemBody>({
    skuCode: "",
    basePrice: 0,
    discountPct: 0
  });
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [cellForm, setCellForm] = useState<CreateCellBody>({
    skuCode: "",
    maxWidthM: 0,
    maxHeightM: 0,
    unitPrice: 0
  });
  const [editingCell, setEditingCell] = useState<PriceListCell | null>(null);
  const [skuOptions, setSkuOptions] = useState<SkuOption[]>([]);
  const [loadingSkus, setLoadingSkus] = useState(false);

  // SPEC-30: Error handling in modal
  const [addItemError, setAddItemError] = useState("");

  const isAdmin = currentUserRole === "superadmin" || currentUserRole === "admin";

  // SPEC-30: Filter SKUs to exclude those already in current list
  const availableSkuOptions = useMemo(() => {
    const currentSkuCodes = items.map((item) => item.skuCode);
    return skuOptions.filter((sku) => !currentSkuCodes.includes(sku.code));
  }, [skuOptions, items]);

  // Load price lists on mount
  useEffect(() => {
    loadPriceLists();
  }, [accessToken]);

  // Load items when selected list changes
  useEffect(() => {
    if (selectedList && view === "items") {
      loadItems(selectedList.id);
    }
  }, [selectedList, view, accessToken]);

  // Load cells when selected list changes
  useEffect(() => {
    if (selectedList && view === "cells") {
      loadCells(selectedList.id);
    }
  }, [selectedList, view, accessToken]);

  async function loadPriceLists() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/price-lists?branchCode=MAIN`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Error al cargar listas de precios");
      const data = await res.json();
      setPriceLists(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(priceListId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/price-lists/${priceListId}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Error al cargar ítems");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function loadCells(priceListId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/price-lists/${priceListId}/cells`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Error al cargar celdas");
      const data = await res.json();
      setCells(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function loadSkuOptions() {
    setLoadingSkus(true);
    try {
      const res = await fetch(`${apiUrl}/catalog/all-skus?branchCode=MAIN`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Error al cargar SKUs");
      const data = await res.json();
      setSkuOptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSkus(false);
    }
  }

  async function handleCreateList() {
    try {
      const res = await fetch(`${apiUrl}/price-lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(listForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear lista");
      }
      setShowCreateListDialog(false);
      setListForm({
        branchCode: "MAIN",
        name: "",
        currencyCode: "CLP",
        validFrom: new Date().toISOString().split("T")[0],
        validTo: null
      });
      loadPriceLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleUpdateList() {
    if (!selectedList) return;
    try {
      const body: UpdateListBody = {
        name: listForm.name,
        currencyCode: listForm.currencyCode,
        validFrom: listForm.validFrom,
        validTo: listForm.validTo
      };
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar lista");
      }
      setShowEditListDialog(false);
      loadPriceLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleToggleStatus(list: PriceList) {
    try {
      const res = await fetch(`${apiUrl}/price-lists/${list.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al cambiar estado");
      }
      loadPriceLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleDeleteList(listId: string) {
    try {
      const res = await fetch(`${apiUrl}/price-lists/${listId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar lista");
      }
      setShowDeleteConfirm(null);
      loadPriceLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleAddItem() {
    if (!selectedList) return;
    setAddItemError("");
    try {
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(itemForm)
      });
      if (!res.ok) {
        const err = await res.json();
        // SPEC-30: Handle 409 Conflict gracefully in modal
        if (res.status === 409) {
          setAddItemError(err.message || "Este SKU ya existe en la lista");
          return;
        }
        throw new Error(err.message || "Error al agregar ítem");
      }
      setShowAddItemDialog(false);
      setItemForm({ skuCode: "", basePrice: 0, discountPct: 0 });
      setAddItemError("");
      loadItems(selectedList.id);
      loadPriceLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleUpdateItem() {
    if (!selectedList || !editingItem) return;
    try {
      const body: UpdateItemBody = {
        basePrice: itemForm.basePrice,
        discountPct: itemForm.discountPct
      };
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}/items/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar ítem");
      }
      setShowEditItemDialog(false);
      setEditingItem(null);
      setItemForm({ skuCode: "", basePrice: 0, discountPct: 0 });
      loadItems(selectedList.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!selectedList) return;
    try {
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar ítem");
      }
      loadItems(selectedList.id);
      loadPriceLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleCreateCell() {
    if (!selectedList) return;
    try {
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}/cells`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(cellForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear celda");
      }
      setShowCreateCellDialog(false);
      setCellForm({ skuCode: "", maxWidthM: 0, maxHeightM: 0, unitPrice: 0 });
      loadCells(selectedList.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleUpdateCell() {
    if (!selectedList || !editingCell) return;
    try {
      const body: UpdateCellBody = {
        maxWidthM: cellForm.maxWidthM,
        maxHeightM: cellForm.maxHeightM,
        unitPrice: cellForm.unitPrice
      };
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}/cells/${editingCell.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar celda");
      }
      setShowEditCellDialog(false);
      setEditingCell(null);
      setCellForm({ skuCode: "", maxWidthM: 0, maxHeightM: 0, unitPrice: 0 });
      loadCells(selectedList.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function handleDeleteCell(cellId: string) {
    if (!selectedList) return;
    try {
      const res = await fetch(`${apiUrl}/price-lists/${selectedList.id}/cells/${cellId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar celda");
      }
      loadCells(selectedList.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  function openEditListDialog(list: PriceList) {
    setListForm({
      branchCode: "MAIN",
      name: list.name,
      currencyCode: list.currencyCode,
      validFrom: list.validFrom ? list.validFrom.split("T")[0] : "",
      validTo: list.validTo ? list.validTo.split("T")[0] : null
    });
    setSelectedList(list);
    setShowEditListDialog(true);
  }

  function openEditItemDialog(item: PriceListItem) {
    setEditingItem(item);
    setItemForm({
      skuCode: item.skuCode,
      basePrice: item.basePrice,
      discountPct: item.discountPct
    });
    setShowEditItemDialog(true);
  }

  function openAddItemDialog() {
    setItemForm({ skuCode: "", basePrice: 0, discountPct: 0 });
    loadSkuOptions();
    setShowAddItemDialog(true);
  }

  function openCreateCellDialog() {
    setCellForm({ skuCode: "", maxWidthM: 0, maxHeightM: 0, unitPrice: 0 });
    loadSkuOptions();
    setShowCreateCellDialog(true);
  }

  function openEditCellDialog(cell: PriceListCell) {
    setEditingCell(cell);
    setCellForm({
      skuCode: cell.skuCode,
      maxWidthM: cell.maxWidthM,
      maxHeightM: cell.maxHeightM,
      unitPrice: cell.unitPrice
    });
    setShowEditCellDialog(true);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP"
    }).format(value);
  }

  if (loading && priceLists.length === 0) {
    return (
      <div className="price-list-container">
        <TableSkeleton rows={5} cols={7} />
      </div>
    );
  }

  return (
    <div className="price-list-container">
      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Breadcrumb */}
      {(view === "items" || view === "cells") && (
        <div className="breadcrumb">
          <button onClick={() => setView("lists")} className="breadcrumb-link">
            Listas de precios
          </button>
          <span className="breadcrumb-sep">›</span>
          <button onClick={() => setView("items")} className="breadcrumb-link">
            {selectedList?.name}
          </button>
          {view === "cells" && (
            <>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">Tabla de precios</span>
            </>
          )}
        </div>
      )}

      {/* Lists View */}
      {view === "lists" && (
        <>
          <div className="section-header">
            <h3>Listas de precios</h3>
            {isAdmin && (
              <Button variant="primary" onClick={() => setShowCreateListDialog(true)}>
                + Nueva lista
              </Button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Moneda</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Estado</th>
                  <th>SKUs</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {priceLists.map((list) => (
                  <tr key={list.id}>
                    <td>{list.name}</td>
                    <td>{list.currencyCode}</td>
                    <td>{list.validFrom ? formatLocalDateTime(list.validFrom).split(" ")[0] : "-"}</td>
                    <td>{list.validTo ? formatLocalDateTime(list.validTo).split(" ")[0] : "Sin límite"}</td>
                    <td>
                      <span className={`status-badge ${list.isActive ? "status-active" : "status-inactive"}`}>
                        {list.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>{list.itemCount}</td>
                    <td className="actions-cell">
                      <Button variant="secondary" onClick={() => { setSelectedList(list); setView("items"); }}>
                        Ver ítems
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="secondary" onClick={() => openEditListDialog(list)}>
                            Editar
                          </Button>
                          <Button variant="secondary" onClick={() => handleToggleStatus(list)}>
                            {list.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {priceLists.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      No hay listas de precios. Crea una nueva.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Items View */}
      {view === "items" && selectedList && (
        <>
          <div className="section-header">
            <div>
              <h3>Ítems de: {selectedList.name}</h3>
              {isAdmin && (
                <Button variant="secondary" onClick={() => setView("cells")} style={{ marginTop: "0.5rem" }}>
                  Ver tabla de precios
                </Button>
              )}
            </div>
            {isAdmin && (
              <Button variant="primary" onClick={openAddItemDialog}>
                + Agregar SKU
              </Button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Precio base</th>
                  <th>Descuento %</th>
                  <th>Precio final</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.skuCode}</td>
                    <td>{item.skuName}</td>
                    <td>{formatCurrency(item.basePrice)}</td>
                    <td>{item.discountPct}%</td>
                    <td>{formatCurrency(item.finalPrice)}</td>
                    {isAdmin && (
                      <td className="actions-cell">
                        <Button variant="secondary" onClick={() => openEditItemDialog(item)}>
                          Editar
                        </Button>
                        <Button variant="secondary" onClick={() => handleDeleteItem(item.id)}>
                          Eliminar
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="empty-row">
                      No hay ítems en esta lista. Agrega SKUs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Cells View (SPEC-31) */}
      {view === "cells" && selectedList && (
        <>
          <div className="section-header">
            <h3>Tabla de precios: {selectedList.name}</h3>
            {isAdmin && (
              <Button variant="primary" onClick={openCreateCellDialog}>
                + Nueva celda
              </Button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Ancho máx (m)</th>
                  <th>Alto máx (m)</th>
                  <th>Precio unitario</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cells.map((cell) => (
                  <tr key={cell.id}>
                    <td>{cell.skuCode}</td>
                    <td>{cell.maxWidthM.toFixed(3)}</td>
                    <td>{cell.maxHeightM.toFixed(3)}</td>
                    <td>{formatCurrency(cell.unitPrice)}</td>
                    {isAdmin && (
                      <td className="actions-cell">
                        <Button variant="secondary" onClick={() => openEditCellDialog(cell)}>
                          Editar
                        </Button>
                        <Button variant="secondary" onClick={() => handleDeleteCell(cell.id)}>
                          Eliminar
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {cells.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="empty-row">
                      No hay celdas en esta tabla. Agrega una nueva.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create List Dialog */}
      <Dialog open={showCreateListDialog} onClose={() => setShowCreateListDialog(false)} title="Nueva lista de precios">
        <div className="dialog-form">
          <div className="form-field">
            <label>Nombre</label>
            <Input
              value={listForm.name}
              onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
              placeholder="Lista Público General"
            />
          </div>
          <div className="form-field">
            <label>Moneda</label>
            <Select
              value={listForm.currencyCode}
              onChange={(e) => setListForm({ ...listForm, currencyCode: e.target.value })}
            >
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
            </Select>
          </div>
          <div className="form-field">
            <label>Desde</label>
            <Input
              type="date"
              value={listForm.validFrom}
              onChange={(e) => setListForm({ ...listForm, validFrom: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Hasta (opcional)</label>
            <Input
              type="date"
              value={listForm.validTo || ""}
              onChange={(e) => setListForm({ ...listForm, validTo: e.target.value || null })}
            />
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setShowCreateListDialog(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateList} disabled={!listForm.name || !listForm.validFrom}>
              Crear
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={showEditListDialog} onClose={() => setShowEditListDialog(false)} title="Editar lista de precios">
        <div className="dialog-form">
          <div className="form-field">
            <label>Nombre</label>
            <Input
              value={listForm.name}
              onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Moneda</label>
            <Select
              value={listForm.currencyCode}
              onChange={(e) => setListForm({ ...listForm, currencyCode: e.target.value })}
            >
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
            </Select>
          </div>
          <div className="form-field">
            <label>Desde</label>
            <Input
              type="date"
              value={listForm.validFrom}
              onChange={(e) => setListForm({ ...listForm, validFrom: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Hasta (opcional)</label>
            <Input
              type="date"
              value={listForm.validTo || ""}
              onChange={(e) => setListForm({ ...listForm, validTo: e.target.value || null })}
            />
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setShowEditListDialog(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateList} disabled={!listForm.name || !listForm.validFrom}>
              Guardar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onClose={() => setShowAddItemDialog(false)} title="Agregar SKU a la lista">
        <div className="dialog-form">
          {/* SPEC-30: Show error inline in modal */}
          {addItemError && (
            <div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#fee", border: "1px solid #f99", borderRadius: "4px", color: "#c00", fontSize: "0.9em" }}>
              {addItemError}
            </div>
          )}

          {/* SPEC-30: Filter available SKUs (exclude already added) */}
          {availableSkuOptions.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--muted)" }}>
              <p>Todos los SKUs activos ya están agregados a esta lista.</p>
            </div>
          ) : (
            <>
              <div className="form-field">
                <label>SKU</label>
                {loadingSkus ? (
                  <Spinner />
                ) : (
                  <Select
                    value={itemForm.skuCode}
                    onChange={(e) => setItemForm({ ...itemForm, skuCode: e.target.value })}
                  >
                    <option value="">Seleccionar SKU...</option>
                    {availableSkuOptions.map((sku) => (
                      <option key={sku.code} value={sku.code}>
                        {sku.code} - {sku.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <div className="form-field">
                <label>Precio base</label>
                <Input
                  type="number"
                  value={itemForm.basePrice}
                  onChange={(e) => setItemForm({ ...itemForm, basePrice: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div className="form-field">
                <label>Descuento %</label>
                <Input
                  type="number"
                  value={itemForm.discountPct}
                  onChange={(e) => setItemForm({ ...itemForm, discountPct: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div className="price-preview">
                <span>Precio final: </span>
                <strong>
                  {formatCurrency(itemForm.basePrice * (1 - itemForm.discountPct / 100))}
                </strong>
              </div>
            </>
          )}

          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => { setShowAddItemDialog(false); setAddItemError(""); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddItem}
              disabled={availableSkuOptions.length === 0 || !itemForm.skuCode || itemForm.basePrice <= 0}
            >
              Agregar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItemDialog} onClose={() => setShowEditItemDialog(false)} title="Editar precio">
        <div className="dialog-form">
          <div className="form-field">
            <label>SKU</label>
            <Input value={itemForm.skuCode} disabled />
          </div>
          <div className="form-field">
            <label>Precio base</label>
            <Input
              type="number"
              value={itemForm.basePrice}
              onChange={(e) => setItemForm({ ...itemForm, basePrice: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="form-field">
            <label>Descuento %</label>
            <Input
              type="number"
              value={itemForm.discountPct}
              onChange={(e) => setItemForm({ ...itemForm, discountPct: Number(e.target.value) })}
              min={0}
              max={100}
            />
          </div>
          <div className="price-preview">
            <span>Precio final: </span>
            <strong>
              {formatCurrency(itemForm.basePrice * (1 - itemForm.discountPct / 100))}
            </strong>
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setShowEditItemDialog(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateItem} disabled={itemForm.basePrice <= 0}>
              Guardar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Confirmar eliminación">
        <div className="dialog-form">
          <p>¿Estás seguro de eliminar esta lista de precios? Esta acción no se puede deshacer.</p>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => showDeleteConfirm && handleDeleteList(showDeleteConfirm)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Create Cell Dialog (SPEC-31) */}
      <Dialog open={showCreateCellDialog} onClose={() => setShowCreateCellDialog(false)} title="Nueva celda de precio">
        <div className="dialog-form">
          <div className="form-field">
            <label>SKU</label>
            {loadingSkus ? (
              <Spinner />
            ) : (
              <Select
                value={cellForm.skuCode}
                onChange={(e) => setCellForm({ ...cellForm, skuCode: e.target.value })}
              >
                <option value="">Seleccionar SKU...</option>
                {skuOptions.map((sku) => (
                  <option key={sku.code} value={sku.code}>
                    {sku.code} - {sku.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="form-field">
            <label>Ancho máx (m)</label>
            <Input
              type="number"
              value={cellForm.maxWidthM}
              onChange={(e) => setCellForm({ ...cellForm, maxWidthM: Number(e.target.value) })}
              step="0.001"
              min={0}
            />
          </div>
          <div className="form-field">
            <label>Alto máx (m)</label>
            <Input
              type="number"
              value={cellForm.maxHeightM}
              onChange={(e) => setCellForm({ ...cellForm, maxHeightM: Number(e.target.value) })}
              step="0.001"
              min={0}
            />
          </div>
          <div className="form-field">
            <label>Precio unitario</label>
            <Input
              type="number"
              value={cellForm.unitPrice}
              onChange={(e) => setCellForm({ ...cellForm, unitPrice: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setShowCreateCellDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCell}
              disabled={!cellForm.skuCode || cellForm.maxWidthM <= 0 || cellForm.maxHeightM <= 0 || cellForm.unitPrice <= 0}
            >
              Crear
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Cell Dialog (SPEC-31) */}
      <Dialog open={showEditCellDialog} onClose={() => setShowEditCellDialog(false)} title="Editar celda de precio">
        <div className="dialog-form">
          <div className="form-field">
            <label>SKU</label>
            <Input value={cellForm.skuCode} disabled />
          </div>
          <div className="form-field">
            <label>Ancho máx (m)</label>
            <Input
              type="number"
              value={cellForm.maxWidthM}
              onChange={(e) => setCellForm({ ...cellForm, maxWidthM: Number(e.target.value) })}
              step="0.001"
              min={0}
            />
          </div>
          <div className="form-field">
            <label>Alto máx (m)</label>
            <Input
              type="number"
              value={cellForm.maxHeightM}
              onChange={(e) => setCellForm({ ...cellForm, maxHeightM: Number(e.target.value) })}
              step="0.001"
              min={0}
            />
          </div>
          <div className="form-field">
            <label>Precio unitario</label>
            <Input
              type="number"
              value={cellForm.unitPrice}
              onChange={(e) => setCellForm({ ...cellForm, unitPrice: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setShowEditCellDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateCell}
              disabled={cellForm.maxWidthM <= 0 || cellForm.maxHeightM <= 0 || cellForm.unitPrice <= 0}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
