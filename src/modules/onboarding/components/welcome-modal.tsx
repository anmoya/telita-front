"use client";

type WelcomeModalProps = {
  onStartTour: () => void;
  onDismiss: () => void;
};

const FLOW_STEPS = [
  { icon: "📋", title: "Cotizar", desc: "Crea una cotizacion con SKU, metros y precio automatico" },
  { icon: "✅", title: "Confirmar venta", desc: "Confirmar genera un trabajo de corte pendiente" },
  { icon: "✂️", title: "Ejecutar corte", desc: "El operador registra el corte fisico en el sistema" },
  { icon: "📦", title: "Almacenar retazo", desc: "El sobrante se guarda con ubicacion fisica real" },
  { icon: "♻️", title: "Reutilizar", desc: "En futuras ventas se sugieren retazos compatibles" }
];

export function WelcomeModal({ onStartTour, onDismiss }: WelcomeModalProps) {
  return (
    <div className="dialog-overlay" style={{ zIndex: 9999 }}>
      <div className="dialog-panel" style={{ maxWidth: "520px", width: "100%" }}>
        <div className="dialog-header">
          <h2 className="dialog-title">Bienvenido a Telita</h2>
        </div>
        <div className="dialog-body">
          <p className="panel-subtle" style={{ marginBottom: "20px" }}>
            Este es el flujo operativo completo de la tienda:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {FLOW_STEPS.map((step, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "var(--color-surface, #f9fafb)", borderRadius: "8px" }}
              >
                <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{step.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "14px", margin: 0 }}>{step.title}</p>
                  <p style={{ fontSize: "13px", color: "var(--color-muted, #6b7280)", margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button className="t-btn t-btn-secondary" onClick={onDismiss}>
              Omitir por ahora
            </button>
            <button className="t-btn t-btn-primary" onClick={onStartTour}>
              Empezar tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
