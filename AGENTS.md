# AGENTS.md

Buenas prácticas para construir código de calidad con agentes de IA (Claude
Code, Codex, Cursor, Copilot…) sobre un stack **Next.js full-stack + Clean
Architecture + DDD**. Sale de lo aplicado y comprobado en Migas.

- **Este archivo es genérico y reutilizable.** Lo específico del proyecto
  (dominio, decisiones, pendientes) va en `CLAUDE.md`. Si se contradicen,
  manda `CLAUDE.md`. Y si el código contradice a los dos, manda el código y
  hay que actualizar el documento.
- **Para reutilizarlo en otro proyecto:** cópialo, revisa la sección 2
  (stack) y la 13 (checklist de arranque) y borra lo que no aplique. Los
  ejemplos citan nombres de Migas (`hogarId`, `ShoppingList`…); en otro
  proyecto serán `tenantId`, `Order`, etc.

---

## 1. Cómo trabajar con un agente

### Ciclo de trabajo

1. **Leer antes de escribir.** Lee `AGENTS.md`, `CLAUDE.md` y `README.md`,
   y después el código real que vas a tocar. Una guía, un plan o un
   documento de traspaso nunca sustituyen a mirar el repo: el código puede
   ir por delante o por detrás.
2. **Plan corto** con los archivos afectados y las preguntas abiertas.
   Las decisiones de negocio las toma la persona, no el agente.
3. **Trabajar en una rama**, nunca en `main`. Un cambio lógico por commit.
4. **Verificar ejecutando, no suponiendo:** `pnpm lint`,
   `pnpm typecheck`, `pnpm test:coverage` y, cuando haya rutas o
   configuración en juego, `pnpm build`. "Debería funcionar" no vale.
5. **Comprobar que las protecciones fallan cuando deben.** Una regla de
   lint, un test de arquitectura o un guard nuevos se prueban con un caso
   que los incumpla a propósito (un archivo trampa) y luego se borra.
   Un test que nunca ha fallado no demuestra nada.
6. **PR con la CI en verde**, revisado por una persona.
7. **Actualizar la documentación en el mismo cambio** si cambia una
   convención (`AGENTS.md`/`CLAUDE.md`) o una decisión (`docs/decisiones.md`).

### Reglas para el agente

- **No inventar APIs de librerías.** Antes de usar una opción, un flag o
  una sintaxis, compruébalo en la documentación de la **versión
  instalada** o en el propio paquete (`node_modules/<pkg>`, su `.d.ts`, el
  `--help` del CLI). Las versiones mayores cambian la sintaxis: pasó con
  Prisma 7 (`migrate diff`) y con `eslint-plugin-boundaries` 7.
- **Antes de corregir algo, confirmar que es un error.** En Migas se
  marcó como fallo un paquete (`cn`) que en realidad es el que recomienda
  la versión actual de shadcn. Si te equivocas, dilo y corrígelo.
- **Preguntar antes de cualquier cosa irreversible:** borrar archivos,
  migraciones, resets de BD, force push o cambiar de entorno.
- **No ampliar el alcance sin avisar.** Si aparece un problema fuera de
  la tarea, se anota y se propone; no se arregla de paso.
- **No duplicar lógica para "ir rápido".** Si algo se repite tres veces,
  se extrae (como `apiRoute`); si una forma nueva de hacer algo convive
  con la antigua, se elimina la antigua.
- **Mensajes de error accionables:** qué ha fallado y qué hacer para
  arreglarlo, en el idioma del proyecto.
- **Windows/PowerShell:** para probar la API, `curl.exe` (no `curl`). Las
  variables de entorno en scripts de npm no se fijan con `VAR=x cmd`; usa
  un script de Node/tsx.

### Qué NO hacer

- No confiar en código de guías o de otros chats que nunca se ha compilado.
- No dar una tarea por terminada sin haber ejecutado las comprobaciones.
- No relajar una regla de lint, un umbral de cobertura o un test para
  que pase la CI. Se arregla el código, o se discute la regla aparte.
- No dejar código muerto: si un comando o método deja de usarse, se borra.

---

## 2. Stack de referencia

