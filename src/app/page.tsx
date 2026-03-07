"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../shared/ui/primitives/button";
import { LoginScreen } from "../modules/auth/components/login-screen";
import { QuoteForm } from "../modules/pricing/components/quote-form";
import { UsersForm } from "../modules/users/components/users-form";
import { MyProfileForm } from "../modules/users/components/my-profile-form";
import { CatalogForm } from "../modules/catalog/components/catalog-form";
import { PriceListForm } from "../modules/pricing/components/price-list-form";
import { StorageLocationsForm } from "../modules/storage-locations/components/storage-locations-form";
import { QuoteItemCategoriesForm } from "../modules/quote-item-categories/components/quote-item-categories-form";
import { QuoteBatchesForm } from "../modules/quote-batches/components/quote-batches-form";
import { CustomersForm } from "../modules/customers/components/customers-form";
import { WelcomeModal } from "../modules/onboarding/components/welcome-modal";
import { startTour } from "../modules/onboarding/components/onboarding-tour";

type MenuKey =
  | "dashboard"
  | "pricing"
  | "sales"
  | "cuts"
  | "scraps"
  | "labels"
  | "audit"
  | "settings"
  | "usuarios"
  | "catalogo"
  | "perfil"
  | "listas-precios"
  | "ubicaciones"
  | "categorias-cotizacion"
  | "historial-cotizaciones"
  | "clientes";

type TokenInfo = {
  sub: string;
  email: string;
  role: "superadmin" | "admin" | "operador";
};

const ALL_MENU_ITEMS: Array<{ key: MenuKey; label: string; roles?: Array<"superadmin" | "admin" | "operador"> }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pricing", label: "Cotizacion" },
  { key: "sales", label: "Ventas" },
  { key: "cuts", label: "Cortes" },
  { key: "scraps", label: "Retazos" },
  { key: "labels", label: "Etiquetas" },
  { key: "audit", label: "Auditoria" },
  { key: "settings", label: "Configuracion" },
  { key: "catalogo", label: "Catalogo", roles: ["superadmin", "admin"] },
  { key: "listas-precios", label: "Listas Precios", roles: ["superadmin", "admin"] },
  { key: "ubicaciones", label: "Ubicaciones", roles: ["superadmin", "admin"] },
  { key: "categorias-cotizacion", label: "Cat. Cotizacion", roles: ["superadmin", "admin"] },
  { key: "historial-cotizaciones", label: "Historial Cotiz." },
  { key: "clientes", label: "Clientes", roles: ["superadmin", "admin"] },
  { key: "usuarios", label: "Usuarios", roles: ["superadmin", "admin"] },
  { key: "perfil", label: "Mi perfil" }
];

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_TELITA_API_URL ?? "http://localhost:3001/v1";
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("telita_access_token");
    if (token) {
      setAccessToken(token);
      const onboardingDone = window.localStorage.getItem("telita_onboarding_completed");
      if (!onboardingDone) setShowWelcome(true);
    }
    setIsReady(true);
  }, []);

  const tokenInfo = useMemo(() => (accessToken ? decodeToken(accessToken) : null), [accessToken]);

  const menuItems = useMemo(
    () =>
      ALL_MENU_ITEMS.filter((item) => {
        if (!item.roles) return true;
        return tokenInfo ? item.roles.includes(tokenInfo.role) : false;
      }),
    [tokenInfo]
  );

  function handleLoginSuccess(token: string, onboardingCompletedAt: string | null) {
    setAccessToken(token);
    // El servidor manda la verdad: si onboardingCompletedAt es null, el usuario nunca completó el tour
    // No confiamos en localStorage aquí porque es compartido entre usuarios del mismo navegador
    if (!onboardingCompletedAt) {
      window.localStorage.removeItem("telita_onboarding_completed");
      setShowWelcome(true);
    } else {
      window.localStorage.setItem("telita_onboarding_completed", "true");
    }
  }

  async function markOnboardingDone() {
    const info = accessToken ? decodeToken(accessToken) : null;
    if (!info) return;
    try {
      await fetch(`${apiUrl}/users/${info.sub}/onboarding-complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch {
      // best-effort
    }
    window.localStorage.setItem("telita_onboarding_completed", "true");
  }

  function handleStartTour() {
    setShowWelcome(false);
    startTour((menu) => setActiveMenu(menu as MenuKey), () => { void markOnboardingDone(); });
  }

  function handleDismissWelcome() {
    setShowWelcome(false);
  }

  function handleLogout() {
    window.localStorage.removeItem("telita_access_token");
    setAccessToken(null);
    setActiveMenu("dashboard");
  }

  if (!isReady) return <main className="auth-shell" />;

  if (!accessToken) {
    return <LoginScreen apiUrl={apiUrl} onLoginSuccess={handleLoginSuccess} />;
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
          {menuItems.map((item) => (
            <button
              key={item.key}
              id={`menu-item-${item.key}`}
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
            <h2 className="topbar-title">{ALL_MENU_ITEMS.find((item) => item.key === activeMenu)?.label}</h2>
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

        {activeMenu === "catalogo" && tokenInfo && (
          <CatalogForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserRole={tokenInfo.role}
          />
        )}
        {activeMenu === "usuarios" && tokenInfo && (
          <UsersForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserRole={tokenInfo.role}
            currentUserId={tokenInfo.sub}
          />
        )}
        {activeMenu === "perfil" && tokenInfo && (
          <MyProfileForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserId={tokenInfo.sub}
            onStartTour={() => startTour((menu) => setActiveMenu(menu as MenuKey), () => { void markOnboardingDone(); })}
          />
        )}
        {activeMenu === "listas-precios" && tokenInfo && (
          <PriceListForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserRole={tokenInfo.role}
          />
        )}
        {activeMenu === "ubicaciones" && tokenInfo && (
          <StorageLocationsForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserRole={tokenInfo.role}
          />
        )}
        {activeMenu === "categorias-cotizacion" && tokenInfo && (
          <QuoteItemCategoriesForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserRole={tokenInfo.role}
          />
        )}
        {activeMenu === "historial-cotizaciones" && tokenInfo && (
          <QuoteBatchesForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            onNavigate={setActiveMenu}
          />
        )}
        {activeMenu === "clientes" && tokenInfo && (
          <CustomersForm
            accessToken={accessToken}
            apiUrl={apiUrl}
            currentUserRole={tokenInfo.role}
          />
        )}
        {activeMenu !== "catalogo" && activeMenu !== "usuarios" && activeMenu !== "perfil" && activeMenu !== "listas-precios" && activeMenu !== "ubicaciones" && activeMenu !== "categorias-cotizacion" && activeMenu !== "historial-cotizaciones" && activeMenu !== "clientes" && (
          <QuoteForm accessToken={accessToken} activeMenu={activeMenu} onNavigate={setActiveMenu} />
        )}
      </section>

      {showWelcome && (
        <WelcomeModal onStartTour={handleStartTour} onDismiss={handleDismissWelcome} />
      )}
    </main>
  );
}

function decodeToken(token: string): TokenInfo | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub: string;
      email: string;
      role: TokenInfo["role"];
    };
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}
