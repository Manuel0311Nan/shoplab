# CLAUDE.md

Memoria persistente del proyecto. Léelo al inicio de cada sesión. Documenta
decisiones tomadas, no aspiraciones. Si el código contradice este archivo,
el código manda y este archivo debe actualizarse (ver sección final).

Las buenas prácticas generales (reutilizables en otros proyectos) están en
@AGENTS.md. Este archivo recoge solo lo específico de Migas.

## Proyecto

**Nombre:** Migas (marca pública y paquete `migas`). La carpeta local y el
repositorio de GitHub conservan por ahora el nombre `shoplab`.
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
- **Autenticación:** Better Auth (versión exacta fijada): cookie en la web
  y `Authorization: Bearer` para la app (ver Identity)
- **Estado:** lectura en Server Components; mutaciones con Server
  Actions + `useOptimistic` (React 19). TanStack Query solo para polling
  y revalidación sin acción del usuario. Zustand para estado UI local
- **Estilos:** Tailwind CSS v4 + shadcn/ui (alias a `@/shared/ui`)
- **Formularios:** ricos con React Hook Form + Zod; sencillos (login,
  crear lista) con `<form action>` + `useActionState`
- **Testing:** Vitest (`src/**/*.test.ts`, entorno node) + Playwright
  <PENDING: e2e del flujo principal de cada vista>
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
    infrastructure/   → repositorios Prisma, adaptadores externos, <contexto>-module.ts
    testing/          → builders, fakes en memoria, suites de contrato
  shared/
    kernel/           → Result, errores, Unidad/Cantidad, auth-context,
                        prisma (singleton), tenant-prisma, tenant-models, TenantRepository
    kernel/           → también Clock, newId() (UUIDv7, válido en cliente) y auth.ts (Better Auth)
    lib/              → utilidades de UI (cn)
    sync/             → motor de sincronización (ver Sync)
    ui/               → componentes UI agnósticos de dominio (shadcn)
  app/
    _lib/<contexto>/    → mappers dominio → DTO, compartidos por API, actions y páginas
    _lib/auth/          → authClient (navegador), rutaSegura, mensajes de error de login
    (auth)/             → /login, /registro, /bienvenida (sin cabecera de la app)
    (marketing)/        → / home pública; con sesión válida redirige a /listas
    api/_lib/           → apiRoute(), parse, Result → HTTP
    api/v1/.../route.ts → API pública (rutas en inglés: /api/v1/lists)
    actions/            → Server Actions (solo web), delgadas
    (app)/<ruta>/       → UI (rutas en español: /listas)
      page.tsx          → Server Component: loader → DTO → pantalla
      _data.ts          → loader envuelto en cache(), compartido con generateMetadata
      loading.tsx, error.tsx, not-found.tsx → obligatorios en rutas con datos
      _components/      → componentes de esa ruta; reciben solo DTO de contracts