| Área       | Elección                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| Framework  | Next.js (App Router), web + API pública en el mismo proyecto              |
| Lenguaje   | TypeScript estricto + `noUncheckedIndexedAccess`, target ES2023, ESM      |
| BD / ORM   | PostgreSQL (Neon) + Prisma con driver adapter; cliente en `src/generated` |
| Validación | Zod en todos los bordes (API, Server Actions, env)                        |
| Auth       | Auth.js para la web y tokens Bearer para clientes de la API               |
| UI         | Tailwind + shadcn/ui (en `shared/ui`), React Hook Form                    |
| Estado     | Server Components + Server Actions + `useOptimistic`; Zustand para UI     |
| Tests      | Vitest (unitarios, contrato, integración) + Playwright (e2e)              |
| Calidad    | ESLint (con tipos) + Prettier + Husky + lint-staged                       |
| CI / Host  | GitHub Actions + Vercel                                                   |
| Paquetes   | pnpm; el lockfile se versiona y la CI usa `--frozen-lockfile`             |

Las versiones mayores se fijan. Migrar a una nueva (Next, Prisma…) es una
decisión aparte, en su propio PR.

---

## 3. Arquitectura

Clean Architecture + DDD. Las dependencias apuntan hacia dentro.

```
src/
  env.ts                  única lectura de process.env (Zod, server-only)
  contracts/              esquemas Zod de la API pública (sin Prisma ni dominio)
  generated/              cliente de Prisma generado (no se versiona)
  domains/<contexto>/
    domain/               entidades, value objects, errores. TypeScript puro
    application/          use cases (Command/Query) y puertos (interfaces)
    infrastructure/       repositorios Prisma, mappers, <contexto>-module.ts
    testing/              builders, fakes en memoria, suites de contrato
  shared/
    kernel/               Result, errores, VOs compartidos, Clock, ids, auth, tenancy
    lib/                  utilidades de UI (cn)
    ui/                   componentes shadcn, sin lógica de negocio
  app/
    api/_lib/             apiRoute, parse, Result → HTTP
    api/v1/…/route.ts     API pública
    _lib/<contexto>/      mappers dominio → DTO
    actions/              Server Actions (atajos de la web)
    (rutas)/              page, _data.ts, loading, error, not-found, _components/
```

### Reglas de capas (las hace cumplir ESLint, sección 8)

| Capa             | Puede importar                                             |
| ---------------- | ---------------------------------------------------------- |
| `domain`         | kernel y su propio dominio                                 |
| `application`    | kernel, y dominio y aplicación de su contexto              |
| `infrastructure` | kernel, generated, env, y capas de su contexto             |
| `testing`        | kernel, y dominio y aplicación de su contexto              |
| `kernel`         | generated y env                                            |
| `ui`             | `shared/lib`                                               |
| `app`            | todo lo anterior salvo `testing` (y Prisma solo vía repos) |
| tests (`*.test`) | además, `testing/` y el kernel                             |

Entre contextos no se importa nada. Se integran por eventos de dominio o
por un use case orquestador.

### Patrones

- **`Result<T>` para errores de negocio.** `throw` solo para errores de
  programación, de infraestructura o de configuración.

  ```ts
  export type Result<T, E = AppError> =
    { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
  export const mapResult = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
    r.ok ? ok(fn(r.value)) : r;
  ```

- **`AppError`** con `type` (`validation | not_found | conflict |
forbidden | unauthorized`, que decide el status HTTP) y `code` estable
  (`LISTA_NO_ENCONTRADA`). Cada contexto agrupa los suyos en un objeto
  (`ShoppingErrors.listaArchivada()`).
- **Entidades:** constructor privado, `create()` que valida y devuelve
  `Result`, `rehydrate()` para reconstruir desde la BD sin revalidar, y
  `toSnapshot()` con el estado inmutable.
- **Value objects:** tipo marcado con `unique symbol` y `create()` que
  valida. Así solo `create()` puede producirlos.

  ```ts
  declare const brand: unique symbol;
  export type Cantidad = {
    readonly valor: number;
    readonly unidad: Unidad;
    readonly [brand]: true;
  };
  ```

