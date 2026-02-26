"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";

type UserRole = "superadmin" | "admin" | "operador";

type Sku = {
  id: string;
  code: string;
  name: string;
  description?: string;
  lengthValue: number;
  lengthUnitCode: string;
  widthValue: number;
  widthUnitCode: string;
  thicknessValue: number;
  thicknessUnitCode: string;
  weightValue: number;
  weightUnitCode: string;
  isActive: boolean;
};

type Unit = {
  id: number;
  code: string;
  name: string;
};

type Units = {
  lengths: Unit[];
  weights: Unit[];
};

type ActiveModal = "create" | { type: "edit"; sku: Sku } | null;

type CatalogFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: UserRole;
};

export function CatalogForm({ accessToken, apiUrl, currentUserRole }: CatalogFormProps) {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [units, setUnits] = useState<Units | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Create form state
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLengthValue, setCreateLengthValue] = useState("1");
  const [createLengthUnitCode, setCreateLengthUnitCode] = useState("m");
  const [createWidthValue, setCreateWidthValue] = useState("1");
  const [createWidthUnitCode, setCreateWidthUnitCode] = useState("m");
  const [createThicknessValue, setCreateThicknessValue] = useState("0.1");
  const [createThicknessUnitCode, setCreateThicknessUnitCode] = useState("mm");
  const [createWeightValue, setCreateWeightValue] = useState("1");
  const [createWeightUnitCode, setCreateWeightUnitCode] = useState("kg");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLengthValue, setEditLengthValue] = useState("1");
  const [editLengthUnitCode, setEditLengthUnitCode] = useState("m");
  const [editWidthValue, setEditWidthValue] = useState("1");
  const [editWidthUnitCode, setEditWidthUnitCode] = useState("m");
  const [editThicknessValue, setEditThicknessValue] = useState("0.1");
  const [editThicknessUnitCode, setEditThicknessUnitCode] = useState("mm");
  const [editWeightValue, setEditWeightValue] = useState("1");
  const [editWeightUnitCode, setEditWeightUnitCode] = useState("kg");

  const canManageSkus = currentUserRole === "superadmin" || currentUserRole === "admin";

  useEffect(() => {
    loadSkus();
    loadUnits();
  }, [accessToken]); // eslint-disable-line

  async function loadSkus() {
    setLoadingMenu(true);
    try {
      const res = await fetch(`${apiUrl}/catalog/all-skus?branchCode=MAIN`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSkus(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadUnits() {
    try {
      const res = await fetch(`${apiUrl}/catalog/units`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnits(data);
        if (data.lengths?.[0]) setCreateLengthUnitCode(data.lengths[0].code);
        if (data.lengths?.[0]) setCreateWidthUnitCode(data.lengths[0].code);
        if (data.lengths?.[0]) setCreateThicknessUnitCode(data.lengths[0].code);
        if (data.weights?.[0]) setCreateWeightUnitCode(data.weights[0].code);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  function openCreate() {
    setCreateCode("");
    setCreateName("");
    setCreateDescription("");
    setCreateLengthValue("1");
    setCreateWidthValue("1");
    setCreateThicknessValue("0.1");
    setCreateWeightValue("1");
    setErrorMsg("");
    setActiveModal("create");
  }

  function openEdit(sku: Sku) {
    setEditName(sku.name);
    setEditDescription(sku.description ?? "");
    setEditLengthValue(String(sku.lengthValue));
    setEditLengthUnitCode(sku.lengthUnitCode);
    setEditWidthValue(String(sku.widthValue));
    setEditWidthUnitCode(sku.widthUnitCode);
    setEditThicknessValue(String(sku.thicknessValue));
    setEditThicknessUnitCode(sku.thicknessUnitCode);
    setEditWeightValue(String(sku.weightValue));
    setEditWeightUnitCode(sku.weightUnitCode);
    setErrorMsg("");
    setActiveModal({ type: "edit", sku });
  }

  async function handleCreate() {
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/catalog/skus`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          branchCode: "MAIN",
          code: createCode,
          name: createName,
          description: createDescription || undefined,
          lengthValue: parseFloat(createLengthValue),
          lengthUnitCode: createLengthUnitCode,
          widthValue: parseFloat(createWidthValue),
          widthUnitCode: createWidthUnitCode,
          thicknessValue: parseFloat(createThicknessValue),
          thicknessUnitCode: createThicknessUnitCode,
          weightValue: parseFloat(createWeightValue),
          weightUnitCode: createWeightUnitCode
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.message ?? "Error al crear SKU.");
        return;
      }
      setActiveModal(null);
      await loadSkus();
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleEdit() {
    if (activeModal === null || activeModal === "create" || activeModal.type !== "edit") return;
    const sku = activeModal.sku;
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/catalog/skus/${sku.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: editName,
          description: editDescription || undefined,
          lengthValue: parseFloat(editLengthValue),
          lengthUnitCode: editLengthUnitCode,
          widthValue: parseFloat(editWidthValue),
          widthUnitCode: editWidthUnitCode,
          thicknessValue: parseFloat(editThicknessValue),
          thicknessUnitCode: editThicknessUnitCode,
          weightValue: parseFloat(editWeightValue),
          weightUnitCode: editWeightUnitCode
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.message ?? "Error al editar SKU.");
        return;
      }
      setActiveModal(null);
      await loadSkus();
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleToggleStatus(sku: Sku) {
    setLoadingActionId(sku.id);
    try {
      const res = await fetch(`${apiUrl}/catalog/skus/${sku.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ isActive: !sku.isActive })
      });
      if (res.ok) {
        await loadSkus();
      }
    } finally {
      setLoadingActionId(null);
    }
  }

  return (
    <div className="module-panel">
      <div className="panel-toolbar">
        <h3 className="panel-heading">Catálogo de Telas</h3>
        {canManageSkus && (
          <Button variant="primary" onClick={openCreate}>
            Nuevo SKU
          </Button>
        )}
      </div>

      {loadingMenu ? (
        <TableSkeleton cols={7} rows={4} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ancho (m)</th>
              <th>Largo (m)</th>
              <th>Activo</th>
              {canManageSkus && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {skus.length === 0 ? (
              <tr>
                <td colSpan={canManageSkus ? 6 : 5} className="table-empty">
                  Sin SKUs
                </td>
              </tr>
            ) : (
              skus.map((sku) => (
                <tr key={sku.id} style={{ opacity: sku.isActive ? 1 : 0.5 }}>
                  <td>{sku.code}</td>
                  <td>{sku.name}</td>
                  <td>{Number(sku.widthValue).toFixed(3)}</td>
                  <td>{Number(sku.lengthValue).toFixed(3)}</td>
                  <td>{sku.isActive ? "Sí" : "No"}</td>
                  {canManageSkus && (
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Button variant="secondary" onClick={() => openEdit(sku)}>
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={loadingActionId === sku.id}
                          onClick={() => handleToggleStatus(sku)}
                        >
                          {loadingActionId === sku.id ? (
                            <Spinner size="sm" />
                          ) : sku.isActive ? (
                            "Desactivar"
                          ) : (
                            "Activar"
                          )}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Create modal */}
      <Dialog open={activeModal === "create"} onClose={() => setActiveModal(null)} title="Nuevo SKU">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="field">
            <span>Código</span>
            <Input value={createCode} onChange={(e) => setCreateCode(e.target.value)} />
          </label>
          <label className="field">
            <span>Nombre</span>
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </label>
          <label className="field">
            <span>Descripción</span>
            <Input value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              <span>Largo</span>
              <Input type="number" step="0.001" value={createLengthValue} onChange={(e) => setCreateLengthValue(e.target.value)} />
            </label>
            <label className="field">
              <span>Unidad</span>
              <select value={createLengthUnitCode} onChange={(e) => setCreateLengthUnitCode(e.target.value)}>
                {units?.lengths.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              <span>Ancho</span>
              <Input type="number" step="0.001" value={createWidthValue} onChange={(e) => setCreateWidthValue(e.target.value)} />
            </label>
            <label className="field">
              <span>Unidad</span>
              <select value={createWidthUnitCode} onChange={(e) => setCreateWidthUnitCode(e.target.value)}>
                {units?.lengths.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              <span>Espesor</span>
              <Input type="number" step="0.001" value={createThicknessValue} onChange={(e) => setCreateThicknessValue(e.target.value)} />
            </label>
            <label className="field">
              <span>Unidad</span>
              <select value={createThicknessUnitCode} onChange={(e) => setCreateThicknessUnitCode(e.target.value)}>
                {units?.lengths.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              <span>Peso</span>
              <Input type="number" step="0.001" value={createWeightValue} onChange={(e) => setCreateWeightValue(e.target.value)} />
            </label>
            <label className="field">
              <span>Unidad</span>
              <select value={createWeightUnitCode} onChange={(e) => setCreateWeightUnitCode(e.target.value)}>
                {units?.weights.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {errorMsg && <p className="status-note" style={{ color: "var(--color-danger, #c0392b)" }}>{errorMsg}</p>}
          <Button variant="primary" disabled={loadingModal} onClick={handleCreate}>
            {loadingModal ? <Spinner size="sm" /> : "Crear SKU"}
          </Button>
        </div>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={activeModal !== null && activeModal !== "create" && activeModal.type === "edit"}
        onClose={() => setActiveModal(null)}
        title="Editar SKU"
      >
        {activeModal !== null && activeModal !== "create" && activeModal.type === "edit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p className="panel-subtle">
              <strong>Código:</strong> {activeModal.sku.code}
            </p>

            <label className="field">
              <span>Nombre</span>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <label className="field">
              <span>Descripción</span>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>Largo</span>
                <Input type="number" step="0.001" value={editLengthValue} onChange={(e) => setEditLengthValue(e.target.value)} />
              </label>
              <label className="field">
                <span>Unidad</span>
                <select value={editLengthUnitCode} onChange={(e) => setEditLengthUnitCode(e.target.value)}>
                  {units?.lengths.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>Ancho</span>
                <Input type="number" step="0.001" value={editWidthValue} onChange={(e) => setEditWidthValue(e.target.value)} />
              </label>
              <label className="field">
                <span>Unidad</span>
                <select value={editWidthUnitCode} onChange={(e) => setEditWidthUnitCode(e.target.value)}>
                  {units?.lengths.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>Espesor</span>
                <Input type="number" step="0.001" value={editThicknessValue} onChange={(e) => setEditThicknessValue(e.target.value)} />
              </label>
              <label className="field">
                <span>Unidad</span>
                <select value={editThicknessUnitCode} onChange={(e) => setEditThicknessUnitCode(e.target.value)}>
                  {units?.lengths.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>Peso</span>
                <Input type="number" step="0.001" value={editWeightValue} onChange={(e) => setEditWeightValue(e.target.value)} />
              </label>
              <label className="field">
                <span>Unidad</span>
                <select value={editWeightUnitCode} onChange={(e) => setEditWeightUnitCode(e.target.value)}>
                  {units?.weights.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {errorMsg && <p className="status-note" style={{ color: "var(--color-danger, #c0392b)" }}>{errorMsg}</p>}
            <Button variant="primary" disabled={loadingModal} onClick={handleEdit}>
              {loadingModal ? <Spinner size="sm" /> : "Guardar cambios"}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
