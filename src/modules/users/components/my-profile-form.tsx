"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";
import { Spinner } from "../../../shared/ui/primitives/spinner";

type MyProfileFormProps = {
  accessToken: string;
  apiUrl: string;
  currentUserId: string;
  onStartTour?: () => void;
};

export function MyProfileForm({ accessToken, apiUrl, currentUserId, onStartTour }: MyProfileFormProps) {
  const [fullName, setFullName] = useState("");
  const [originalFullName, setOriginalFullName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    loadProfile();
  }, [currentUserId]);

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const res = await fetch(`${apiUrl}/users/${currentUserId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName ?? "");
        setOriginalFullName(data.fullName ?? "");
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await fetch(`${apiUrl}/users/${currentUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fullName })
      });
      const body = await res.json();
      if (!res.ok) {
        setProfileMsg(body.message ?? "Error al guardar.");
        return;
      }
      setOriginalFullName(fullName);
      setProfileMsg("Nombre actualizado.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`${apiUrl}/users/${currentUserId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const body = await res.json();
      if (!res.ok) {
        setPasswordMsg(body.message ?? "Error al cambiar contraseña.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg("Contraseña actualizada.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="module-panel">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="module-panel">
      <h3 className="panel-heading">Mi perfil</h3>

      <section style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h4 className="panel-subtle">Datos personales</h4>
        <label className="field">
          <span>Nombre completo</span>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        {profileMsg && <p className="status-note">{profileMsg}</p>}
        <Button
          variant="primary"
          disabled={savingProfile || fullName === originalFullName}
          onClick={handleSaveProfile}
        >
          {savingProfile ? <Spinner size="sm" /> : "Guardar nombre"}
        </Button>
        {onStartTour && (
          <Button variant="secondary" onClick={onStartTour}>
            Ver tutorial
          </Button>
        )}
      </section>

      <hr style={{ margin: "24px 0", borderColor: "var(--color-border, #e5e7eb)" }} />

      <section style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h4 className="panel-subtle">Cambiar contraseña</h4>
        <label className="field">
          <span>Contraseña actual</span>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </label>
        <label className="field">
          <span>Nueva contraseña</span>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <label className="field">
          <span>Confirmar nueva contraseña</span>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        {passwordMsg && <p className="status-note">{passwordMsg}</p>}
        <Button variant="primary" disabled={savingPassword} onClick={handleChangePassword}>
          {savingPassword ? <Spinner size="sm" /> : "Cambiar contraseña"}
        </Button>
      </section>
    </div>
  );
}
