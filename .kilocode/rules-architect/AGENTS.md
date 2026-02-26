# AGENTS.md - Architect Mode

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Architectural Constraints

### Replaceable Dependencies Pattern
- Architecture follows `spec-07-replaceable-dependencies.md` in telita-docs
- External dependencies must be abstracted through wrappers in `src/shared/`
- ESLint enforces this - blocks direct imports of date-fns, dayjs, luxon, @radix-ui/*, antd, @mui/* in modules

### UI Layer Abstraction
- All UI components must use wrappers in `src/shared/ui/primitives/*`
- Current wrappers: Button, Input, Dialog, Spinner, TableSkeleton
- Adding new UI libraries requires: wrapper creation + ESLint rule update

### Time/Date Abstraction
- All date handling through `src/shared/time/date-service.ts`
- Default locale: `es-CL` (Chilean Spanish)
- Intl.DateTimeFormat used (no external libraries)

### Styling Architecture
- Single CSS file: `src/app/globals.css`
- CSS custom properties in `:root` for theming
- `t-` prefix convention for component classes
- No CSS-in-JS, no Tailwind

### Authentication
- Token storage: localStorage key `"telita_access_token"`
- No auth library - simple fetch-based implementation

### Build Constraints
- Node.js >=22 <23, npm >=10 <11 (strict version requirements)
- reactStrictMode enabled in Next.js config
- No test framework - testing not part of current architecture
