# Migas

Aplicación de hogar para gestionar la **lista de la compra**, la
**despensa** (existencias y caducidades) y las **recetas**, con
sugerencias de qué cocinar según lo que hay en casa.

Es a la vez la aplicación web y la **API pública** (`/api/v1`) que
consumirán otros clientes, como una futura app móvil (proyecto aparte).

> Las decisiones de arquitectura y convenciones para desarrollar están en
> [`CLAUDE.md`](./CLAUDE.md), y las buenas prácticas generales en
> [`AGENTS.md`](./AGENTS.md). Este README es la visión general.

---

## Funcionalidades

- **Hogares compartidos**: cada hogar tiene sus miembros, listas y
  despensa comunes. Nuevos miembros entran por invitación.
- **Lista de la compra**: hasta 15 listas activas por hogar, ítems con
  cantidad y unidad, marcar como comprado, autocompletado con una lista
  base de 328 productos y aviso de productos repetidos (unir sumando
  g↔kg y ml↔l, o añadir aparte). Las listas archivadas se borran solas
  a los 15 días. Orden por tienda/pasillo (más adelante).
- **Despensa**: qué hay en casa, cuánto, en qué ubicación (configurables
  por hogar) y, si se quiere, cuándo caduca, con aviso de lo que caduca esta
  semana. Al terminar la compra se ofrece guardarla en la despensa, y lo
  que se acaba vuelve a la lista con un toque.
- **Categorías**: cada producto tiene la suya; la lista se agrupa en el
  orden del súper y la despensa por ubicación o por categoría. El hogar
  recuerda cómo clasifica lo que escribe a mano.
- **Recetas**: biblioteca propia de recetas caseras con los ingredientes
  vinculados al catálogo. Primero salen las que puedes hacer con lo que
  hay, con las raciones ajustadas a la despensa; si quieres más raciones,
  lo que falta va a la lista con un toque.
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

| Contexto           | Responsabilidad                               |
| ------------------ | --------------------------------------------- |
| Catalog            | Ingredientes, productos, sinónimos, unidades  |
| Pantry (core)      | Existencias, caducidades, consumo             |
| Shopping           | Listas de la compra e ítems                   |
| Recipes            | Biblioteca de recetas y cruce con la despensa |
| Suggestions (core) | Puntuación y sugerencia de recetas            |
| Households         | Hogares, miembros, invitaciones               |
| Identity           | Autenticación web (cookie) y API (Bearer)     |

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

| Área         | Tecnología                                    |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 15 (App Router), TypeScript estricto  |
| Datos        | Prisma + PostgreSQL (Neon)                    |
| Auth         | Better Auth (cookie web + Bearer para la API) |
| Validación   | Zod                                           |
| UI           | Tailwind CSS, shadcn/ui, React Hook Form      |
| Estado       | Zustand, TanStack Query (donde aporta)        |
| Tests        | Vitest, Testing Library, Playwright           |
| Calidad      | ESLint, Prettier, Husky + lint-staged         |
| Hosting / CI | Vercel, GitHub Actions                        |

## Puesta en marcha

Requisitos: Node.js 20+, pnpm, una base de datos en Neon (o Postgres
local).

```bash
pnpm install
cp .env.example .env.local   # rellenar valores (BETTER_AUTH_SECRET incluido)
pnpm db:migrate              # aplica las migraciones (nunca aceptes un reset)
pnpm db:generate             # Prisma 7 no genera el cliente al migrar
pnpm prisma db seed          # lista base + usuario dev@migas.local / dev-migas-1234
pnpm dev
```

### Variables de entorno

| Variable                | Uso                                             |
| ----------------------- | ----------------------------------------------- |
| `DATABASE_URL`          | Conexión pooled a Postgres (la app)             |
| `DATABASE_URL_UNPOOLED` | Conexión directa (CLI de Prisma)                |
| `BETTER_AUTH_SECRET`    | Firma de sesiones (≥ 32 caracteres)             |
| `BETTER_AUTH_URL`       | URL pública de la app (`http://localhost:3000`) |
| `CRON_SECRET`           | Protege `/api/cron/*` (opcional en local)       |

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

Cron de Vercel (`vercel.json`): `/api/cron/purgar-listas` a las 04:00 UTC
borra las listas archivadas hace 15 días. Necesita `CRON_SECRET` en el
entorno Production de Vercel (16+ caracteres; Vercel la envía sola).

## Pendiente de decidir

- Resolución de conflictos en sync (propuesta: last-write-wins por campo)
- Pertenencia de un usuario a varios hogares
- Proveedor de email (verificación y restablecer contraseña)
- Alojamiento del futuro microservicio Python (canonicalización/NLP)

## Convenciones

Resumen; el detalle está en `CLAUDE.md`:

- Sin lógica de negocio en `app/`.
- Errores de negocio con `Result<T>`, nunca `throw`.
- Nada que solo funcione vía Server Action: todo existe en `/api/v1`.
- Soft delete (`deletedAt`) en entidades sincronizables.
- Conventional Commits.
