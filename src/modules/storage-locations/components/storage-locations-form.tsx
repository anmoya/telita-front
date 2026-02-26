"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
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
  | { type: "edit"; location: StorageLocation }
  | { type: "delete"; location: StorageLocation }
  | { type: "toggle-status"; location: StorageLocation }
  | null;

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
    if (!modal || modal === null || modal === "create" || modal.type === "delete" || modal.type === "toggle-status") {
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
    if (!modal || modal === null || modal === "create" || modal.type === "edit" || modal.type === "toggle-status") {
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
    if (!modal || modal === null || modal === "create" || modal.type === "edit" || modal.type === "delete") {
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

  const closeModal = () => {
    setActiveModal(null);
    setErrorMsg("");
  };

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div className="module-filter">
          <label className="input-label">Sucursal</label>
          <select
            className="t-input"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.code} value={branch.code}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {canManageLocations && (
          <Button variant="primary" onClick={openCreateModal}>
            + Nueva Ubicacion
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          {errorMsg}
          <button className="error-close" onClick={() => setErrorMsg("")}>
            x
          </button>
        </div>
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
            <select
              className="t-input"
              value={createBranchCode || selectedBranch}
              onChange={(e) => setCreateBranchCode(e.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.name}
                </option>
              ))}
            </select>
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