- **Agregados:** la raíz garantiza las invariantes y registra qué cambió
  (`itemsModificados()`), para que el repositorio guarde solo eso. Una
  operación que cambia varias cosas a la vez es **un método del agregado**
  (`actualizarItem(id, { cantidad?, comprado? })`): o se aplica todo o
  nada.
- **Use cases:** una clase por caso, sufijo `Command`/`Query`, método
  `execute(input)`. Validan la entrada antes de tocar el repositorio y
  llaman a `save` una sola vez.
- **Puertos e inyección:** los use cases reciben interfaces (repositorio,
  `Clock`). Nada de `new Date()` ni de ids aleatorios dentro del dominio:
  se inyecta `Clock` y se usa `newId()` (UUIDv7).
- **Composition root:** `<contexto>-module.ts` en `infrastructure/`
  instancia repositorios y use cases. `app/` nunca hace `new` de un
  repositorio.

### Qué NO hacer

- No poner lógica de negocio en `route.ts`, `page.tsx` ni en Server Actions.
- No importar Prisma fuera de `infrastructure/` y `shared/kernel`.
- No pasar entidades ni tipos de Prisma a los componentes: solo DTO.
- No encadenar varios use cases en un handler para una sola operación del
  usuario: eso es un use case (o un método del agregado).

---

## 4. API pública

- **Paridad web/API.** Todo lo que hace la web existe en `/api/v1`. Las
  Server Actions son atajos que llaman a **los mismos** use cases.
- **Contratos en `src/contracts`:** esquemas Zod de entrada y salida, sin
  Prisma ni dominio. Si un enum del dominio se repite en el contrato, se
  añade un test de paridad.
- **Versionado en la URL.** Un cambio incompatible significa `/api/v2`.
- **Forma única de error:** `{ error: { code, message, details? } }`. Los
  errores de validación incluyen `details.campos`.
- **Errores inesperados:** 500 con el mismo contrato y sin detalles
  internos. El detalle va al log del servidor.
- IDs UUIDv7 generables en el cliente, fechas ISO 8601 en UTC, paginación
  por cursor, cantidades siempre con unidad.

### `apiRoute`: un único envoltorio para todos los Route Handlers

Autentica, valida los ids como UUID y el cuerpo con Zod, y captura las
excepciones (dejando pasar `redirect`/`notFound` con `unstable_rethrow`).
El handler solo llama al use case y mapea el resultado.

```ts
export const PATCH = apiRoute(
  { ids: ["listId", "itemId"], body: updateItemRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await shoppingModule(auth).updateItem.execute({
      ...ids,
      ...body,
      usuarioId: auth.userId,
    });
    return resultResponse(mapResult(result, toShoppingItemResponse));
  },
);
```

Los nombres de `ids` deben coincidir con las carpetas (`[listId]`). Lo
comprueban `next typegen` y `tsc`.

### Qué NO hacer

- No escribir un Route Handler sin `apiRoute`.
- No devolver la página HTML de error de Next a un cliente de la API.
- No exponer `type` interno, trazas ni mensajes de Prisma en las respuestas.
- No romper `/api/v1`: ni renombrar campos ni cambiar tipos.
- No crear funcionalidad que solo exista como Server Action.

---

## 5. Datos, Prisma y multi-tenancy

- **Row-level tenancy:** columna `tenantId` (en Migas, `hogarId`) en
  cada modelo del tenant. Una Prisma Client Extension la inyecta en toda
  consulta de los modelos de `TENANT_MODELS`, y los repositorios heredan
  de `TenantRepository` y usan `this.db`.
- **Todo modelo con `tenantId` va en `TENANT_MODELS` o en
  `TENANT_EXCLUDED` con su motivo.** Lo comprueba un test que lee
  `schema.prisma`. Las tablas de relación usuario↔tenant (`MiembroHogar`)
  se excluyen: hay que consultarlas entre tenants.
- **Lo que la extensión no filtra:** `include`/`select` anidados (solo
  son seguros si el padre ya está filtrado), `$queryRaw`/`$executeRaw`, y
  un `upsert` con un id de otro tenant (no lo modifica, pero falla con un
  error de clave primaria).
