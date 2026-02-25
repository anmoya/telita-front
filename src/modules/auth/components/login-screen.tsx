"use client";

import { useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Input } from "../../../shared/ui/primitives/input";

type LoginScreenProps = {
  apiUrl: string;
  onLoginSuccess: (accessToken: string) => void;
};

export function LoginScreen({ apiUrl, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("admin@telita.local");
  const [password, setPassword] = useState("dev_only_change_me");
  const [status, setStatus] = useState("");

  async function handleLogin() {
    setStatus("Ingresando...");
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const body = await response.json();
    if (!response.ok) {
      setStatus(body.message ?? "Credenciales invalidas");
      return;
    }

    window.localStorage.setItem("telita_access_token", body.accessToken);
    onLoginSuccess(body.accessToken);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="sidebar-kicker">Telita</p>
        <h1 className="sidebar-title">Iniciar Sesion</h1>
        <p className="panel-subtle">Accede para operar cotizaciones, retazos y etiquetas.</p>

        <label className="field">
          <span>Email</span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="field">
          <span>Password</span>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <p className="status-note">{status}</p>

        <Button onClick={handleLogin}>Entrar</Button>
      </section>
    </main>
  );
}
