# Platform Migration Playbook (Spec 40-45)

Fecha: 2026-02-27

## Objetivo
Convertir Telita Front en base reusable sin frenar roadmap funcional.

## Fases ejecutables

### Fase 1 (Spec 41/43)
- Consolidar primitives y wrappers reutilizables.
- Activar guardrails lint para evitar regresiones de arquitectura.

### Fase 2 (Spec 42)
- Centralizar cliente API y hooks async compartidos.
- Migrar modulos gradualmente a capa de datos shared.

### Fase 3 (Spec 44/45)
- Preparar scaffold reproducible (`scripts/scaffold-telita-base.sh`).
- Formalizar checklist de readiness y adopcion.

## Comandos
```bash
# quality gates
./scripts/platform-readiness-check.sh

# scaffold de nuevo proyecto
./scripts/scaffold-telita-base.sh /tmp/mi-app-base mi-app-base
```

## Definition of Done por fase
- Lint/typecheck en verde.
- Documentacion actualizada.
- Cambios no rompen flujos de negocio existentes.