- **Soft delete** con `deletedAt` y `updatedAt` en todo lo sincronizable.
- **Variables:** `DATABASE_URL` (con pooling, la usa la app) y
  `DATABASE_URL_UNPOOLED` (directa, la usa la CLI de Prisma). Se validan
  con Zod en `env.ts`.
- **Migraciones:** `migrate dev` solo en local y `migrate deploy` en el
  despliegue. Una migración aplicada no se edita nunca. La CI aplica todas
  sobre un Postgres vacío y comprueba que no hay drift con
  `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`.
- **Entornos de BD separados:** una rama de Neon por entorno, más una
  **rama solo para tests de integración**, protegida por un guard que se
  niega a usarla si coincide con la de la app.

### Qué NO hacer

- No usar el cliente `prisma` global en repositorios de modelos del tenant.
- No poner `tenantId` en los datos de un `update`.
- No cambiar `schema.prisma` sin su migración.
- No aceptar un reset de `prisma migrate dev` si la URL local apunta a
  una BD con datos que importan.
- No ejecutar tests de integración contra la BD de la app.

---

## 6. Next.js

- `params`, `cookies()` y `headers()` son asíncronos.
- **Tipos de rutas generados:** `typecheck` es `next typegen && tsc
--noEmit`, y así la CI comprueba los Route Handlers contra los nombres
  de las carpetas. Activa `typedRoutes` para que los `href` estén
  tipados.
- **Raíz fija** en `next.config.ts` (`outputFileTracingRoot` y
  `turbopack.root`), para que un lockfile suelto en una carpeta superior
  no cambie la raíz del workspace.
- `redirect()`/`notFound()` lanzan una excepción. Nunca van dentro de un
  `try/catch`, y si hay que capturar, primero `unstable_rethrow(error)`.
- **Loader por ruta:** `_data.ts` envuelto en `cache()`, compartido por
  `page` y `generateMetadata`. Cada ruta tiene `loading`, `error` y
  `not-found`.
- Una página sin APIs dinámicas se prerenderiza en el build y sus datos
  quedan congelados. Revisa qué es estático.
- `env.ts` y todo lo que toque la BD llevan `import "server-only"`.
- **Formularios:** los ricos con React Hook Form + Zod; los sencillos con
  `<form action>` + `useActionState`. Las mutaciones con Server Actions +
  `useOptimistic`.

### Qué NO hacer

- No leer `process.env` fuera de `env.ts`.
- No leer cookies o headers fuera de `app/` y del `auth-context`.
- No meter configuración de segmento (`dynamic`, `revalidate`…) sin un
  motivo escrito.

---

## 7. Testing

- **Tests junto al archivo** (`x.ts` → `x.test.ts`), con nombres
  `Metodo_Escenario_ResultadoEsperado` y estructura arrange / act / assert.
- **Dominio y use cases** con builders y fakes en memoria, sin BD ni red,
  y con un reloj fijo (`const relojFijo: Clock = { now: () => DESPUES }`).
- **Los fakes deben comportarse como la implementación real.** Un
  repositorio en memoria guarda snapshots, no instancias: si no, los tests
  ven cambios que nunca se guardaron.
- **Suites de contrato por puerto:** una función
  `xRepositoryContract(nombre, crear)` en `testing/` con el comportamiento
  esperado. La ejecutan el fake (`pnpm test`) y Prisma
  (`pnpm test:integration`). Así el fake no puede desviarse del real.
- **Tests de integración** (`*.integration.test.ts`) con su propia
  config: sustituyen `server-only` por un módulo vacío, se ejecutan en
  serie y usan `TEST_DATABASE_URL`, con un guard que compara el endpoint
  con el de la app. Incluyen siempre un test de aislamiento entre tenants.
- **Cobertura con umbrales en la CI** sobre la lógica (dominio,
  aplicación, kernel, `api/_lib`): 95 % de líneas y sentencias, 90 % de
  ramas y funciones. Se excluye la infraestructura, que se cubre con
  integración.
- **Tests de arquitectura:** por ejemplo, el de `TENANT_MODELS` contra el
  schema, o la paridad de enums entre el contrato y el dominio.
- Un archivo con `server-only` no se puede importar en Vitest. Mockea el
  módulo (`vi.mock`) o usa la config de integración.