```

Plantilla por vista (la vista 1, `listas/[listId]`, es la referencia):
`<contexto>-errors.ts` → agregado → puerto → commands/queries → fake y
builders en `testing/` → repositorio Prisma → `<contexto>-module.ts` →
`contracts/<contexto>.ts` → `api/v1/<recurso>/` → `actions/<recurso>.ts`
→ `(app)/<ruta>/`. Los enums del contrato duplican los del kernel y un
test de paridad los mantiene iguales.

Regla dura: ni `route.ts` ni `page.tsx` ni una Server Action contienen
lógica de negocio. Validan input → llaman a un use case → mapean
resultado.

Reglas aplicadas por ESLint:

- `no-restricted-imports`: Prisma y `@/generated/*` solo desde
  `shared/kernel` e `infrastructure/`.
- `boundaries/dependencies`: `domain` → kernel; `application` → domain y
  kernel; `infrastructure` → application, domain, kernel, generated y env;
  `kernel` → generated y env; `ui` → `shared/lib`. `contracts` no importa
  `domains/`: los tests de paridad contrato ↔ dominio viven en `app/_lib/`. Entre capas de
  `domains/`, solo dentro del mismo contexto. Los tests pueden importar
  `testing/` y el kernel.

Route Handlers: siempre con `apiRoute({ ids, query, body, auth }, handler)`, que
autentica, valida ids (UUID), parámetros de la URL y cuerpo, y convierte excepciones en 500
con el contrato de error. El handler solo llama al use case y mapea con
`mapResult`. `auth: "identidad"` para rutas que no exigen hogar (crearlo).
Excepciones: `/api/v1/auth/[...all]` (Better Auth, con su propio formato
de error) y `/api/cron/*` (fuera de v1: solo las llama Vercel Cron con
`Authorization: Bearer CRON_SECRET`, comprobado con `esLlamadaDeCron`).

## UI: mobile first (decisión tomada)

El producto nace para el móvil, aunque hoy solo exista la web.

- Se diseña para 360 px de ancho y se amplía con `sm:`/`md:`; nunca al revés.
- Objetivo táctil mínimo de 44 × 44 px en todo lo pulsable (botón visible
  de 40 px + área invisible con `after:` si el espacio no da para más).
  Acciones principales e inputs: `h-11`.
- Nada depende solo de `hover`; el texto importante no se trunca (salta
  de línea).
- Sistema visual del diseño de Stitch en `globals.css` (tokens de shadcn);
  los componentes nunca usan hex.
- PWA instalable: `app/manifest.ts`, iconos en `public/icons/` y
  `app/{icon,apple-icon}.png`, generados del logo. Sin service worker hasta
  el modo sin conexión (Sync).

## API pública (decisión tomada)

- `/api/v1` es el contrato canónico. Cada capacidad de la web existe como
  Route Handler; una Server Action es un atajo de la web que llama al
  **mismo** use case, nunca la única vía para hacer algo.
- Versionado en la URL. Cambios incompatibles → `/api/v2`; v1 no se rompe.
- Errores con forma única `{ error: { code, message, details? } }`;
  `code` es estable y se mapea desde el `Result` del use case.
- Paginación por cursor, no por offset: `{ items, nextCursor }`
  (`contracts/pagination.ts`), cursor opaco de `shared/kernel/cursor.ts`.
  Solo se pagina lo que tiene un orden estable: las listas activas (máx.
  15, ordenadas por `updatedAt`, que cambia al editar) van en una página.
- Errores que piden una decisión al usuario llevan los datos en `details`
  (esquemas en contracts): `LIMITE_DE_LISTAS` (activas entre las que
  elegir), `POSIBLE_DUPLICADO` y `UNIDADES_DISTINTAS` (el ítem existente).
- Fechas ISO 8601 en UTC; cantidades con unidad explícita (VO `Cantidad`).
- IDs UUIDv7 que puede generar el cliente (necesario para crear offline).
- Nada de la capa `application` conoce cookies, `redirect()` ni headers:
  la identidad llega como `AuthContext` ya resuelto.

## Bounded Contexts (DDD)

Modelo de tres niveles: **Ingredient** (concepto canónico: "tomate") →
**Product** (lo que se compra: marca/formato) → **InventoryItem** (lo que
hay en casa: cantidad, caducidad, ubicación).

- **Catalog**: Ingredient y Product, sinónimos, unidades y conversiones
- **Pantry** (core): `Ubicacion` (por hogar, máx. 12, con tipo frío,
  congelado o ambiente para proponer dónde va cada categoría; el alta del
  hogar crea Nevera, Congelador y Armario) e `InventoryItem`: una línea por
  producto, ubicación y caducidad opcional (`Dia`, sin hora). Sin fechas,
  el mismo producto en la misma ubicación es una sola línea que suma. Cada
  cambio de cantidad devuelve un `MovimientoDespensa` (entrada, consumo,
  desecho, ajuste, baja) que se guarda con la línea en una transacción.
  Máx. 500 líneas vivas por hogar, sin paginar. Un solo
  `PantryRepository` para ubicaciones, líneas y movimientos.
  Paquetes abiertos: «Lo he abierto» guarda `abiertoEl` y fija en la línea
  los días de aviso (`avisoAbierto`: amarillo, rojo). No cambia la
  caducidad: avisa en verde, amarillo («revísalo») o rojo («mira si sigue
  bueno») según los días que lleva abierto (`estadoAbierto`, kernel). Los
  días salen de la excepción del producto en la lista base
  (`AVISO_ABIERTO`) o de su categoría (`AVISO_ABIERTO_POR_CATEGORIA`);
  fruta, verdura, limpieza e higiene no se abren. Con varias unidades se
  abre una: se separa en su línea (ajustes, no compra ni consumo). Abierta
  y cerrada son líneas distintas: la compra nunca suma en una abierta.
  Memoria de ubicación (`UbicacionRecordada`, por nombre normalizado): se
  apunta cuando el usuario elige sitio (alta, guardar la compra, mover). Se
  propone con `ubicacionParaProducto` (la recordada si sigue viva; si no, por
  categoría), en el servidor y en los formularios. Al borrar una ubicación lo
  recordado pasa al destino de sus productos o, si estaba vacía, se olvida
- **Catalog (hoy)**: `ProductoBase`, la lista base global (328 productos
  y sus sinónimos en `lista-base.data.ts`, cargados por `prisma db seed`
  sin transacción larga e ids UUID v5), y `ProductoRecordado`, la memoria
  de cada hogar para el texto libre. Texto libre conectado (D1 de la vista
  3): lista y despensa guardan el nombre escrito + `productoBaseId`
  opcional; `ResolverProductoQuery` vincula (elegido, nombre o sinónimo de
  la lista base) y decide la categoría (memoria del hogar, lista base u
  «otros»). Se descarga entero y se filtra en el cliente.
  Editar nombres: un ítem o una línea se renombra con `producto` en su PATCH
  (el catálogo vincula y decide la categoría). «Mis productos» (`/productos`,
  `app/_lib/catalog/mis-productos.ts`) muestra el texto libre del hogar y
  estandariza en todo el hogar: `EstandarizarProductoCommand` (memoria; al
  unir suma usos, al vincular a la lista base olvida el texto libre),
  `RenombrarEnListasCommand` (listas activas), `RenombrarEnDespensaCommand`
  (despensa, junta líneas iguales y mueve la ubicación recordada) y
  `EditarPackCommand`. No es una transacción entre contextos: el orden es
  memoria → listas → despensa → pack y se puede repetir sin daño. Los posibles
  duplicados salen de `claveParecida` (sin plurales, tildes, palabras vacías
  ni orden)
- **Categorías**: las 15 de la lista base + «otros», en el kernel y en el
  orden del súper (`compararCategorias`). Cada línea de lista y despensa
  guarda la suya y se puede cambiar; cambiarla la recuerda el hogar
- **Shopping**: listas, ítems, estado comprado, lista por tienda/pasillo.
  Máximo 15 listas activas por hogar (`MAX_LISTAS_ACTIVAS`): crear o
  desarchivar la 16.ª exige `archivarListaId` y el intercambio se guarda en
  una transacción (`guardarVarias`). Las archivadas se borran a los 15 días:
  las consultas las ocultan desde ese momento y el cron diario
  `/api/cron/purgar-listas` las marca con `deletedAt`. Un producto parecido
  (mismo `productoBaseId` o mismo `normalizarNombre`) no se añade sin que
  el usuario elija `duplicado: "unir" | "separar"`; al unir, g↔kg y ml↔l
  se convierten y entre familias distintas se pide `cantidadFinal`.
  Un ítem tiene `nombre` libre + `productoBaseId` y categoría (ver Catalog),
  cantidad obligatoria (la UI propone 1 ud.) y
  `compradoAt` en lugar de booleano. Comprado y cantidad se cambian con
  un único `UpdateItemCommand` (PATCH atómico).
  Lista general (`ShoppingList.general`): una por hogar, la crea el alta
  del hogar (y la migración para los existentes). Va primero, no se archiva
  ni se borra (`LISTA_GENERAL`) y no cuenta para el límite de 15. Su vista
  (`vistaGeneral`) junta sus ítems con los de todas las activas; cada ítem
  lleva `listaId`/`listaNombre` y las acciones van a la lista de origen, así
  que cambiar o quitar en una se ve en la otra. Lo añadido en la general solo
  vive ahí. Terminar compra en la general termina todas («conservarPendientes»).
  Packs: se guardan en unidades con `unidadesPorPack` (2..100, solo con
  unidad «unidad»); el stepper sube de pack en pack y si la cantidad deja de
  ser un número entero de packs se quita el pack. Memoria de packs
  (`PackRecordado`, por nombre normalizado): cada alta apunta el tamaño y si
  fue por packs (`packTrasAlta`); los formularios (lista y «Añadir a la
  lista» de la despensa) proponen el pack con `propuestaDeUnidad`
- **Recipes** (vista 4): biblioteca global de solo lectura (`Receta`,
  `RecetaIngrediente`). Cada ingrediente nombra productos de la lista base
  que lo cubren (alternativas, el primero es el que se compra), cantidad
  para las raciones de la receta (o sin cantidad y con nota: «2 dientes») y
  dos marcas: `basico` (de fondo de armario: sal, aceite, ajo, especias; no
  se comprueba) y `opcional` (no bloquea). `evaluarReceta` cruza la receta
  con las existencias de la despensa (por `productoBaseId` o por nombre):
  se puede hacer si están todos los obligatorios; las raciones se ajustan
  al ingrediente que da para menos, sin pasar de las de la receta; al
  editar raciones, lo que no llega sale como «poco»/«falta». g↔kg y ml↔l se
  convierten; si una línea no se puede medir (ud. frente a g), cuenta como
  que hay. `calcularIngrediente` es pura y la usa también la pantalla
- **Suggestions** (core): motor de puntuación de recetas según despensa,
  caducidades próximas y preferencias. Detalle en
  `src/domains/suggestions/README.md`
- **Households**: hogar, miembros, invitaciones (tenant). El hogar se crea
  después del registro, en `/bienvenida` (`CreateHouseholdCommand`, id
  generado en el cliente para que un doble envío no cree dos). La primera
  lista y las ubicaciones se crean en `app/_lib/households/alta-hogar.ts`,
  llamando a Shopping y Pantry: excepción temporal hasta tener eventos

Entre contextos, sin eventos todavía: orquestadores en `app/_lib/<contexto>/`
que llaman a los módulos de varios contextos y los usan igual la API y las
Server Actions (`productos-con-catalogo.ts`, `despensa-con-catalogo.ts`,
`alta-hogar.ts`, `recetas-con-despensa.ts`). Guardar la compra en la despensa es uno: lo decide el
usuario en la hoja «Guardar en la despensa», no el hecho de marcar.

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
Todo modelo con `hogarId` va en `TENANT_MODELS` o en `TENANT_EXCLUDED`
(con motivo), en `shared/kernel/tenant-models.ts`. Lo comprueba
`tenant-models.test.ts` leyendo el schema.

Lo que la extensión **no** filtra:

- `include`/`select` de relaciones (las consultas anidadas no pasan por
  la extensión). Solo es seguro si el padre ya está filtrado.
- `$queryRaw`/`$executeRaw`.
- Un `upsert` con un id de otro hogar no lo modifica, pero falla con un
  error de clave primaria (500).

<PENDING: ¿un usuario puede pertenecer a varios hogares? — por defecto sí,
con hogar activo en el `AuthContext`>

## Identity

**Decisión tomada:** Better Auth (no Auth.js, en mantenimiento desde 09/2025).

- Instancia en `shared/kernel/auth.ts`: email y contraseña (8-128, scrypt),
  `Usuario` hace de tabla `user` (`modelName: "usuario"`, `name` → `nombre`),
  sesiones en BD de 30 días (tabla `Session`), hash en `Account.password`,
  ids con `newId()`, límite de peticiones en Postgres (`RateLimit`).
- Endpoints en `/api/v1/auth/*` (`basePath`). La web y la app usan los mismos.
- Registro = solo el usuario (`autoSignIn`); el hogar se crea en `/bienvenida`.
- App móvil: plugin `bearer`. Tras el login, la cabecera `set-auth-token` es
  el token; se envía como `Authorization: Bearer`. Misma sesión, revocable.
- `getIdentity()` → `{ userId, nombre, email }` o `NO_AUTENTICADO` (401).
  `getAuthContext()` → `{ userId, hogarId }`, `NO_AUTENTICADO` o `SIN_HOGAR`
  (403 → la web manda a `/bienvenida`). Ambas con `cache()`; leen cookie o
  Bearer sin distinguir. Hogar activo: el más antiguo (`elegirHogarActivo`).
- Protección en dos capas: `middleware.ts` solo mira si existe la cookie
  (sin ella, a `/login`; runtime Node; públicas: `/`, `/login`, `/registro`); la seguridad real es `getAuthContext()`
  / `getIdentity()` en cada página, Server Action y endpoint. El middleware
  nunca saca de `/login` por tener cookie: con una caducada habría bucle.
- Login y registro desde el navegador con `authClient` (acción de cliente en
  `useActionState`): así pasan por el límite de peticiones.
- Variables: `BETTER_AUTH_SECRET` (≥ 32 caracteres, una por entorno) y
  `BETTER_AUTH_URL`. En Vercel, `VERCEL_URL` se añade a `trustedOrigins`.
- Fuera de alcance hasta la vista 6: verificación de email, restablecer
  contraseña (`EmailSender` <PENDING: proveedor>) e invitaciones.

## Sync

Los clientes offline-first envían una cola de mutaciones. El backend:

- Toda entidad sincronizable tiene `updatedAt` (lo pone el servidor) y
  `deletedAt` (soft delete; los borrados viajan como tombstones). Hoy cada
  repositorio filtra `deletedAt: null` a mano <PENDING: ¿extensión de
  Prisma?>.
- `GET /api/v1/sync?since=<cursor>` devuelve cambios + tombstones.
- `POST /api/v1/sync/push` recibe un lote de mutaciones, cada una con
  `clientMutationId`; aplicarla dos veces no tiene efecto (idempotencia).
- Las mutaciones del push pasan por los **mismos** use cases que la API.
- <PENDING: resolución de conflictos — por defecto last-write-wins por
  campo; cambios de cantidad en despensa como operaciones, no valores>

## Recetas

La biblioteca vive en el repo como lotes JSON
(`domains/recipes/infrastructure/biblioteca/lote-NNN.json`), validados con
Zod y contra la lista base (`app/_lib/recipes/biblioteca.test.ts`).
`prisma db seed` los carga (`prisma/seed-recetas.ts`: ids UUID v5 del slug,
reescribe una receta si cambia su huella y borra las que ya no están en
ningún lote). La app solo lee la BD.

Lotes nuevos: `pnpm tsx scripts/generar-recetas.ts [cantidad] [tema]` con
`ANTHROPIC_API_KEY` en `.env.local` (nunca en Vercel). Escribe solo las
recetas que pasan la validación; el lote se revisa a mano en un PR antes
de sembrar. El lote 1 (61 recetas caseras) se escribió así, a mano.
Recetas escritas para Migas: no copiar textos de webs ni de libros.

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
    Cada puerto de repositorio tiene una suite de contrato en `testing/`
    que pasan el fake en memoria (`pnpm test`) y Prisma
    (`pnpm test:integration`, contra `TEST_DATABASE_URL`; antes,
    `pnpm db:migrate:test`, que se niega si apunta a la rama de la app). La CI exige
    cobertura ≥ 95 % de líneas en domain, application, kernel y `api/_lib`.
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
- No guardar cantidades sin unidad. El texto libre de lista y despensa va
  siempre por el orquestador que lo vincula al catálogo (D1, vista 3).
- No añadir recetas a la BD a mano ni desde la app: van en un lote JSON y
  pasan por el seed. Un producto que no está en la lista base no vale.
- No guardar caducidades como instante: son `Dia` (`@db.Date`), y «hoy» se
  calcula con `hoyEn(ZONA_HOGAR, clock)` en el servidor.
- No cambiar la cantidad de una línea de despensa sin su movimiento.
- No guardar «pack» como unidad: son unidades + `unidadesPorPack`.
- No hacer que falle una operación por la memoria del hogar (packs, ubicaciones,
  productos recordados): se lee y escribe en `try/catch` y se sigue.
- No revalidar `/listas/${id}`: con la lista general hay que revalidar
  `revalidatePath("/listas/[listId]", "page")`.
- No duplicar la lógica de la lista en la vista rápida (`vista-rapida.tsx`): usa
  las mismas acciones (`marcar`, `cambiarCantidad`, `quitar`); el toque largo va
  por `usePulsacionLarga`, que ignora el scroll.
- No pedir confirmación para gastar: «−1» (en unidades) y los atajos ¼ · ½ · todo
  se aplican al momento; el aviso flotante ofrece «Deshacer»
  (`DeshacerConsumoCommand`, ajuste con margen de `MINUTOS_PARA_DESHACER`) y,
  si se acaba o queda poco, «A la lista» con el pack recordado. Nada de diálogos
  que interrumpan tras gastar.
- No tratar «abierto» como caducidad ni decir «tíralo»: es un aviso para
  revisar. Los días se cambian en la lista base o en el kernel, no en la UI.
- No importar un repositorio de otro contexto: orquestador en `app/_lib`.
- No llamar al microservicio Python directamente: siempre vía su puerto.
- No importar `prisma` del kernel en repositorios de modelos de hogar:
  usar `this.db` de `TenantRepository`.
- No usar `$queryRaw`/`$executeRaw` sobre tablas de hogar sin filtrar
  `hogarId` explícitamente.
- No incluir `hogarId` en los datos de un `update`.
- No editar ni borrar una migración ya aplicada: siempre una nueva.
- No cambiar `schema.prisma` sin su migración: el job `migrations` de la CI
  aplica todas sobre un Postgres vacío y falla si hay drift.
- No escribir un Route Handler sin `apiRoute`.
- No añadir comportamiento a un fake sin cubrirlo en la suite de contrato.
- No aceptar un reset de `prisma migrate dev` mientras local use `main`.
- No escribir una Server Action sin validar **todos** sus argumentos con
  Zod (ids incluidos): son endpoints públicos aunque no lo parezcan.
- No añadir un modelo con `hogarId` sin ponerlo en `TENANT_MODELS` o en
  `TENANT_EXCLUDED`.
- No usar `uuid` aleatorios ni `new Date()` en dominio: `newId()` y `Clock`.
- No hacer login o registro con `auth.api.*` desde el servidor (Server
  Action): esas llamadas no pasan por el límite de peticiones.
- No confiar en `middleware.ts` para la seguridad: la cookie se puede
  inventar. Cada página, acción y endpoint valida con `getAuthContext()`.
- No redirigir a un `?next=` sin `rutaSegura()` (redirección abierta).
- No importar `shared/kernel/auth.ts` desde un componente de cliente: el
  navegador usa `app/_lib/auth/auth-client.ts`.

## Seguridad y configuración

- Variables de entorno validadas con Zod en un único `env.ts`.
- Secretos en `.env.local` (gitignored) y en Vercel por entorno.
- `CRON_SECRET` (opcional en local; obligatoria en Vercel Production para
  que corra el cron).
- Rate limiting: el de Better Auth en `/api/v1/auth/*` (solo en producción,
  contadores en la tabla `RateLimit`). Sync <PENDING: cuando exista>.

## Infraestructura

**Decisión tomada:**

- **Versionado:** GitHub. `main` = producción (protegida, PR + checks),
  `develop` = staging <PENDING: la rama `develop` aún no existe; hoy se
  trabaja en ramas de feature con PR a `main`>.
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

<PENDING, OBLIGATORIO ANTES DE DESPLEGAR: local trabaja contra la rama
`main` de Neon y el seed crea `dev@migas.local` con contraseña conocida.
`.env.local` pasa a la rama `development` y se borran de `main` las filas
del seed>

- Migraciones: `migrate dev` solo en local; producción con
  `migrate deploy` en el despliegue <PENDING: script en el build de Vercel>.
  En Prisma 7, `generate` y `db seed` se ejecutan siempre a mano.
- CI: necesita `DATABASE_URL`/`DATABASE_URL_UNPOOLED` falsas porque
  `prisma generate` (postinstall) carga `prisma.config.ts`.

## Estado de las vistas

1. Lista de la compra (`/listas/[listId]`): hecha.
2. Registro y login (adelantada): hecha.
3. Mis listas (`/listas`): hecha.
4. Despensa (`/despensa`) y categorías en la lista: hecha. Plan y
   decisiones D1–D9 en el documento «Migas · Plan de la vista Despensa».
5. Recetas (`/recetas`, `/recetas/[recetaId]`): hecha en `feat/recetas`
   (producto mínimo: sugerencias con lo que hay, raciones ajustables y lo
   que falta a la lista). Pendiente: migración `recetas` y seed en
   producción; descontar ingredientes al cocinar (`RecipeCooked`).

- Home pública (`/`, `(marketing)`): hecha. Textos del «Plan de marketing —
  Migas»; capturas reales en `(marketing)/_img` (rehacerlas si cambian las
  pantallas). «Cómo funciona» es un carrusel con scroll-snap (móvil y
  ordenador); el paso 4 enseña la pantalla de Recetas. Premium sale como
  «Próximamente» con el precio de hipótesis del plan.

Plan completo y orden en la guía de vistas (`docs/shoplab-guia-vista.pdf`).
Antes de empezar una vista nueva, preguntar a Manuel.

## How to evolve this file

- Cuando se tome una decisión firme que afecte a cómo se construye el
  proyecto, propón un diff a este archivo en la misma sesión.
- Antes de proponer un diff: lee el archivo completo primero.
- Reemplaza un `<PENDING: ...>` por la decisión real en cuanto se tome.
- Si una sección describe algo obvio leyendo el código, recórtala.
- Patrones distintos para el mismo problema: unificar explícitamente.
- Mantén el archivo por debajo de 200 líneas; lo que crezca se mueve al
  README del bounded context y aquí queda la referencia.
