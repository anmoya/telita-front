"use client";

import { useState } from "react";
import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";

type LabelPreviewDialogProps = {
  preview: { id: string; html: string } | null;
  loadingActionId: string | null;
  onClose: () => void;
  onReprint: (id: string) => void;
  onDownloadZpl?: (id: string) => void;
  onFetchZpl?: (id: string) => Promise<string>;
};

export function LabelPreviewDialog({ preview, loadingActionId, onClose, onReprint, onDownloadZpl, onFetchZpl }: LabelPreviewDialogProps) {
  const [viewMode, setViewMode] = useState<"html" | "zpl">("html");
  const [zplContent, setZplContent] = useState<string | null>(null);
  const [loadingZpl, setLoadingZpl] = useState(false);

  const handleViewZpl = async () => {
    if (!preview || !onFetchZpl) return;
    
    setLoadingZpl(true);
    try {
      const content = await onFetchZpl(preview.id);
      setZplContent(content);
      setViewMode("zpl");
    } catch (error) {
      console.error("Error fetching ZPL:", error);
    } finally {
      setLoadingZpl(false);
    }
  };

  const handleViewHtml = () => {
    setViewMode("html");
  };

  return (
    <Dialog open={!!preview} onClose={onClose} title="Vista previa de etiqueta">
      {preview ? (
        <>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button 
                variant={viewMode === "html" ? "primary" : "secondary"} 
                onClick={handleViewHtml}
              >
                Vista previa
              </Button>
              <Button 
                variant={viewMode === "zpl" ? "primary" : "secondary"} 
                onClick={handleViewZpl}
                disabled={loadingZpl || !onFetchZpl}
              >
                {loadingZpl ? <Spinner size="sm" /> : "Código ZPL"}
              </Button>
            </div>
          </div>

          {viewMode === "html" ? (
            <iframe
              srcDoc={preview.html}
              style={{ width: "100%", height: "600px", border: "none", display: "block" }}
              title="Vista previa etiqueta"
            />
          ) : (
            <div style={{ height: "600px", overflow: "auto", backgroundColor: "#1e1e1e", color: "#d4d4d4" }}>
              <pre style={{ 
                margin: 0, 
                padding: "1rem", 
                fontFamily: "'Courier New', monospace", 
                fontSize: "13px",
                lineHeight: "1.4",
                whiteSpace: "pre-wrap"
              }}>
                {zplContent || "Cargando código ZPL..."}
              </pre>
            </div>
          )}

          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem"
            }}
          >
            <Button variant="primary" onClick={() => onReprint(preview.id)} disabled={loadingActionId === preview.id}>
              {loadingActionId === preview.id ? <Spinner size="sm" /> : "Imprimir"}
            </Button>
            {onDownloadZpl && (
              <Button variant="secondary" onClick={() => onDownloadZpl(preview.id)}>
                Descargar ZPL
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </>
      ) : null}
    </Dialog>
  );
}