- **e2e con Playwright:** un flujo principal por vista.

### Qué NO hacer

- No comprobar en un test el estado de un objeto que el repositorio
  "guardó" por referencia: hay que releerlo del repositorio.
- No añadir comportamiento a un fake sin cubrirlo en la suite de contrato.
- No bajar un umbral de cobertura para que pase la CI.

---

## 8. Calidad automatizada

### TypeScript

`strict`, `noUncheckedIndexedAccess` y target ES2023. Se comprueba el
`undefined`; nunca `!`. Sin `any` salvo excepción justificada con un
comentario.

### ESLint (flat config, con información de tipos)

- `next/core-web-vitals`, `next/typescript` y `prettier` (este último).
- Con `parserOptions.projectService`:
  - `consistent-type-imports` (inline);
  - `no-floating-promises`;
  - `no-misused-promises` (con `checksVoidReturn.attributes: false`);
  - `no-non-null-assertion`.
- `no-restricted-imports`: Prisma y `@/generated/*` solo desde el kernel
  e `infrastructure/`.
- **`eslint-plugin-boundaries`** (`boundaries/dependencies`) con las
  capas de la sección 3. "Mismo contexto" se expresa con la plantilla
  `captured: { context: "{{ from.element.captured.context }}" }`.
  Un archivo suelto como `env.ts` se declara como categoría de archivo
  (`boundaries/files`), no como elemento.

### Formato y finales de línea

- Prettier (`printWidth: 100`, `endOfLine: "lf"`) con
  `prettier-plugin-tailwindcss`.
- `.gitattributes` con `* text=auto eol=lf` y `.editorconfig`. Sin esto,
  en Windows se mezclan CRLF y LF y Prettier marca archivos que en
  realidad están bien.

### Hooks de Git (Husky)

- `pre-commit`: lint-staged ejecuta ESLint `--fix`, Prettier y
  `prisma format` sobre los archivos del commit.
- `pre-push`: `pnpm typecheck && pnpm test`.
- Si un commit falla sin motivo aparente, mira la salida del hook. Lo más
  habitual: falta un `pnpm install` tras un cambio en `package.json`.

### CI (GitHub Actions)

- `concurrency` con `cancel-in-progress` y `timeout-minutes` en cada job.
- Una acción compartida `.github/actions/setup` (pnpm, Node y
  dependencias).
- **Job `check`:** `format:check`, `lint`, `typecheck` (con typegen),
  `test:coverage`, `prisma validate`, `prisma format --check` y `build`.
- **Job `migrations`:** Postgres como servicio, `migrate deploy` sobre la
  BD vacía y `migrate diff --exit-code`.
- **Job `integration`:** contra la rama de test (secretos), uno cada vez,
  y se omite con un aviso si no hay secretos (forks, Dependabot).
- Variables de BD falsas a nivel de workflow para `prisma generate`.
- `main` protegida, con la CI obligatoria para hacer merge.

---

## 9. Seguridad y configuración

- Una única lectura de `process.env`, validada con Zod; si falta algo, la
  app no arranca.
- Secretos en `.env.local` (gitignored) y en el proveedor, por entorno.
  `.env.example` documenta los nombres, nunca valores reales.
- La identidad llega a `application` como `AuthContext` ya resuelto. La
  identidad de desarrollo queda bloqueada en producción.
- Rate limiting en login, emisión de tokens y endpoints masivos.
- Server Actions: validan **todos** sus argumentos con Zod, igual que la
  API. Son endpoints públicos.

---

## 10. Git, commits y PRs

- **Conventional Commits en español:** `feat(shopping): …`,
  `refactor(api): …`, `test: …`, `ci: …`, `chore: …`. En el cuerpo, una
  línea por cambio relevante.
- **Ramas:** `main` (producción) y `develop` (staging); feature branches
  hacia `develop`.
- **Cambios masivos de formato o de finales de línea en su propio commit**,
  para que no ensucien el diff del código.
- El lockfile entra en el mismo commit que el cambio de `package.json`. Si
  hay conflicto en él, no se resuelve a mano: `pnpm install` lo regenera.

### Definición de terminado

