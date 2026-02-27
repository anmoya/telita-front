"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Alert } from "../../../shared/ui/primitives/alert";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";

type UserRole = "superadmin" | "admin" | "operador";

type Category = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

type ActiveModal = "create" | { type: "edit"; category: Category } | null;

type QuoteItemCategoriesFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: UserRole;
};

export function QuoteItemCategoriesForm({ accessToken, apiUrl, currentUserRole }: QuoteItemCategoriesFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [createName, setCreateName] = useState("");
  const [editName, setEditName] = useState("");

  const canManage = currentUserRole === "superadmin" || currentUserRole === "admin";

  useEffect(() => {
    loadCategories();
  }, [accessToken]);

  async function loadCategories() {
    setLoadingMenu(true);
    try {
      const res = await fetch(`${apiUrl}/quote-item-categories?branchCode=MAIN`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleCreate() {
    if (!createName.trim()) return;
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/quote-item-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ branchCode: "MAIN", name: createName.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg((err as { message?: string }).message ?? "Error al crear categoria");
        return;
      }
      setActiveModal(null);
      setCreateName("");
      await loadCategories();
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleEditSave() {
    if (activeModal === null || activeModal === "create") return;
    if (!editName.trim()) return;
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/quote-item-categories/${activeModal.category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name: editName.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg((err as { message?: string }).message ?? "Error al editar categoria");
        return;
      }
      setActiveModal(null);
      await loadCategories();
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleToggleStatus(category: Category) {
    setLoadingActionId(category.id);
    try {
      const res = await fetch(`${apiUrl}/quote-item-categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ isActive: !category.isActive })
      });
      if (res.ok) {
        await loadCategories();
      }
    } finally {
      setLoadingActionId(null);
    }
  }

  function openEdit(category: Category) {
    setEditName(category.name);
    setErrorMsg("");
    setActiveModal({ type: "edit", category });
  }

  function openCreate() {
    setCreateName("");
    setErrorMsg("");
    setActiveModal("create");
  }

  return (
    <div className="form-section">
      <div className="section-header">
        <h3 className="section-title">Categorias de cotizacion</h3>
        {canManage && (
          <Button variant="primary" onClick={openCreate}>
            + Nueva categoria
          </Button>
        )}
      </div>

      {loadingMenu ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              {canManage && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={canManage ? 3 : 2} style={{ textAlign: "center", color: "var(--gray-500)" }}>
                  No hay categorias registradas
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id} style={{ opacity: cat.isActive ? 1 : 0.5 }}>
                <td>{cat.name}</td>
                <td>
                  <span className={`status-badge ${cat.isActive ? "status-active" : "status-inactive"}`}>
                    {cat.isActive ? "Activa" : "Inactiva"}
                  </span>
                </td>
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <Button variant="secondary" onClick={() => openEdit(cat)}>
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleToggleStatus(cat)}
                        disabled={loadingActionId === cat.id}
                      >
                        {loadingActionId === cat.id ? (
                          <Spinner size="sm" />
                        ) : cat.isActive ? (
                          "Desactivar"
                        ) : (
                          "Activar"
                        )}
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal: crear */}
      {activeModal === "create" && (
        <Dialog open={activeModal === "create"} onClose={() => setActiveModal(null)} title="Nueva categoria">
          {errorMsg ? <Alert variant="error" onClose={() => setErrorMsg("")}>{errorMsg}</Alert> : null}
          <label className="field">
            <span>Nombre</span>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ej: LIVING"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </label>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={loadingModal || !createName.trim()}>
              {loadingModal ? <Spinner size="sm" /> : "Crear"}
            </Button>
          </div>
        </Dialog>
      )}

      {/* Modal: editar */}
      {activeModal !== null && activeModal !== "create" && (
        <Dialog open={true} onClose={() => setActiveModal(null)} title="Editar categoria">
          {errorMsg ? <Alert variant="error" onClose={() => setErrorMsg("")}>{errorMsg}</Alert> : null}
          <label className="field">
            <span>Nombre</span>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ej: PIEZA"
              onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
            />
          </label>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleEditSave} disabled={loadingModal || !editName.trim()}>
              {loadingModal ? <Spinner size="sm" /> : "Guardar"}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
