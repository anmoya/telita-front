"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Alert } from "../../../shared/ui/primitives/alert";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";

type UserRole = "superadmin" | "admin" | "operador";

type StorageLocation = {
  id: string;
  code: string;
  description?: string;
  isActive: boolean;
  scrapCountStored: number;
  canDelete: boolean;
  branchCode: string;
};

type Branch = {
  code: string;
  name: string;
};

type ActiveModal =
  | "create"
  | "bulk-create"
  | { type: "edit"; location: StorageLocation }
  | { type: "delete"; location: StorageLocation }
  | { type: "toggle-status"; location: StorageLocation }
  | null;

type BulkPreviewResult = {
  totalToGenerate: number;
  existingCount: number;
  newCount: number;
  sample: string[];
};

type StorageLocationsFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: UserRole;
};

export function StorageLocationsForm({ accessToken, apiUrl, currentUserRole }: StorageLocationsFormProps) {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const canManageLocations = currentUserRole === "superadmin" || currentUserRole === "admin";

  // Create form state
  const [createCode, setCreateCode] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createBranchCode, setCreateBranchCode] = useState("");

  // Edit form state
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Bulk create state
  const [bulkRowMode, setBulkRowMode] = useState<"LETTER" | "FIXED">("LETTER");
  const [bulkRowStart, setBulkRowStart] = useState("A");
  const [bulkRowEnd, setBulkRowEnd] = useState("E");
  const [bulkColStart, setBulkColStart] = useState("1");
  const [bulkColEnd, setBulkColEnd] = useState("10");
  const [bulkSeparator, setBulkSeparator] = useState("-");
  const [bulkDescTemplate, setBulkDescTemplate] = useState("");
  const [bulkStep, setBulkStep] = useState<"form" | "preview">("form");
  const [bulkPreview, setBulkPreview] = useState<BulkPreviewResult | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(null);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${apiUrl}/branches`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        if (data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].code);
        }
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchLocations = async () => {
    setLoadingMenu(true);
    try {
      const url = selectedBranch ? `${apiUrl}/storage-locations?branchCode=${selectedBranch}` : `${apiUrl}/storage-locations`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      } else {
        setErrorMsg("Error al cargar ubicaciones");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchLocations();
    }
  }, [selectedBranch, accessToken, apiUrl]);

  const resetCreateForm = () => {
    setCreateCode("");
    setCreateDescription("");
    setCreateBranchCode(selectedBranch);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setErrorMsg("");
    setActiveModal("create");
  };

  const handleCreate = async () => {
    if (!createCode.trim()) {
      setErrorMsg("El codigo es requerido");
      return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(createCode)) {
      setErrorMsg("Codigo: solo letras, numeros y guion");
      return;
    }
    if (createCode.length > 20) {
      setErrorMsg("Codigo: maximo 20 caracteres");
      return;
    }
    if (createDescription.length > 160) {
      setErrorMsg("Descripcion: maximo 160 caracteres");
      return;
    }

    setLoadingModal(true);
    try {
      const res = await fetch(`${apiUrl}/storage-locations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branchCode: createBranchCode || selectedBranch,
          code: createCode.toUpperCase(),
          description: createDescription || undefined,
        }),
      });

      if (res.ok) {
        setActiveModal(null);
        fetchLocations();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error al crear ubicacion");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingModal(false);
    }
  };

  const openEditModal = (location: StorageLocation) => {
    setEditCode(location.code);
    setEditDescription(location.description || "");
    setErrorMsg("");
    setActiveModal({ type: "edit", location });
  };

  const handleUpdate = async () => {
    const modal = activeModal;
    if (!modal || modal === null || modal === "create" || modal === "bulk-create" || modal.type === "delete" || modal.type === "toggle-status") {
      return;
    }
    const location = modal.location;

    if (editDescription.length > 160) {
      setErrorMsg("Descripcion: maximo 160 caracteres");
      return;
    }

    setLoadingModal(true);
    try {
      const res = await fetch(`${apiUrl}/storage-locations/${location.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: editCode !== location.code ? editCode.toUpperCase() : undefined,
          description: editDescription || undefined,
        }),
      });

      if (res.ok) {
        setActiveModal(null);
        fetchLocations();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error al actualizar ubicacion");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingModal(false);
    }
  };

  const openDeleteModal = (location: StorageLocation) => {
    setActiveModal({ type: "delete", location });
  };

  const handleDelete = async () => {
    const modal = activeModal;
    if (!modal || modal === null || modal === "create" || modal === "bulk-create" || modal.type === "edit" || modal.type === "toggle-status") {
      return;
    }
    const location = modal.location;

    setLoadingModal(true);
    try {
      const res = await fetch(`${apiUrl}/storage-locations/${location.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        setActiveModal(null);
        fetchLocations();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error al eliminar ubicacion");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingModal(false);
    }
  };

  const openToggleStatusModal = (location: StorageLocation) => {
    setActiveModal({ type: "toggle-status", location });
  };

  const handleToggleStatus = async () => {
    const modal = activeModal;
    if (!modal || modal === null || modal === "create" || modal === "bulk-create" || modal.type === "edit" || modal.type === "delete") {
      return;
    }
    const location = modal.location;

    setLoadingModal(true);
    try {
      const res = await fetch(`${apiUrl}/storage-locations/${location.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        setActiveModal(null);
        fetchLocations();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error al cambiar estado");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingModal(false);
    }
  };

  const openBulkCreateModal = () => {
    setBulkStep("form");
    setBulkPreview(null);
    setBulkResult(null);
    setErrorMsg("");
    setActiveModal("bulk-create");
  };

  const handleBulkPreview = async () => {
    setErrorMsg("");
    const colStart = parseInt(bulkColStart);
    const colEnd = parseInt(bulkColEnd);
    if (!bulkRowStart || !bulkRowEnd) {
      setErrorMsg("Fila inicio y fin son requeridas");
      return;
    }
    if (isNaN(colStart) || isNaN(colEnd) || colStart < 1 || colEnd < colStart) {
      setErrorMsg("Columnas invalidas: inicio debe ser >= 1 y fin >= inicio");
      return;
    }

    setLoadingModal(true);
    try {
      const res = await fetch(`${apiUrl}/storage-locations/bulk-preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branchCode: selectedBranch,
          rowMode: bulkRowMode,
          rowStart: bulkRowStart.toUpperCase(),
          rowEnd: bulkRowEnd.toUpperCase(),
          colStart,
          colEnd,
          separator: bulkSeparator || "-",
          descriptionTemplate: bulkDescTemplate || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBulkPreview(data);
        setBulkStep("preview");
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error al previsualizar");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleBulkCreate = async () => {
    setErrorMsg("");
    const colStart = parseInt(bulkColStart);
    const colEnd = parseInt(bulkColEnd);

    setLoadingModal(true);
    try {
      const res = await fetch(`${apiUrl}/storage-locations/bulk-create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branchCode: selectedBranch,
          rowMode: bulkRowMode,
          rowStart: bulkRowStart.toUpperCase(),
          rowEnd: bulkRowEnd.toUpperCase(),
          colStart,
          colEnd,
          separator: bulkSeparator || "-",
          descriptionTemplate: bulkDescTemplate || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBulkResult({ created: data.created, skipped: data.skipped });
        setActiveModal(null);
        fetchLocations();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error al crear ubicaciones");
      }
    } catch {
      setErrorMsg("Error de conexion");
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrorMsg("");
  };

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div className="module-filter">
          <label className="input-label">Sucursal</label>
          <Select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.code} value={branch.code}>
                {branch.name}
              </option>
            ))}
          </Select>
        </div>

        {canManageLocations && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={openBulkCreateModal}>
              Generador Masivo
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              + Nueva Ubicacion
            </Button>
          </div>
        )}
      </div>

      {bulkResult && (
        <Alert variant="success" onClose={() => setBulkResult(null)}>
          Generador masivo completado: <strong>{bulkResult.created}</strong> ubicaciones creadas
          {bulkResult.skipped > 0 && <>, {bulkResult.skipped} ya existian (omitidas)</>}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="error" onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      )}

      {loadingMenu ? (
        <TableSkeleton rows={5} cols={5} />
      ) : locations.length === 0 ? (
        <div className="empty-state">
          <p>No hay ubicaciones de almacenamiento</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <td className="cell-code">{location.code}</td>
                <td>{location.description || "-"}</td>
                <td>
                  <span className={`status-badge ${location.isActive ? "status-active" : "status-inactive"}`}>
                    {location.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>{location.scrapCountStored}</td>
                <td className="cell-actions">
                  {canManageLocations && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => openEditModal(location)}
                        disabled={loadingActionId === location.id}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openToggleStatusModal(location)}
                        disabled={loadingActionId === location.id}
                      >
                        {location.isActive ? "Desactivar" : "Activar"}
                      </Button>
                      {location.canDelete && (
                        <Button
                          variant="secondary"
                          className="btn-danger"
                          onClick={() => openDeleteModal(location)}
                          disabled={loadingActionId === location.id}
                        >
                          Eliminar
                        </Button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create Modal */}
      <Dialog open={activeModal === "create"} onClose={closeModal} title="Nueva Ubicacion">
        <div className="form-grid">
          <div className="form-field">
            <label className="input-label">Sucursal *</label>
            <Select
              value={createBranchCode || selectedBranch}
              onChange={(e) => setCreateBranchCode(e.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="form-field">
            <label className="input-label">Codigo *</label>
            <Input
              value={createCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateCode(e.target.value.toUpperCase())}
              placeholder="ej: A-01"
              maxLength={20}
            />
            <span className="input-hint">Max 20 caracteres, solo letras, numeros y guion</span>
          </div>

          <div className="form-field">
            <label className="input-label">Descripcion</label>
            <Input
              value={createDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateDescription(e.target.value)}
              placeholder="ej: Estanteria A"
              maxLength={160}
            />
            <span className="input-hint">Max 160 caracteres</span>
          </div>

          {errorMsg && <div className="form-error">{errorMsg}</div>}

          <div className="form-actions">
            <Button variant="secondary" onClick={closeModal} disabled={loadingModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={loadingModal}>
              {loadingModal ? <Spinner size="sm" /> : "Crear"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={activeModal !== null && typeof activeModal === "object" && activeModal.type === "edit"}
        onClose={closeModal}
        title="Editar Ubicacion"
      >
        {activeModal && typeof activeModal === "object" && activeModal.type === "edit" && (
          <div className="form-grid">
            <div className="form-field">
              <label className="input-label">Codigo</label>
              <Input
                value={editCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCode(e.target.value.toUpperCase())}
                placeholder="Codigo"
                maxLength={20}
              />
              <span className="input-hint">
                {activeModal.location.scrapCountStored > 0
                  ? "No se puede cambiar: tiene stock activo"
                  : "Max 20 caracteres, solo letras, numeros y guion"}
              </span>
            </div>

            <div className="form-field">
              <label className="input-label">Descripcion</label>
              <Input
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDescription(e.target.value)}
                placeholder="Descripcion"
                maxLength={160}
              />
              <span className="input-hint">Max 160 caracteres</span>
            </div>

            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-actions">
              <Button variant="secondary" onClick={closeModal} disabled={loadingModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                disabled={loadingModal || activeModal.location.scrapCountStored > 0}
              >
                {loadingModal ? <Spinner size="sm" /> : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={activeModal !== null && typeof activeModal === "object" && activeModal.type === "delete"}
        onClose={closeModal}
        title="Eliminar Ubicacion"
      >
        {activeModal && typeof activeModal === "object" && activeModal.type === "delete" && (
          <div className="form-grid">
            <p>
              Esta seguro que desea eliminar la ubicacion <strong>{activeModal.location.code}</strong>?
            </p>
            {activeModal.location.scrapCountStored > 0 && (
              <div className="form-error">
                No se puede eliminar: tiene {activeModal.location.scrapCountStored} piezas en stock
              </div>
            )}

            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-actions">
              <Button variant="secondary" onClick={closeModal} disabled={loadingModal}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                className="btn-danger"
                onClick={handleDelete}
                disabled={loadingModal || activeModal.location.scrapCountStored > 0}
              >
                {loadingModal ? <Spinner size="sm" /> : "Eliminar"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Bulk Create Modal */}
      <Dialog
        open={activeModal === "bulk-create"}
        onClose={closeModal}
        title="Generador Masivo de Ubicaciones"
      >
        {bulkStep === "form" && (
          <div className="form-grid">
            <div className="form-field">
              <label className="input-label">Modo de fila</label>
              <Select
                value={bulkRowMode}
                onChange={(e) => setBulkRowMode(e.target.value as "LETTER" | "FIXED")}
              >
                <option value="LETTER">Letras (A-Z)</option>
                <option value="FIXED">Texto fijo</option>
              </Select>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="input-label">Fila inicio *</label>
                <Input
                  value={bulkRowStart}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBulkRowStart(e.target.value.toUpperCase())
                  }
                  placeholder={bulkRowMode === "LETTER" ? "A" : "EST1"}
                  maxLength={bulkRowMode === "LETTER" ? 1 : 10}
                />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="input-label">Fila fin *</label>
                <Input
                  value={bulkRowEnd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBulkRowEnd(e.target.value.toUpperCase())
                  }
                  placeholder={bulkRowMode === "LETTER" ? "E" : "EST5"}
                  maxLength={bulkRowMode === "LETTER" ? 1 : 10}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="input-label">Columna inicio *</label>
                <Input
                  value={bulkColStart}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkColStart(e.target.value)}
                  placeholder="1"
                  type="number"
                />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="input-label">Columna fin *</label>
                <Input
                  value={bulkColEnd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkColEnd(e.target.value)}
                  placeholder="10"
                  type="number"
                />
              </div>
              <div className="form-field" style={{ flex: 0.5 }}>
                <label className="input-label">Separador</label>
                <Input
                  value={bulkSeparator}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkSeparator(e.target.value)}
                  placeholder="-"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="input-label">Plantilla de descripcion</label>
              <Input
                value={bulkDescTemplate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkDescTemplate(e.target.value)}
                placeholder="ej: Estanteria {row} posicion {col}"
                maxLength={160}
              />
              <span className="input-hint">Use {"{row}"} y {"{col}"} como variables</span>
            </div>

            <div className="form-field">
              <span className="input-hint">
                {bulkRowMode === "LETTER"
                  ? "Max 26 filas (A-Z), max 500 columnas, max 2000 codigos totales"
                  : "Max 500 columnas, max 2000 codigos totales"}
              </span>
            </div>

            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-actions">
              <Button variant="secondary" onClick={closeModal} disabled={loadingModal}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleBulkPreview} disabled={loadingModal}>
                {loadingModal ? <Spinner size="sm" /> : "Previsualizar"}
              </Button>
            </div>
          </div>
        )}

        {bulkStep === "preview" && bulkPreview && (
          <div className="form-grid">
            <div style={{ padding: "0.75rem", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "4px" }}>
              <p><strong>Resumen:</strong></p>
              <p>Total a generar: <strong>{bulkPreview.totalToGenerate}</strong></p>
              <p>Ya existentes (se omitiran): <strong>{bulkPreview.existingCount}</strong></p>
              <p>Nuevas a crear: <strong>{bulkPreview.newCount}</strong></p>
            </div>

            <div className="form-field">
              <label className="input-label">Muestra de codigos nuevos:</label>
              <div style={{ fontFamily: "monospace", fontSize: "0.875rem", padding: "0.5rem", backgroundColor: "#f8f8f8", border: "1px solid #ddd", borderRadius: "4px", maxHeight: "120px", overflowY: "auto" }}>
                {bulkPreview.sample.join(", ")}
                {bulkPreview.newCount > bulkPreview.sample.length && (
                  <span style={{ color: "#666" }}> ... y {bulkPreview.newCount - bulkPreview.sample.length} mas</span>
                )}
              </div>
            </div>

            {bulkPreview.newCount === 0 && (
              <div className="form-error">Todas las ubicaciones ya existen. Nada que crear.</div>
            )}

            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-actions">
              <Button variant="secondary" onClick={() => setBulkStep("form")} disabled={loadingModal}>
                Volver
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkCreate}
                disabled={loadingModal || bulkPreview.newCount === 0}
              >
                {loadingModal ? <Spinner size="sm" /> : `Crear ${bulkPreview.newCount} ubicaciones`}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Toggle Status Modal */}
      <Dialog
        open={activeModal !== null && typeof activeModal === "object" && activeModal.type === "toggle-status"}
        onClose={closeModal}
        title={
          activeModal && typeof activeModal === "object" && activeModal.type === "toggle-status"
            ? activeModal.location.isActive
              ? "Desactivar Ubicacion"
              : "Activar Ubicacion"
            : "Cambiar Estado"
        }
      >
        {activeModal && typeof activeModal === "object" && activeModal.type === "toggle-status" && (
          <div className="form-grid">
            <p>
              Esta seguro que desea {activeModal.location.isActive ? "desactivar" : "activar"} la ubicacion{" "}
              <strong>{activeModal.location.code}</strong>?
            </p>

            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-actions">
              <Button variant="secondary" onClick={closeModal} disabled={loadingModal}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleToggleStatus} disabled={loadingModal}>
                {loadingModal ? <Spinner size="sm" /> : activeModal.location.isActive ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
