# CLAUDE.md

Memoria persistente del proyecto. Léelo al inicio de cada sesión. Documenta
decisiones tomadas, no aspiraciones. Si el código contradice este archivo,
el código manda y este archivo debe actualizarse (ver sección final).

## Proyecto

**Nombre:** ShopLab
**Descripción:** App de hogar para gestionar lista de la compra, despensa
(existencias y caducidades) y recetas, con sugerencias de recetas según lo
que hay en casa.
**Modelo:** Producto multi-hogar (cada hogar comparte listas y despensa
entre sus miembros). Este proyecto es la web **y** la API pública. Habrá
clientes externos (app móvil, en un proyecto aparte) que solo usarán la
API HTTP: todo lo que haga la web debe poder hacerse vía `/api/v1`.

## Stack técnico

- **Framework:** Next.js 15 (App Router), full-stack: UI web + API pública
- **Lenguaje:** TypeScript estricto (`strict: true`, sin `any` salvo
  excepción justificada con comentario)
- **Validación:** Zod en el borde (API input, Server Action input, env
  vars). Los esquemas de la API viven en `src/contracts`
- **ORM / BD:** Prisma 7 (fijado; migrar a Prisma 8 es decisión aparte)
  con PostgreSQL en Neon vía `@prisma/adapter-neon`. Cliente generado en
  `src/generated/prisma` (no se versiona; `postinstall` lo genera)
- **Autenticación:** Auth.js (NextAuth v5) para la web; tokens Bearer
  para clientes de la API (ver Identity)
- **Estado de cliente:** Zustand para estado UI local; estado de servidor
  vía Server Components. TanStack Query donde haya mutaciones optimistas
  (marcar comprado, ajustar cantidades) o revalidación fina
- **Estilos:** Tailwind CSS + shadcn/ui
- **Formularios:** React Hook Form + Zod resolver
- **Testing:** Vitest (dominio) + Testing Library + Playwright (e2e
  críticos: login, lista → comprado → despensa, sugerencias, sync)
- **Linter/formatter:** ESLint + Prettier (con `prettier-plugin-tailwindcss`),
  Husky + lint-staged en pre-commit
- **Documentación API:** OpenAPI generado desde `src/contracts`
- **Futuro:** microservicio Python para canonicalización de ingredientes
  y NLP/ML, detrás de un puerto (`IngredientCanonicalizer`); hasta
  entonces, implementación local en TypeScript

## Arquitectura

Clean Architecture + DDD adaptado a Next.js. `app/` es solo capa de
entrega (UI + endpoints), nunca contiene reglas de negocio.

```
src/
  env.ts              → única lectura de process.env (validada con Zod)
  contracts/          → esquemas Zod + tipos DTO de /api/v1 (sin Prisma)
  generated/prisma/   → cliente Prisma generado (gitignored)
  domains/<bounded-context>/
    domain/           → entidades, value objects, eventos de dominio
    application/      → use cases (commands/queries), puertos
    infrastructure/   → repositorios Prisma, adaptadores externos
  shared/
    kernel/           → Result, errores, Unidad/Cantidad, auth-context,
                        prisma (singleton), tenant-prisma, TenantRepository
    sync/             → motor de sincronización (ver Sync)
    ui/               → componentes UI agnósticos de dominio
  app/
    api/_lib/           → helpers privados de la API (Result → HTTP)
    api/v1/.../route.ts → API pública
    (rutas)/page.tsx    → Server Components que llaman use cases
    actions/            → Server Actions (solo web), delgadas
```

Regla dura: ni `route.ts` ni `page.tsx` ni una Server Action contienen
lógica de negocio. Validan input → llaman a un use case → mapean
resultado.

Regla aplicada por ESLint (`no-restricted-imports`): Prisma y
`@/generated/*` solo se importan desde `shared/kernel` e
`infrastructure/`.

## API pública (decisión tomada)

- `/api/v1` es el contrato canónico. Cada capacidad de la web existe como
  Route Handler; una Server Action es un atajo de la web que llama al
  **mismo** use case, nunca la única vía para hacer algo.
- Versionado en la URL. Cambios incompatibles → `/api/v2`; v1 no se rompe.
- Errores con forma única `{ error: { code, message, details? } }`;
  `code` es estable y se mapea desde el `Result` del use case.
- Paginación por cursor, no por offset.
- Fechas ISO 8601 en UTC; cantidades con unidad explícita (VO `Cantidad`).
- IDs UUIDv7 que puede generar el cliente (necesario para crear offline).
- Nada de la capa `application` conoce cookies, `redirect()` ni headers:
  la identidad llega como `AuthContext` ya resuelto.

