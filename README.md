# Telita Front

Web app operativa de Telita para cotizar cortes, gestionar retazos e imprimir etiquetas.

## Stack
- Next.js (App Router)
- React
- TypeScript
- CSS global con design tokens propios

## Regla de arquitectura
- Modulos de negocio usan wrappers de UI en `src/shared/ui/primitives`.
- Manejo de fechas via `src/shared/time`.
- Enforced con `eslint.config.mjs`.
- Guia de desacople UI: `docs/frontend-ui-architecture.md`.
- Playbook de plataforma (spec 40-45): `docs/platform-migration-playbook.md`.
- Check automatizado de plataforma: `./scripts/platform-readiness-check.sh`.
- Scaffold base reusable: `./scripts/scaffold-telita-base.sh <target_dir> <app_name>`.

## Requisitos
- Node.js 22.x
- npm 10.x
- Docker + Docker Compose (para base de datos usada por el backend)

## Variables de entorno (dev)
Crea `telita-front/.env.local` (puedes copiar desde `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

## Levantar base de datos con Docker
Desde la raiz del repo (`/home/alfonso/Dev/projects/telita`):

```bash
docker compose -f docker-compose.dev.yml up -d telita-postgres
docker compose -f docker-compose.dev.yml ps
```

## Levantar servidor frontend (dev)
Desde `telita-front/`:

```bash
npm_config_cache=./.npm-cache npm install
npm run dev
```

Servidor esperado: `http://localhost:3000`

## Flujo local completo
1. Levantar Postgres con Docker.
2. Levantar backend en `:3001`.
3. Levantar frontend en `:3000`.
