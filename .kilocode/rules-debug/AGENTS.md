# AGENTS.md - Debug Mode

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Debugging Rules

### No Test Framework
- No test framework configured - no test scripts or test files exist
- Cannot run `npm test` - there is no test script in package.json

### Build Issues
- ESLint enforces architecture restrictions in `src/modules/*`: blocks date-fns, dayjs, luxon, @radix-ui/*, antd, @mui/*
- Import errors will show as ESLint errors, not runtime errors

### Runtime Debugging
- React components in Next.js - use browser devtools for client-side debugging
- API calls use standard fetch - check Network tab for debugging
- Auth token stored in localStorage key `"telita_access_token"`

### TypeScript
- Run `npm run typecheck` to verify TypeScript types before debugging
- Strict mode enabled in tsconfig.json

### Development Server
- Use `npm run dev` for development - hot reload enabled
- Check console for both client-side and server-side errors
