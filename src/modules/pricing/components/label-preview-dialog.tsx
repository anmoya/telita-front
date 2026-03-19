"use client";

import { Button } from "../../../shared/ui/primitives/button";
import { Dialog } from "../../../shared/ui/primitives/dialog";
import { Spinner } from "../../../shared/ui/primitives/spinner";

type LabelPreviewDialogProps = {
  preview: { id: string; html: string } | null;
  loadingActionId: string | null;
  onClose: () => void;
  onReprint: (id: string) => void;
};

export function LabelPreviewDialog({ preview, loadingActionId, onClose, onReprint }: LabelPreviewDialogProps) {
  return (
    <Dialog open={!!preview} onClose={onClose} title="Vista previa de etiqueta">
      {preview ? (
        <>
          <iframe
            srcDoc={preview.html}
            style={{ width: "100%", height: "520px", border: "none", display: "block" }}
            title="Vista previa etiqueta"
          />
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
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </>
      ) : null}
    </Dialog>
  );
}
