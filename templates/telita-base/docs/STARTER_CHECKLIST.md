# Starter Checklist

## Antes de desarrollo de negocio
- [ ] Definir dominio y modulos de negocio
- [ ] Configurar auth y roles
- [ ] Confirmar tokens de UI y branding
- [ ] Configurar API URL y ambientes
- [ ] Habilitar CI (lint + typecheck + tests)

## Guardrails
- [ ] No usar vendor UI directo en `src/modules/**`
- [ ] Usar primitives de `src/shared/ui/primitives`
- [ ] Evitar `fetch` directo en modulos
