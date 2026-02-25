# Telita Front Agent Context

Fecha de inicializacion: 2026-02-24

## Scope
Repositorio frontend web de Telita.

## Stack
- Next.js
- React
- TypeScript

## Reglas de arquitectura
- No importar librerias UI externas directamente en `src/modules/*`.
- Usar wrappers en `src/shared/ui/primitives/*`.
- No importar librerias de fechas directamente en modulos.
- Usar `src/shared/time/*`.

## Regla obligatoria de documentacion (global)
Despues de cada sesion o cambio relevante, actualizar SIEMPRE:
- `/home/alfonso/Dev/projects/telita/FRONTEND_DOC.md`
- `/home/alfonso/Dev/projects/telita/BACKEND_DOC.md`
- `/home/alfonso/Dev/projects/telita/DATABASE_DOC.md`

## Referencias
- Specs: `/home/alfonso/Dev/projects/telita/telita-docs/`
- Arquitectura reemplazable: `spec-07-replaceable-dependencies.md`
