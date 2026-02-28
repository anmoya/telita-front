#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Uso: $0 <target_dir> <app_name>"
  exit 1
fi

TARGET_DIR="$1"
APP_NAME="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="${SCRIPT_DIR}/../templates/telita-base"

if [ -e "$TARGET_DIR" ] && [ "$(ls -A "$TARGET_DIR" 2>/dev/null || true)" != "" ]; then
  echo "Error: target_dir ya existe y no esta vacio: $TARGET_DIR"
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp -R "$TEMPLATE_DIR"/. "$TARGET_DIR"/

if command -v rg >/dev/null 2>&1; then
  rg -l "__APP_NAME__" "$TARGET_DIR" | while read -r file; do
    sed -i "s/__APP_NAME__/${APP_NAME}/g" "$file"
  done
else
  grep -RIl "__APP_NAME__" "$TARGET_DIR" | while read -r file; do
    sed -i "s/__APP_NAME__/${APP_NAME}/g" "$file"
  done
fi

cat > "$TARGET_DIR/package.json" << PKG
{
  "name": "${APP_NAME}",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.5.9",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.5",
    "@types/react": "^19.1.17",
    "@types/react-dom": "^19.1.7",
    "@typescript-eslint/eslint-plugin": "^8.24.1",
    "@typescript-eslint/parser": "^8.24.1",
    "eslint": "^9.21.0",
    "typescript": "^5.7.3"
  }
}
PKG

cat > "$TARGET_DIR/src/app/page.tsx" << 'PAGE'
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Telita Base</h1>
      <p>Proyecto inicial listo para implementar modulos de negocio.</p>
    </main>
  );
}
PAGE

cat > "$TARGET_DIR/src/app/layout.tsx" << 'LAYOUT'
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
LAYOUT

cat > "$TARGET_DIR/src/app/globals.css" << 'CSS'
:root {
  color-scheme: light;
  --border: #d9cdb8;
  --ink: #22201a;
  --muted: #6f6658;
  --accent: #d25d1d;
  --accent-ink: #fff8f0;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; color: var(--ink); }

.t-btn {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  font-size: 0.84rem;
}
.t-btn-primary { background: var(--accent); color: var(--accent-ink); }
.t-btn-secondary { background: #fff; color: var(--ink); }

.t-input, .t-select, .t-textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
}

.t-alert { border: 1px solid; border-radius: 8px; padding: 0.65rem 0.8rem; }
.t-alert-info { background: #eff6ff; border-color: #bfdbfe; color: #1e3a8a; }
.t-alert-success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.t-alert-error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
CSS

cat > "$TARGET_DIR/eslint.config.mjs" << 'ESLINT'
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    }
  }
];
ESLINT

cat > "$TARGET_DIR/tsconfig.json" << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "types": ["node"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
TSCONFIG

cat > "$TARGET_DIR/next-env.d.ts" << 'NEXTENV'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited.
NEXTENV

cat > "$TARGET_DIR/next.config.ts" << 'NEXTCFG'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
NEXTCFG

echo "Scaffold creado en: $TARGET_DIR"
echo "Siguiente paso: cd $TARGET_DIR && npm install && npm run dev"
