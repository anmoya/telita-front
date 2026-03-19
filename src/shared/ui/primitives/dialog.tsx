"use client";

import { ReactNode, useEffect } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  blockBackButton?: boolean; // SPEC-30: Prevent Back button from closing modal
  panelClassName?: string;
  bodyClassName?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  blockBackButton = true,
  panelClassName = "",
  bodyClassName = ""
}: DialogProps) {
  useEffect(() => {
    if (!open || !blockBackButton) return;

    // SPEC-30: Block browser back button while modal is open
    window.history.pushState(null, "", window.location.href);

    function handlePopState(e: PopStateEvent) {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      // Modal stays open, no navigation
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, blockBackButton]);

  useEffect(() => {
    if (!open) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className={`dialog-panel ${panelClassName}`.trim()} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-title">{title}</span>
          <button className="dialog-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className={`dialog-body ${bodyClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}
