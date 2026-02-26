# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

## Project-Specific Rules

### Architecture Enforcement (ESLint)
- **Date libraries**: Cannot import date-fns, dayjs, or luxon in `src/modules/*`. Use [`src/shared/time/date-service.ts`](src/shared/time/date-service.ts) instead.
- **UI libraries**: Cannot import @radix-ui/*, antd, or @mui/* in `src/modules/*`. Use wrappers in `src/shared/ui/primitives/*`.

### Styling
- Use custom CSS classes with `t-` prefix: `t-btn`, `t-btn-primary`, `t-btn-secondary`, `t-input`
- All styling in [`src/app/globals.css`](src/app/globals.css) - no CSS-in-JS or Tailwind
- CSS variables defined in `:root` (see globals.css lines 1-17)

### Client/Server Components
- Add `"use client"` directive to components using React hooks (useState, useEffect, etc.)
- Example: [`src/shared/ui/primitives/dialog.tsx`](src/shared/ui/primitives/dialog.tsx) line 1

### Date Handling
- Use [`formatLocalDateTime()`](src/shared/time/date-service.ts:1) with default locale `es-CL`

### Authentication
- Token stored in localStorage: `"telita_access_token"`

### Documentation Rule
- After any relevant change, update:
  - `/home/alfonso/Dev/projects/telita/FRONTEND_DOC.md`
  - `/home/alfonso/Dev/projects/telita/BACKEND_DOC.md`
  - `/home/alfonso/Dev/projects/telita/DATABASE_DOC.md`

## References
- Specs: `/home/alfonso/Dev/projects/telita/telita-docs/`
- Architecture: `spec-07-replaceable-dependencies.md`

## Notes
- No test framework configured - no test scripts or files exist
- Node.js >=22 <23, npm >=10 <11 (check package.json engines)
- Next.js reactStrictMode enabled in next.config.ts
