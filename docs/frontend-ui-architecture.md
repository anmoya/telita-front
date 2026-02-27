# Frontend UI Architecture (Swappable UI Layer)

Fecha: 2026-02-27
Estado: Base inicial

## Objetivo
Mantener comportamiento estable de la app mientras se permite cambiar el renderer visual (CSS propio, Tamagui, MUI, etc.) con costo controlado.

## Capas

1. Domain/UI flows (modulos)
- Pantallas de negocio (`src/modules/*`).
- Deben consumir primitives y hooks compartidos.

2. Shared primitives (`src/shared/ui/primitives`)
- Contratos estables: `Button`, `Input`, `Select`, `Textarea`, `Dialog`, `Spinner`, `Alert`.
- Evitar props acopladas a un vendor especifico.

3. Theme/tokens
- Variables en `globals.css` como fuente de color/espaciado base.
- Evitar hardcodes de color en modulos.

4. Shared hooks
- `useAsyncAction`, futuros `useApi`, `usePagination`, etc.
- No deben depender de detalles visuales.

## Reglas de adopcion

- Para codigo nuevo: no usar `<button>/<input>/<select>` directos salvo casos muy puntuales.
- Preferir primitives compartidos.
- No introducir estilos inline cuando exista clase reusable.
- Si se agrega un estado visual repetido (error/success/info), encapsularlo en `Alert`.

## Estrategia de migracion incremental

1. No romper APIs actuales de primitives existentes.
2. Reemplazo oportunista: cada archivo tocado migra lo mas repetido.
3. Evitar refactor masivo de una sola PR.

## Criterios de avance

- Menos estilos inline en modulos.
- Menos tags HTML nativos repetidos para controles basicos.
- Mayor uso de primitives compartidos.
