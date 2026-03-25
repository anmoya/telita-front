"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../modules/app-shell/components/app-shell";
import { LoginScreen } from "../modules/auth/components/login-screen";

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_TELITA_API_URL ?? "http://localhost:3001/v1";
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showWelcomeOnStart, setShowWelcomeOnStart] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("telita_access_token");
    if (token) {
      setAccessToken(token);
      const onboardingDone = window.localStorage.getItem("telita_onboarding_completed");
      if (!onboardingDone) setShowWelcomeOnStart(true);
    }
    setIsReady(true);
  }, []);

  function handleLoginSuccess(token: string, onboardingCompletedAt: string | null) {
    setAccessToken(token);
    if (!onboardingCompletedAt) {
      window.localStorage.removeItem("telita_onboarding_completed");
      setShowWelcomeOnStart(true);
    } else {
      window.localStorage.setItem("telita_onboarding_completed", "true");
      setShowWelcomeOnStart(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("telita_access_token");
    setAccessToken(null);
    setShowWelcomeOnStart(false);
  }

  if (!isReady) return <main className="auth-shell" />;

  if (!accessToken) {
    return <LoginScreen apiUrl={apiUrl} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppShell
      accessToken={accessToken}
      apiUrl={apiUrl}
      showWelcomeOnStart={showWelcomeOnStart}
      onLogout={handleLogout}
    />
  );
}
