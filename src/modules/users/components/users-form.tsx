"use client";

import { useEffect, useState } from "react";
import { Badge } from "../../../shared/ui/primitives/badge";
import { Button } from "../../../shared/ui/primitives/button";
import { DataTable } from "../../../shared/ui/primitives/data-table";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Input } from "../../../shared/ui/primitives/input";
import { Select } from "../../../shared/ui/primitives/select";
import { Spinner } from "../../../shared/ui/primitives/spinner";
import { TableSkeleton } from "../../../shared/ui/primitives/table-skeleton";

type UserRole = "superadmin" | "admin" | "operador";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchCode: string;
  isActive: boolean;
  createdAt: string;
};

type ActiveModal =
  | "create"
  | { type: "edit"; user: User }
  | { type: "reset"; userId: string }
  | { type: "toggle-status"; user: User }
  | null;

type UsersFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserRole: UserRole;
  currentUserId: string;
};

export function UsersForm({ accessToken, apiUrl, currentUserRole, currentUserId }: UsersFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Create form state
  const [createEmail, setCreateEmail] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("operador");
  const [createBranchCode, setCreateBranchCode] = useState("MAIN");
  const [createPassword, setCreatePassword] = useState("");

  // Edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("operador");
  const [editBranchCode, setEditBranchCode] = useState("");

  // Reset password state
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetCurrentPassword, setResetCurrentPassword] = useState("");

  const canManageUsers = currentUserRole === "superadmin" || currentUserRole === "admin";

  useEffect(() => {
    loadUsers();
  }, [accessToken]);

  async function loadUsers() {
    setLoadingMenu(true);
    try {
      const res = await fetch(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingMenu(false);
    }
  }

  function openCreate() {
    setCreateEmail("");
    setCreateFullName("");
    setCreateRole("operador");
    setCreateBranchCode("MAIN");
    setCreatePassword("");
    setErrorMsg("");
    setActiveModal("create");
  }

  function openEdit(user: User) {
    setEditFullName(user.fullName);
    setEditRole(user.role);
    setEditBranchCode(user.branchCode);
    setErrorMsg("");
    setActiveModal({ type: "edit", user });
  }

  function openReset(userId: string) {
    setResetCurrentPassword("");
    setResetNewPassword("");
    setErrorMsg("");
    setActiveModal({ type: "reset", userId });
  }

  function openToggleStatus(user: User) {
    setErrorMsg("");
    setActiveModal({ type: "toggle-status", user });
  }

  async function handleCreate() {
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          email: createEmail,
          fullName: createFullName,
          role: createRole,
          branchCode: createBranchCode,
          password: createPassword
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.message ?? "Error al crear usuario.");
        return;
      }
      setActiveModal(null);
      await loadUsers();
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleEdit() {
    if (activeModal === null || activeModal === "create" || activeModal.type !== "edit") return;
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/users/${activeModal.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fullName: editFullName, role: editRole, branchCode: editBranchCode })
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.message ?? "Error al editar usuario.");
        return;
      }
      setActiveModal(null);
      await loadUsers();
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleResetPassword() {
    if (activeModal === null || activeModal === "create" || activeModal.type !== "reset") return;
    setLoadingModal(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/users/${activeModal.userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ currentPassword: resetCurrentPassword, newPassword: resetNewPassword })
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.message ?? "Error al cambiar contraseña.");
        return;
      }
      setActiveModal(null);
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleToggleStatus() {
    if (activeModal === null || activeModal === "create" || activeModal.type !== "toggle-status") return;
    const user = activeModal.user;
    setLoadingActionId(user.id);
    setActiveModal(null);
    try {
      const res = await fetch(`${apiUrl}/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) {
        await loadUsers();
      }
    } finally {
      setLoadingActionId(null);
    }
  }

  const ROLE_LABELS: Record<UserRole, string> = {
    superadmin: "Superadmin",
    admin: "Admin",
    operador: "Operador"
  };

  const availableRoles: UserRole[] =
    currentUserRole === "superadmin" ? ["superadmin", "admin", "operador"] : ["admin", "operador"];

  return (
    <div className="module-panel">
      <div className="panel-toolbar">
        <div className="admin-module-title-group">
          <p className="admin-module-kicker">Acceso y permisos</p>
          <h3 className="panel-heading">Usuarios</h3>
          <p className="admin-module-summary">
            Controla roles, sucursales y credenciales operativas del equipo.
          </p>
        </div>
        {canManageUsers && (
          <Button variant="primary" onClick={openCreate}>
            Nuevo usuario
          </Button>
        )}
      </div>

      {loadingMenu ? (
        <TableSkeleton cols={6} rows={4} />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Sucursal</th>
              <th>Activo</th>
              {canManageUsers && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={canManageUsers ? 6 : 5} className="table-empty">
                  Sin usuarios
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={user.isActive ? "" : "table-row-dim"}>
                  <td>
                    <div className="table-cell-primary">
                      <strong>{user.fullName}</strong>
                      <div className="table-cell-meta">Creado {new Date(user.createdAt).toLocaleDateString("es-CL")}</div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <Badge variant="neutral">{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td>{user.branchCode}</td>
                  <td>
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  {canManageUsers && (
                    <td>
                      <div className="table-actions">
                        <Button variant="secondary" onClick={() => openEdit(user)}>
                          Editar
                        </Button>
                        <Button variant="secondary" onClick={() => openReset(user.id)}>
                          Contraseña
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={loadingActionId === user.id}
                          onClick={() => openToggleStatus(user)}
                        >
                          {loadingActionId === user.id ? (
                            <Spinner size="sm" />
                          ) : user.isActive ? (
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
        </DataTable>
      )}

      {/* Create modal */}
      <Dialog open={activeModal === "create"} onClose={() => setActiveModal(null)} title="Nuevo usuario">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="field">
            <span>Email</span>
            <Input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Nombre completo</span>
            <Input value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} />
          </label>
          <label className="field">
            <span>Rol</span>
            <Select value={createRole} onChange={(e) => setCreateRole(e.target.value as UserRole)}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span>Código sucursal</span>
            <Input value={createBranchCode} onChange={(e) => setCreateBranchCode(e.target.value)} />
          </label>
          <label className="field">
            <span>Contraseña inicial</span>
            <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
          </label>
          {errorMsg && <p className="status-note" style={{ color: "var(--color-danger, #c0392b)" }}>{errorMsg}</p>}
          <Button variant="primary" disabled={loadingModal} onClick={handleCreate}>
            {loadingModal ? <Spinner size="sm" /> : "Crear usuario"}
          </Button>
        </div>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={activeModal !== null && activeModal !== "create" && activeModal.type === "edit"}
        onClose={() => setActiveModal(null)}
        title="Editar usuario"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="field">
            <span>Nombre completo</span>
            <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
          </label>
          {currentUserRole !== "operador" && (
            <>
              <label className="field">
                <span>Rol</span>
                <Select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span>Código sucursal</span>
                <Input value={editBranchCode} onChange={(e) => setEditBranchCode(e.target.value)} />
              </label>
            </>
          )}
          {errorMsg && <p className="status-note" style={{ color: "var(--color-danger, #c0392b)" }}>{errorMsg}</p>}
          <Button variant="primary" disabled={loadingModal} onClick={handleEdit}>
            {loadingModal ? <Spinner size="sm" /> : "Guardar cambios"}
          </Button>
        </div>
      </Dialog>

      {/* Reset password modal */}
      <Dialog
        open={activeModal !== null && activeModal !== "create" && activeModal.type === "reset"}
        onClose={() => setActiveModal(null)}
        title="Cambiar contraseña"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {activeModal !== null && activeModal !== "create" && activeModal.type === "reset" &&
            activeModal.userId === currentUserId && (
            <label className="field">
              <span>Contraseña actual</span>
              <Input
                type="password"
                value={resetCurrentPassword}
                onChange={(e) => setResetCurrentPassword(e.target.value)}
              />
            </label>
          )}
          <label className="field">
            <span>Nueva contraseña</span>
            <Input
              type="password"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
            />
          </label>
          {errorMsg && <p className="status-note" style={{ color: "var(--color-danger, #c0392b)" }}>{errorMsg}</p>}
          <Button variant="primary" disabled={loadingModal} onClick={handleResetPassword}>
            {loadingModal ? <Spinner size="sm" /> : "Cambiar contraseña"}
          </Button>
        </div>
      </Dialog>

      {/* Toggle status confirmation modal */}
      <Dialog
        open={activeModal !== null && activeModal !== "create" && activeModal.type === "toggle-status"}
        onClose={() => setActiveModal(null)}
        title="Cambiar estado"
      >
        {activeModal !== null && activeModal !== "create" && activeModal.type === "toggle-status" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p className="panel-subtle">
              {activeModal.user.isActive
                ? `¿Desactivar a ${activeModal.user.fullName}? No podrá iniciar sesión.`
                : `¿Activar a ${activeModal.user.fullName}?`}
            </p>
            {errorMsg && <p className="status-note" style={{ color: "var(--color-danger, #c0392b)" }}>{errorMsg}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="primary" onClick={handleToggleStatus}>
                Confirmar
              </Button>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
