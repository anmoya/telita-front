"use client";

import { useEffect, useMemo, useState } from "react";
import { WelcomeModal } from "../../onboarding/components/welcome-modal";
import { startTour } from "../../onboarding/components/onboarding-tour";
import type { MenuKey as WorkbenchMenuKey } from "../../operations/shared/workbench.shared-types";
import { ALL_MENU_ITEMS, PRIMARY_MENU_KEYS } from "./app-shell.config";
import { AppShellContentRouter } from "./app-shell-content-router";
import { AppShellSidebar } from "./app-shell-sidebar";
import { AppShellTopbar } from "./app-shell-topbar";
import { decodeToken, isWorkbenchMenu, shouldLockContentScroll } from "./app-shell.utils";
import type { AppMenuKey } from "./app-shell.types";

type AppShellProps = {
  accessToken: string;
  apiUrl: string;
  showWelcomeOnStart?: boolean;
  onLogout: () => void;
};

export function AppShell({ accessToken, apiUrl, showWelcomeOnStart = false, onLogout }: AppShellProps) {
  const [activeMenu, setActiveMenu] = useState<AppMenuKey>("dashboard");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(showWelcomeOnStart);

  useEffect(() => {
    setShowWelcome(showWelcomeOnStart);
  }, [showWelcomeOnStart]);

  const tokenInfo = useMemo(() => decodeToken(accessToken), [accessToken]);
  const menuItems = useMemo(
    () =>
      ALL_MENU_ITEMS.filter((item) => {
        if (!item.roles) return true;
        return tokenInfo ? item.roles.includes(tokenInfo.role) : false;
      }),
    [tokenInfo]
  );
  const primaryMenuItems = menuItems.filter((item) => PRIMARY_MENU_KEYS.includes(item.key));
  const adminMenuItems = menuItems.filter((item) => !PRIMARY_MENU_KEYS.includes(item.key));
  const activeMenuLabel = ALL_MENU_ITEMS.find((item) => item.key === activeMenu)?.label ?? "Operacion";

  useEffect(() => {
    if (!tokenInfo) {
      onLogout();
    }
  }, [tokenInfo, onLogout]);

  async function markOnboardingDone() {
    const info = decodeToken(accessToken);
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
    startTour(handleTourNavigate, () => { void markOnboardingDone(); });
  }

  function handleWorkbenchNavigate(menu: WorkbenchMenuKey) {
    setActiveMenu(menu);
  }

  function handleTourNavigate(menu: string) {
    if (isWorkbenchMenu(menu)) {
      setActiveMenu(menu);
    }
  }

  return (
    <main className="app-shell-2026">
      <AppShellSidebar
        activeMenu={activeMenu}
        primaryMenuItems={primaryMenuItems}
        adminMenuItems={adminMenuItems}
        onSelectMenu={setActiveMenu}
      />

      <section className="app-content-2026">
        <AppShellTopbar
          title={activeMenuLabel}
          role={tokenInfo?.role}
          email={tokenInfo?.email}
          onLogout={onLogout}
        />

        <div className={`app-content-scroll ${shouldLockContentScroll(activeMenu) ? "app-content-scroll--locked" : ""}`.trim()}>
          <AppShellContentRouter
            activeMenu={activeMenu}
            accessToken={accessToken}
            apiUrl={apiUrl}
            tokenInfo={tokenInfo}
            editingBatchId={editingBatchId}
            onNavigateWorkbench={handleWorkbenchNavigate}
            onEditBatch={(batchId) => {
              setEditingBatchId(batchId);
              setActiveMenu("pricing");
            }}
            onClearEditingBatch={() => setEditingBatchId(null)}
            onStartTour={handleStartTour}
          />
        </div>
      </section>

      {showWelcome ? (
        <WelcomeModal onStartTour={handleStartTour} onDismiss={() => setShowWelcome(false)} />
      ) : null}
    </main>
  );
}