## Bounded Contexts (DDD)

Modelo de tres niveles: **Ingredient** (concepto canónico: "tomate") →
**Product** (lo que se compra: marca/formato) → **InventoryItem** (lo que
hay en casa: cantidad, caducidad, ubicación).

- **Catalog**: Ingredient y Product, sinónimos, unidades y conversiones
- **Pantry** (core): InventoryItem, caducidades, consumo
- **Shopping**: listas, ítems, estado comprado, lista por tienda/pasillo.
  Un ítem tiene `nombre` libre + `ingredientId` opcional (se vincula con
  Catalog cuando exista)
- **Recipes**: recetas e ingredientes de receta (referencian Ingredient)
- **Suggestions** (core): motor de puntuación de recetas según despensa,
  caducidades próximas y preferencias. Detalle en
  `src/domains/suggestions/README.md`
- **Households**: hogar, miembros, invitaciones (tenant)
- **Identity**: autenticación web y por token

Conceptos compartidos entre contextos (Unidad, Cantidad) viven en
`shared/kernel` (shared kernel de DDD).

Ningún PR toca más de un bounded context salvo refactors acordados.
Integraciones esperadas, siempre vía eventos de dominio o use case
orquestador, nunca importando repositorios ajenos:

- `ShoppingItemPurchased` → Pantry crea/incrementa InventoryItem
- `RecipeCooked` → Pantry descuenta ingredientes
- Suggestions lee Pantry + Recipes mediante queries, no escribe en ellos

## Multi-tenancy

**Decisión tomada:** row-level con `hogarId` obligatorio en toda entidad
de negocio. `shared/kernel/tenant-prisma.ts` (Prisma Client Extension) lo
inyecta en toda query sobre modelos tenant-scoped; `TenantRepository` es
la base para `infrastructure`. Catalog es global (no tenant-scoped),
salvo productos personalizados del hogar.
<PENDING: ¿un usuario puede pertenecer a varios hogares? — por defecto sí,
con hogar activo en el `AuthContext`>

## Identity

- Registro crea Usuario + Hogar en una transacción
  (`RegisterHouseholdCommand`). Otros miembros entran por invitación.
- Web: Auth.js, `Credentials` + `jwt` en cookie.
- Clientes de la API: <PENDING: mecanismo concreto — por defecto access
  token JWT corto + refresh token rotativo persistido, emitidos por
  `/api/v1/auth/token`>.
- `getAuthContext(): Promise<Result<AuthContext>>`, sin parámetros: lee
  cookie o Bearer con `next/headers` y devuelve el mismo
  `AuthContext { userId, hogarId }`. Los handlers no distinguen. Hasta la
  fase 5 devuelve una identidad de desarrollo
  (`shared/kernel/dev-identity.ts`, creada por `prisma/seed.ts`),
  bloqueada si `NODE_ENV === "production"`.
- Email (invitaciones, reset) detrás del puerto `EmailSender`
  <PENDING: proveedor>.

## Sync

Los clientes offline-first envían una cola de mutaciones. El backend:

- Toda entidad sincronizable tiene `updatedAt` (lo pone el servidor) y
  `deletedAt` (soft delete; los borrados viajan como tombstones).
- `GET /api/v1/sync?since=<cursor>` devuelve cambios + tombstones.
- `POST /api/v1/sync/push` recibe un lote de mutaciones, cada una con
  `clientMutationId`; aplicarla dos veces no tiene efecto (idempotencia).
- Las mutaciones del push pasan por los **mismos** use cases que la API.
- <PENDING: resolución de conflictos — por defecto last-write-wins por
  campo; cambios de cantidad en despensa como operaciones, no valores>

## Recetas

Importación desde EPUB de recetarios con arquitectura híbrida
SQLite/Postgres; detalle en `src/domains/recipes/README.md`.
<PENDING: origen y licencia del catálogo de recetas antes de ofrecerlo
a otros hogares>

## Convenciones de código

1. **Use cases**: sufijo `Command`/`Query` + `execute()`. Un archivo, una
   responsabilidad.
2. **Entidades**: constructor privado, `Entity.create()` valida
   invariantes y devuelve `Result<Entity>`.
3. **Value Objects**: inmutables — `type` + `create()` que valida.
4. **Errores de negocio**: `Result<T>`, nunca `throw` (reservado para
   errores de programación/infraestructura).
