# AGENTS.md - Code Mode

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Coding Rules

### Architecture Enforcement
- **Date libraries**: ESLint blocks date-fns, dayjs, luxon in `src/modules/*`. Must use [`src/shared/time/date-service.ts`](src/shared/time/date-service.ts) with default locale `es-CL`.
- **UI libraries**: ESLint blocks @radix-ui/*, antd, @mui/* in `src/modules/*`. Must use wrappers in `src/shared/ui/primitives/*` (Button, Input, Dialog, Spinner, TableSkeleton).

### Client Components
- Add `"use client"` directive to components using React hooks (useState, useEffect). See [`src/shared/ui/primitives/dialog.tsx:1`](src/shared/ui/primitives/dialog.tsx:1).

### Styling Requirements
- Use `t-` prefixed CSS classes: `t-btn`, `t-btn-primary`, `t-btn-secondary`, `t-input`
- All CSS in [`src/app/globals.css`](src/app/globals.css) only - no CSS-in-JS, no Tailwind
- CSS variables in `:root` (lines 1-17 of globals.css)

### Auth Token
- Store token in localStorage with key: `"telita_access_token"` (not "token" or "authToken")

### Documentation Requirement
- After any change, always update:
  - `/home/alfonso/Dev/projects/telita/FRONTEND_DOC.md`
  - `/home/alfonso/Dev/projects/telita/BACKEND_DOC.md`
  - `/home/alfonso/Dev/projects/telita/DATABASE_DOC.md`
