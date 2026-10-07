# ShopLab

Aplicación de hogar para gestionar la **lista de la compra**, la
**despensa** (existencias y caducidades) y las **recetas**, con
sugerencias de qué cocinar según lo que hay en casa.

Es a la vez la aplicación web y la **API pública** (`/api/v1`) que
consumirán otros clientes, como una futura app móvil (proyecto aparte).

> Las decisiones de arquitectura y convenciones para desarrollar están en
> [`CLAUDE.md`](./CLAUDE.md). Este README es la visión general.

---

## Funcionalidades

- **Hogares compartidos**: cada hogar tiene sus miembros, listas y
  despensa comunes. Nuevos miembros entran por invitación.
- **Lista de la compra**: varias listas, ítems con cantidad y unidad,
  marcar como comprado, orden por tienda/pasillo.
- **Despensa**: qué hay en casa, cuánto, dónde y cuándo caduca. Lo
  comprado entra automáticamente en la despensa.
- **Recetas**: recetario con ingredientes normalizados, importación desde
  EPUB de recetarios.
- **Sugerencias**: motor que puntúa recetas según la despensa, las
  caducidades próximas y las preferencias del hogar.
- **Sync**: API preparada para clientes offline-first (cola de
  mutaciones idempotentes y sincronización incremental).

## Modelo de datos (resumen)

Tres niveles para lo que se compra y se guarda:

| Nivel             | Qué es                           | Ejemplo                 |
| ----------------- | -------------------------------- | ----------------------- |
| **Ingredient**    | Concepto canónico                | Tomate                  |
| **Product**       | Lo que se compra (marca/formato) | Tomate triturado 400 g  |
| **InventoryItem** | Lo que hay en casa               | 2 botes, caduca 12/2026 |

Toda entidad de negocio pertenece a un hogar (`hogarId`), salvo el
catálogo global de ingredientes y productos.

## Arquitectura

Clean Architecture + DDD sobre Next.js. La lógica de negocio vive en
`src/domains`; `src/app` solo entrega (páginas, endpoints y Server
Actions delgadas que llaman a use cases).

**Bounded contexts**

| Contexto           | Responsabilidad                              |
| ------------------ | -------------------------------------------- |
| Catalog            | Ingredientes, productos, sinónimos, unidades |
| Pantry (core)      | Existencias, caducidades, consumo            |
| Shopping           | Listas de la compra e ítems                  |
| Recipes            | Recetas e importación de recetarios          |
| Suggestions (core) | Puntuación y sugerencia de recetas           |
| Households         | Hogares, miembros, invitaciones              |
| Identity           | Autenticación web (cookie) y API (Bearer)    |

**Flujos entre contextos** (por eventos de dominio):

- Comprar un ítem → entra en la despensa (`ShoppingItemPurchased`)
- Cocinar una receta → descuenta de la despensa (`RecipeCooked`)

**Estructura**

```
src/
  contracts/      esquemas Zod de la API pública
  domains/        un directorio por bounded context
                  (domain / application / infrastructure)
  shared/         kernel (Result, auth, tenant), sync, UI común
  app/            páginas, /api/v1 y Server Actions
prisma/           schema y migraciones
```

## API

- Base: `/api/v1`, documentada con OpenAPI (generado desde
  `src/contracts`).
- Autenticación: cookie de sesión (web) o `Authorization: Bearer`
  (clientes externos).
- Errores: `{ "error": { "code", "message", "details?" } }`.
- Paginación por cursor; fechas ISO 8601 UTC; IDs UUIDv7.
- Sync: `GET /api/v1/sync?since=<cursor>` y `POST /api/v1/sync/push`.

## Stack

| Área         | Tecnología                                   |
| ------------ | -------------------------------------------- |
| Framework    | Next.js 15 (App Router), TypeScript estricto |
| Datos        | Prisma + PostgreSQL (Neon)                   |
| Auth         | Auth.js v5 + tokens Bearer para la API       |
| Validación   | Zod                                          |
| UI           | Tailwind CSS, shadcn/ui, React Hook Form     |
| Estado       | Zustand, TanStack Query (donde aporta)       |
| Tests        | Vitest, Testing Library, Playwright          |
| Calidad      | ESLint, Prettier, Husky + lint-staged        |
| Hosting / CI | Vercel, GitHub Actions                       |

## Puesta en marcha

Requisitos: Node.js 20+, pnpm, una base de datos en Neon (o Postgres
local).

```bash
pnpm install
cp .env.example .env.local   # rellenar valores
pnpm prisma migrate dev
pnpm dev
```

### Variables de entorno

| Variable       | Uso                               |
| -------------- | --------------------------------- |
| `DATABASE_URL` | Conexión pooled a Postgres        |
| `DIRECT_URL`   | Conexión directa (Prisma Migrate) |
| `AUTH_SECRET`  | Firma de sesiones de Auth.js      |
| `AUTH_URL`     | URL base de la app                |

Se validan al arrancar en `src/env.ts`; si falta alguna, la app no
inicia.

### Scripts

| Script           | Qué hace                 |
| ---------------- | ------------------------ |
| `pnpm dev`       | Servidor de desarrollo   |
| `pnpm build`     | Build de producción      |
| `pnpm lint`      | ESLint                   |
| `pnpm typecheck` | `tsc --noEmit`           |
| `pnpm test`      | Tests unitarios (Vitest) |
| `pnpm test:e2e`  | Tests e2e (Playwright)   |

## Entornos y despliegue

| Rama      | Entorno    | Despliegue     | BD (rama Neon) |
| --------- | ---------- | -------------- | -------------- |
| PR        | preview    | Vercel preview | preview        |
| `develop` | staging    | Vercel         | staging        |
| `main`    | producción | Vercel         | main           |

`main` está protegida: PR + lint, typecheck y tests en verde.

## Pendiente de decidir

- Mecanismo de tokens para clientes de la API (propuesta: access JWT
  corto + refresh rotativo)
- Resolución de conflictos en sync (propuesta: last-write-wins por campo)
- Pertenencia de un usuario a varios hogares
- Proveedor de email y de rate limiting
- Origen y licencia del catálogo de recetas
- Alojamiento del futuro microservicio Python (canonicalización/NLP)

## Convenciones

Resumen; el detalle está en `CLAUDE.md`:

- Sin lógica de negocio en `app/`.
- Errores de negocio con `Result<T>`, nunca `throw`.
- Nada que solo funcione vía Server Action: todo existe en `/api/v1`.
- Soft delete (`deletedAt`) en entidades sincronizables.
- Conventional Commits.