5. **Server Actions / Route Handlers**: devuelven `Result<T>` serializable
   o su mapeo HTTP; validan con esquemas de `src/contracts`.
6. **Repositorios**: interfaz en `application/ports`, implementación en
   `infrastructure`; los use cases nunca dependen de Prisma.
7. **Naming**: `kebab-case.ts`, componentes `PascalCase.tsx`.
8. **Tests**: `MethodName_Scenario_ExpectedResult`; dominio con fakes.
9. **Commits**: Conventional Commits.
10. **Imports**: alias `@/` desde `src/`.
11. **TypeScript**: `noUncheckedIndexedAccess` activo; se comprueba el
    `undefined`, nunca se usa `!`.
12. **Tests**: junto al archivo que prueban (`x.ts` → `x.test.ts`).
13. **Value Objects**: tipo marcado (`unique symbol`) para que solo
    `create()` pueda producirlos.

## Qué NO hacer

- No poner lógica solo en una Server Action: los clientes de la API no
  pueden usarla.
- No exponer tipos de Prisma en respuestas de API ni en `contracts`.
- No borrar filas sincronizables con `DELETE`: usar `deletedAt`.
- No generar IDs solo en servidor para entidades creables offline.
- No romper `/api/v1` (renombrar campos, cambiar tipos): se versiona.
- No leer cookies/headers fuera de `app/` y `shared/kernel/auth-context`.
- No guardar cantidades sin unidad ni texto libre donde va un Ingredient
  (aplica a Pantry y Recipes; Shopping admite `nombre` libre).
- No llamar al microservicio Python directamente: siempre vía su puerto.
- No importar `prisma` del kernel en repositorios de modelos de hogar:
  usar `this.db` de `TenantRepository`.
- No usar `$queryRaw`/`$executeRaw` sobre tablas de hogar sin filtrar
  `hogarId` explícitamente.
- No incluir `hogarId` en los datos de un `update`.
- No editar ni borrar una migración ya aplicada: siempre una nueva.
- No aceptar un reset de `prisma migrate dev` mientras local use `main`.

## Seguridad y configuración

- Variables de entorno validadas con Zod en un único `env.ts`.
- Secretos en `.env.local` (gitignored) y en Vercel por entorno.
- Rate limiting en login, emisión de tokens y sync <PENDING: proveedor —
  Upstash Ratelimit por defecto>.

## Infraestructura

**Decisión tomada:**

- **Versionado:** GitHub. `main` = producción (protegida, PR + checks),
  `develop` = staging.
- **Hosting:** Vercel (PR → preview, `develop` → staging, `main` →
  producción). Microservicio Python futuro <PENDING: VPS propio o
  proveedor gestionado>.
- **Base de datos:** Neon, una rama por entorno.
- **CI/CD:** GitHub Actions (lint + typecheck + test por PR); deploy vía
  integración nativa de Vercel.
- **Entornos:** development → staging (`develop`) → production (`main`).

Variables (referencia, nunca valores reales): `DATABASE_URL` (pooled, la
app) y `DATABASE_URL_UNPOOLED` (directa, CLI de Prisma vía
`prisma.config.ts`), nombres de la integración Neon ↔ Vercel;
`AUTH_SECRET`, `AUTH_URL`, credenciales del proveedor de email, secretos
de firma de tokens de la API.

<PENDING: local trabaja contra la rama `main` de Neon. Antes del primer
usuario real: `.env.local` pasa a la rama `development` y se borran de
`main` las filas del seed>

- Migraciones: `migrate dev` solo en local; producción con
  `migrate deploy` en el despliegue <PENDING: script en el build de Vercel>.
  En Prisma 7, `generate` y `db seed` se ejecutan siempre a mano.
- CI: necesita `DATABASE_URL`/`DATABASE_URL_UNPOOLED` falsas porque
  `prisma generate` (postinstall) carga `prisma.config.ts`.

## How to evolve this file

- Cuando se tome una decisión firme que afecte a cómo se construye el
  proyecto, propón un diff a este archivo en la misma sesión.
- Antes de proponer un diff: lee el archivo completo primero.
- Reemplaza un `<PENDING: ...>` por la decisión real en cuanto se tome.
- Si una sección describe algo obvio leyendo el código, recórtala.
- Patrones distintos para el mismo problema: unificar explícitamente.
- Mantén el archivo por debajo de 200 líneas; lo que crezca se mueve al
  README del bounded context y aquí queda la referencia.
