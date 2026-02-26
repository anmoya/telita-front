# AGENTS.md - Ask Mode

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Documentation Context

### Project Structure
- Frontend Next.js application (src/ directory)
- UI primitives wrapped in `src/shared/ui/primitives/*` to abstract external libraries
- Time utilities in `src/shared/time/date-service.ts` - wraps native Intl.DateTimeFormat

### Key References
- Specs: `/home/alfonso/Dev/projects/telita/telita-docs/`
- Replaceable dependencies architecture: `spec-07-replaceable-dependencies.md`
- Documentation updates required after changes:
  - `/home/alfonso/Dev/projects/telita/FRONTEND_DOC.md`
  - `/home/alfonso/Dev/projects/telita/BACKEND_DOC.md`
  - `/home/alfonso/Dev/projects/telita/DATABASE_DOC.md`

### Code Organization
- `src/modules/*` - Feature modules with strict ESLint rules
- `src/shared/ui/primitives/*` - Allowed UI component wrappers
- `src/shared/time/*` - Allowed date/time utilities

### Styling
- CSS custom properties in `src/app/globals.css` :root
- Custom `t-` prefixed classes (t-btn, t-input, etc.)
- No Tailwind or CSS-in-JS

### Stack
- Next.js 15.5.9, React 19.1.0, TypeScript 5.7.3
- Node.js >=22 <23, npm >=10 <11
