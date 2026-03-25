import type { AppMenuKey, MenuItem } from "./app-shell.types";

type AppShellSidebarProps = {
  activeMenu: AppMenuKey;
  primaryMenuItems: MenuItem[];
  adminMenuItems: MenuItem[];
  onSelectMenu: (menu: AppMenuKey) => void;
};

export function AppShellSidebar({
  activeMenu,
  primaryMenuItems,
  adminMenuItems,
  onSelectMenu
}: AppShellSidebarProps) {
  return (
    <aside className="app-sidebar-2026">
      <div className="sidebar-brand-panel">
        <div className="brand-block">
          <div className="brand-logo">T</div>
          <div>
            <p className="sidebar-kicker">Telita ERP</p>
            <h1 className="sidebar-title">Operaciones textiles</h1>
          </div>
        </div>
        <p className="sidebar-text">
          Cotiza, vende, corta, almacena y reutiliza con criterio operativo.
        </p>
      </div>

      <div className="sidebar-scroll-region">
        <div className="sidebar-nav-group">
          <p className="sidebar-group-title">Operacion</p>
          <nav className="sidebar-nav">
            {primaryMenuItems.map((item) => (
              <button
                key={item.key}
                id={`menu-item-${item.key}`}
                className={`nav-item ${activeMenu === item.key ? "nav-item-active" : ""}`.trim()}
                onClick={() => onSelectMenu(item.key)}
              >
                <span className="nav-item__label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {adminMenuItems.length > 0 ? (
          <div className="sidebar-nav-group">
            <p className="sidebar-group-title">Administracion</p>
            <nav className="sidebar-nav">
              {adminMenuItems.map((item) => (
                <button
                  key={item.key}
                  id={`menu-item-${item.key}`}
                  className={`nav-item ${activeMenu === item.key ? "nav-item-active" : ""}`.trim()}
                  onClick={() => onSelectMenu(item.key)}
                >
                  <span className="nav-item__label">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