- [ ] Tests de dominio y de use cases; suite de contrato si hay puerto nuevo.
- [ ] `TENANT_MODELS` actualizado y migración revisada.
- [ ] Todo lo de la UI disponible en `/api/v1` y recogido en `api.http`.
- [ ] Server Actions que validan todo; solo DTO en los componentes.
- [ ] `loading`, `error` y `not-found` funcionando; accesibilidad básica.
- [ ] `lint`, `typecheck`, `test:coverage` y `build` en verde, y la CI en verde.
- [ ] `CLAUDE.md`/`AGENTS.md` y `docs/decisiones.md` actualizados.

---

## 11. Documentación para agentes

- `AGENTS.md`: prácticas generales (este archivo). `CLAUDE.md`: memoria
  del proyecto (dominio, decisiones, pendientes marcados con
  `<PENDING: …>`). `README.md`: visión general y puesta en marcha.
  `docs/decisiones.md`: registro de decisiones con fecha y motivo.
- Documenta **decisiones tomadas, no aspiraciones**. Lo que se ve leyendo
  el código, se recorta.
- Cada archivo de convenciones lleva su sección **"Qué NO hacer"**.
- `CLAUDE.md` por debajo de unas 200 líneas. El detalle de cada contexto
  va a `src/domains/<contexto>/README.md`.
- Cuando cambie una convención, el diff del documento va en el mismo PR.

---

## 12. Trampas conocidas

- `create-next-app` rechaza mayúsculas en el nombre y carpetas con archivos.
- Con `.env*` en `.gitignore`, también se ignora `.env.example`: añade
  `!.env.example`.
- Next solo lee los `.env` al arrancar: hay que reiniciar `dev` tras
  cambiarlos.
- Prisma 7:
  - `migrate dev` no genera el cliente ni ejecuta el seed;
  - el datasource no lleva `url` (va en `prisma.config.ts`);
  - el cliente se importa de `@/generated/prisma/client`.
- La CLI de Prisma usa la URL directa: cambiar solo `DATABASE_URL` no basta.
- Neon: el compute dormido da P1001 (añade `connect_timeout=15`). Las
  ramas pueden crearse con caducidad.
- pnpm 10 pide `pnpm approve-builds` para los scripts de instalación.
- lint-staged solo revisa lo que va en el commit; la CI revisa todo.
- Varios lockfiles en carpetas superiores confunden a Next sobre la raíz.

---

## 13. Checklist para arrancar un proyecto nuevo con esta base

1. Crea el proyecto Next.js con TypeScript, Tailwind, App Router y `src/`.
2. `tsconfig`: `strict`, `noUncheckedIndexedAccess`, target ES2023 y alias `@/*`.
3. Copia `.gitattributes`, `.editorconfig`, `.prettierrc.json`,
   `.prettierignore` y `eslint.config.mjs`, y ajusta los elementos de
   `boundaries`.
4. `src/env.ts` con Zod y `.env.example` (con `!.env.example` en `.gitignore`).
5. Prisma con su adapter, `prisma.config.ts`, cliente en `src/generated` y
   `postinstall: prisma generate`.
6. Kernel: `result.ts` (`ok`, `err`, `mapResult`), `errors.ts`, `clock.ts`,
   `ids.ts` (UUIDv7) y `auth-context.ts`. Si hay multi-tenancy,
   `tenant-models.ts` con su test, `tenant-prisma.ts` y `TenantRepository`.
7. `src/contracts/error.ts`, `app/api/_lib/` (`apiRoute`, `parse` y
   `responses` con sus tests) y `GET /api/v1/health`.
8. Vitest (unitarios con cobertura y config de integración), el stub de
   `server-only` y el script de migración a la BD de test con su guard.
9. Husky (`pre-commit` y `pre-push`) y lint-staged.
10. CI con los jobs `check`, `migrations` e `integration`, y la acción
    `setup`. Protege `main`.
11. `next.config.ts` con raíz fija y `typedRoutes`.
12. `CLAUDE.md` del proyecto, `docs/decisiones.md`, plantilla de PR con la
    definición de terminado y este `AGENTS.md`.
13. La primera funcionalidad completa (dominio → use case → repositorio →
    contrato → API → UI) sirve de **plantilla** para las demás.
