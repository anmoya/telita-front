import { Button } from "../../../shared/ui/primitives/button";
import type { UserRole } from "./app-shell.types";

type AppShellTopbarProps = {
  title: string;
  role?: UserRole;
  email?: string;
  onLogout: () => void;
};

export function AppShellTopbar({ title, role, email, onLogout }: AppShellTopbarProps) {
  return (
    <header className="topbar-2026">
      <div className="topbar-main">
        <p className="topbar-kicker">Sistema operativo textil</p>
        <div className="topbar-title-row">
          <h2 className="topbar-title">{title}</h2>
          <span className="topbar-chip">{role ?? "usuario"}</span>
        </div>
      </div>

      <div className="topbar-user">
        <div>
          <p className="user-email">{email ?? "usuario"}</p>
          <p className="user-role">Sucursal MAIN</p>
        </div>
        <Button variant="secondary" onClick={onLogout}>
          Cerrar sesion
        </Button>
      </div>
    </header>
  );
}
