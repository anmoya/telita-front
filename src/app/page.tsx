"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../shared/ui/primitives/button";
import { LoginScreen } from "../modules/auth/components/login-screen";
import { QuoteForm } from "../modules/pricing/components/quote-form";

type MenuKey = "dashboard" | "pricing" | "sales" | "cuts" | "scraps" | "labels" | "audit" | "settings";

type TokenInfo = {
  email: string;
  role: "superadmin" | "admin" | "operador";
};

const MENU_ITEMS: Array<{ key: MenuKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pricing", label: "Cotizacion" },
  { key: "sales", label: "Ventas" },
  { key: "cuts", label: "Cortes" },
  { key: "scraps", label: "Retazos" },
  { key: "labels", label: "Etiquetas" },
  { key: "audit", label: "Auditoria" },
  { key: "settings", label: "Configuracion" }
];

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_TELITA_API_URL ?? "http://localhost:3001/v1";
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");

  useEffect(() => {
    const token = window.localStorage.getItem("telita_access_token");
    if (token) setAccessToken(token);
    setIsReady(true);
  }, []);

  const tokenInfo = useMemo(() => (accessToken ? decodeToken(accessToken) : null), [accessToken]);

  function handleLogout() {
    window.localStorage.removeItem("telita_access_token");
    setAccessToken(null);
    setActiveMenu("dashboard");
  }

  if (!isReady) return <main className="auth-shell" />;

  if (!accessToken) {
    return <LoginScreen apiUrl={apiUrl} onLoginSuccess={setAccessToken} />;
  }

  return (
    <main className="app-shell-2026">
      <aside className="app-sidebar-2026">
        <div className="brand-block">
          <div className="brand-logo">T</div>
          <div>
            <p className="sidebar-kicker">Telita</p>
            <h1 className="sidebar-title">Operaciones</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeMenu === item.key ? "nav-item-active" : ""}`.trim()}
              onClick={() => setActiveMenu(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="app-content-2026">
        <header className="topbar-2026">
          <div>
            <p className="topbar-kicker">App 2026</p>
            <h2 className="topbar-title">{MENU_ITEMS.find((item) => item.key === activeMenu)?.label}</h2>
          </div>

          <div className="topbar-user">
            <div>
              <p className="user-email">{tokenInfo?.email ?? "usuario"}</p>
              <p className="user-role">{tokenInfo?.role ?? "rol"}</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Cerrar sesion
            </Button>
          </div>
        </header>

        <QuoteForm accessToken={accessToken} activeMenu={activeMenu} onNavigate={setActiveMenu} />
      </section>
    </main>
  );
}

function decodeToken(token: string): TokenInfo | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"))) as {
      email: string;
      role: TokenInfo["role"];
    };
    return {
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}
