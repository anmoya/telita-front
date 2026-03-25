# AGENTS.md

Guia para agentes trabajando en `telita-front/`.

## 1. Comandos

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run verify`

## 2. Arquitectura que debe respetarse

Regla base:

- `Route shell -> coordinator hook -> prop builders / domain hooks -> visual workbenches`

Interpretacion:

- componentes grandes no deben volver a mezclar estado, routing, llamadas y render pesado;
- `AppShell` y `OperationsWorkbench` deben permanecer como wrappers/coordinadores livianos;
- la composicion compleja debe vivir en hooks o builders con nombres honestos;
- los workbenches viven en su dominio real, no escondidos bajo `pricing`.

## 3. Reglas obligatorias

- no reintroducir workbenches de `sales`, `cuts`, `scraps`, `audit`, `settings` o `labels` dentro de `pricing`;
- no volver a convertir `operations-workbench.tsx` en componente omnibus;
- cuando una pieza sea testeable sin DOM, preferir modelo puro o builder;
- si un cambio toca coordinacion relevante del workbench, agregar o ajustar tests;
- cerrar trabajo con `npm run verify`.

## 4. Estado actual importante

- `page.tsx` y `AppShell` ya no deben absorber logica de workbench;
- `operations-workbench.tsx` delega composicion principal a `use-operations-workbench-entry.ts`;
- el orden estable del repo es `build -> typecheck -> test`, y `npm run verify` ya lo encapsula;
- existe base de tests para shell, router, builders y modelos puros.

## 5. Antipatrones prohibidos

- volver a colgar slices operativos completos desde `pricing` por conveniencia;
- componentes coordinadores gigantes con demasiados `useState` cruzados;
- contratos backend/frontend implícitos sin tocar docs cuando el cambio es importante;
- cerrar cambios sin `verify`.

## 6. Documentacion relevante

- `../telita-docs/01-arquitectura/arquitectura-vigente-y-reglas-de-ejecucion.md`
- `../telita-docs/04-specs/backlog-remediacion-tecnica.md`

Si cambias arquitectura de shell, workbench o slices, actualiza `telita-docs/`.
