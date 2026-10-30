# Migas

> Haz buenas migas con tu despensa.

Migas es una aplicación web para el hogar que reúne en un solo sitio la
**lista de la compra**, la **despensa** (qué hay en casa, dónde y cuándo
caduca) y las **recetas** que se pueden cocinar con lo que hay. Las listas y
la despensa son del hogar, no de una persona: quien vive en la casa ve lo
mismo y al momento.

El mismo proyecto es la web y la **API pública** (`/api/v1`) que usará una
futura app móvil (proyecto aparte).

> Las decisiones de arquitectura y las convenciones para desarrollar están en
> [`CLAUDE.md`](./CLAUDE.md), y las buenas prácticas generales en
> [`AGENTS.md`](./AGENTS.md).

## Índice

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Instalación y ejecución](#3-instalación-y-ejecución)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Funcionalidades principales](#5-funcionalidades-principales)
6. [Usuario y contraseña de prueba](#6-usuario-y-contraseña-de-prueba)

---

## 1. Descripción general

Migas resuelve tres problemas del día a día de una casa:

- **No comprar lo que ya tienes:** la lista de la compra se comparte entre
  los miembros del hogar, avisa de los productos repetidos y se cruza con la
  despensa.
- **No tirar lo que caduca:** la despensa avisa de lo que caduca esta semana
  y de los paquetes abiertos que conviene revisar.
- **Saber qué cocinar:** propone recetas con lo que hay en casa, ajusta las
  raciones a lo que tienes y manda a la lista lo que falta.

El ciclo completo es: haces la lista → compras (tocando «Al carro») → al
terminar, lo comprado pasa a la despensa con un toque → vas gastando con
«−1» → cuando algo se acaba, vuelve a la lista → y mientras tanto, las
recetas te dicen qué puedes cocinar.

Está pensada para el móvil (se diseña a 360 px de ancho) y se instala como
aplicación (PWA) desde el navegador.

**Modelo:** multi-hogar. Cada hogar tiene sus miembros, listas, despensa,
ubicaciones y su «memoria» (cómo escribe y compra cada producto). El
catálogo (lista base de productos y biblioteca de recetas) es común a todos.

## 2. Stack tecnológico

| Área                | Tecnología                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| Framework           | Next.js 15.5 (App Router, Server Components, Server Actions, `typedRoutes`)  |
| Lenguaje            | TypeScript estricto (`strict`, `noUncheckedIndexedAccess`)                   |
| UI                  | React 19, Tailwind CSS v4, componentes shadcn sobre Base UI, Lucide (iconos) |
| Formularios         | React Hook Form + Zod; los sencillos con `<form action>` + `useActionState`  |
| Validación          | Zod 4 (entrada de la API, Server Actions y variables de entorno)             |
| Base de datos       | PostgreSQL en Neon                                                           |
| ORM                 | Prisma 7 con `@prisma/adapter-neon`; cliente generado en `src/generated`     |
| Autenticación       | Better Auth (email y contraseña; cookie en la web y Bearer para la API)      |
| IDs                 | UUIDv7, generables en el cliente                                             |
| Tests               | Vitest (unitarios y de integración contra una rama de Neon), cobertura v8    |
| Calidad             | ESLint (con `eslint-plugin-boundaries`), Prettier, Husky + lint-staged       |
| Hosting y CI        | Vercel (preview por PR, cron diario) y GitHub Actions                        |
| Gestión de paquetes | pnpm 10, Node.js 22                                                          |

Arquitectura: **Clean Architecture + DDD** sobre Next.js. La lógica de
negocio vive en `src/domains`, separada por contextos; `src/app` solo
entrega (páginas, endpoints y Server Actions delgadas que llaman a casos de
uso). Ver la sección 4.

## 3. Instalación y ejecución

### Requisitos

- **Node.js 22** o superior.
- **pnpm 10** (`corepack enable` lo activa con la versión del proyecto).
- Una base de datos **PostgreSQL en Neon** (la cuenta gratuita sirve). Para
  los tests de integración, una segunda rama de Neon solo para tests.

### Pasos

```bash
# 1. Dependencias (también genera el cliente de Prisma)
pnpm install

# 2. Variables de entorno: copiar la plantilla y rellenarla
cp .env.example .env.local

# 3. Base de datos: aplicar las migraciones
pnpm db:migrate        # prisma migrate dev (nunca aceptes un reset)
pnpm db:generate       # Prisma 7 no genera el cliente al migrar

# 4. Datos iniciales: lista base, recetas y usuario de prueba
pnpm prisma db seed

# 5. Arrancar
pnpm dev               # http://localhost:3000
```

En PowerShell, el paso 2 es `Copy-Item .env.example .env.local`.

### Variables de entorno

Las de la app se validan al arrancar en `src/env.ts`: si falta una
obligatoria, la app no inicia. Las de test las comprueba su propia
configuración, y `ANTHROPIC_API_KEY` solo la lee el generador de recetas.

| Variable                     | Uso                                                                  |
| ---------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`               | Conexión con pooling a Neon (la usa la app)                          |
| `DATABASE_URL_UNPOOLED`      | Conexión directa (la usa la CLI de Prisma para migrar)               |
| `BETTER_AUTH_SECRET`         | Firma de las sesiones; 32 caracteres o más, uno distinto por entorno |
| `BETTER_AUTH_URL`            | URL pública de la app (`http://localhost:3000` en local)             |
| `CRON_SECRET`                | Protege `/api/cron/*`; 16+ caracteres, opcional en local             |
| `TEST_DATABASE_URL`          | Rama de Neon solo para tests de integración (pooling)                |
| `TEST_DATABASE_URL_UNPOOLED` | La misma rama, conexión directa                                      |
| `ANTHROPIC_API_KEY`          | Solo para generar lotes de recetas en local; nunca en Vercel         |

El secreto se puede generar en PowerShell con
`[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))`.

### Scripts

| Script                  | Qué hace                                              |
| ----------------------- | ----------------------------------------------------- |
| `pnpm dev`              | Servidor de desarrollo (Turbopack)                    |
| `pnpm build`            | Build de producción                                   |
| `pnpm start`            | Sirve el build de producción                          |
| `pnpm lint`             | ESLint (incluye las reglas de capas)                  |
| `pnpm typecheck`        | Tipos de rutas (`next typegen`) y `tsc --noEmit`      |
| `pnpm format`           | Prettier sobre todo el proyecto                       |
| `pnpm test`             | Tests unitarios (Vitest)                              |
| `pnpm test:coverage`    | Tests unitarios con cobertura (mínimo 95 % de líneas) |
| `pnpm db:migrate:test`  | Aplica las migraciones a la rama de test              |
| `pnpm test:integration` | Repositorios Prisma contra la rama de test de Neon    |
| `pnpm db:migrate`       | Crea y aplica migraciones en local                    |
| `pnpm db:generate`      | Genera el cliente de Prisma                           |
| `pnpm db:studio`        | Prisma Studio para ver los datos                      |

Generar un lote nuevo de recetas (se revisa a mano en un PR antes de
sembrarlo): `pnpm tsx scripts/generar-recetas.ts [cantidad] [tema]`.

### Despliegue

- **Vercel** despliega cada PR como preview y `main` en producción.
- Las migraciones **no** se aplican en el build: tras mergear un cambio con
  migración, ejecutar `pnpm prisma migrate deploy` contra la base de datos de
  producción. El seed (lista base y recetas) también se ejecuta a mano.
- **Cron** (`vercel.json`): `/api/cron/purgar-listas` a las 04:00 UTC borra
  las listas archivadas hace 15 días. Necesita `CRON_SECRET` en Production.
- **CI** (GitHub Actions, por PR): formato, lint, tipos, tests con
  cobertura, schema de Prisma válido, build, migraciones sin drift (las
  aplica sobre un Postgres vacío y compara con el schema) y tests de
  integración contra Neon.

## 4. Estructura del proyecto

```
prisma/
  schema.prisma          modelo de datos
  migrations/            migraciones SQL (nunca se edita una ya aplicada)
  seed.ts                usuario y hogar de prueba + lista base + recetas
scripts/                 BD de test, generador de recetas
docs/                    iconos de la marca y la lista base en CSV
src/
  env.ts                 única lectura de process.env (validada con Zod)
  middleware.ts          sin cookie de sesión → /login (la seguridad real va en cada endpoint)
  contracts/             esquemas Zod y tipos de la API pública (/api/v1)
  domains/               lógica de negocio, un directorio por contexto
    <contexto>/
      domain/            entidades y value objects (sin dependencias)
      application/       casos de uso (commands/queries) y puertos
      infrastructure/    repositorios Prisma y <contexto>-module.ts
      testing/           builders, fakes en memoria y suites de contrato
  shared/
    kernel/              Result, errores, Cantidad/Unidad, Día, categorías,
                         emojis, auth, multi-tenancy (hogarId), Prisma
    ui/                  componentes base (botón, diálogo, input…)
  app/
    (marketing)/         home pública /
    (auth)/              /login, /registro, /bienvenida (crear el hogar)
    (app)/               la aplicación con sesión
      listas/            Mis listas y cada lista (/listas/[listId])
      despensa/          despensa y /despensa/ubicaciones
      recetas/           sugerencias y cada receta
      productos/         Mis productos
      _components/       piezas compartidas (autocompletado, aviso flotante,
                         pulsación larga, emojis, selector de categoría…)
    _lib/                orquestadores entre contextos y mapeo dominio → DTO
    actions/             Server Actions (atajos de la web a los mismos casos de uso)
    api/v1/              API pública
    api/cron/            tareas programadas de Vercel
  generated/prisma/      cliente de Prisma (generado, no se versiona)
```

### Contextos (bounded contexts)

| Contexto       | Responsabilidad                                                               |
| -------------- | ----------------------------------------------------------------------------- |
| **Shopping**   | Listas, lista general, ítems, packs, carro, terminar compra, memoria de packs |
| **Pantry**     | Ubicaciones, existencias, movimientos, caducidad, paquetes abiertos, deshacer |
| **Catalog**    | Lista base (328 productos), memoria del hogar, Mis productos, emojis          |
| **Recipes**    | Biblioteca de recetas y cruce con la despensa                                 |
| **Households** | Hogares y miembros                                                            |

Un contexto no importa a otro: lo que cruza contextos (añadir con
categoría, guardar la compra, recetas con la despensa, estandarizar
productos) lo hacen orquestadores en `src/app/_lib`, que usan igual la API y
la web. ESLint lo comprueba.

### API pública (`/api/v1`)

Autenticación por cookie (web) o `Authorization: Bearer` (app móvil).
Errores con forma única `{ "error": { "code", "message", "details?" } }`,
fechas ISO 8601, IDs UUIDv7 y paginación por cursor.

| Recurso       | Endpoints                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Sesión        | `/auth/*` (Better Auth), `GET /me`, `GET /health`                                                       |
| Hogar         | `POST /households`                                                                                      |
| Listas        | `GET`/`POST /lists`, `GET`/`PATCH`/`DELETE /lists/{id}`, `POST /lists/{id}/finish`                      |
| Ítems         | `POST /lists/{id}/items`, `PATCH`/`DELETE /lists/{id}/items/{itemId}`                                   |
| Despensa      | `GET /pantry`, `POST /pantry/items`, `POST /pantry/items/batch`, `PATCH`/`DELETE /pantry/items/{id}`    |
| Gastar, abrir | `POST /pantry/items/{id}/consume`, `POST /pantry/movements/{id}/undo`, `POST /pantry/items/{id}/open`   |
| Mover         | `POST /pantry/items/{id}/move` (toda la línea o, con `cantidad`, una parte)                             |
| Ubicaciones   | `GET`/`POST /pantry/locations`, `PATCH`/`DELETE /pantry/locations/{id}`                                 |
| Catálogo      | `GET /catalog/products`, `GET /catalog/household-products`, `GET`/`PUT /catalog/emojis`                 |
| Mis productos | `GET /catalog/my-products`, `POST /catalog/my-products/standardize`, `POST /catalog/my-products/forget` |
| Recetas       | `GET /recipes`, `GET /recipes/{id}?raciones=`, `POST /recipes/{id}/missing-to-list`                     |

Ejemplos listos para lanzar en [`api.http`](./api.http).

## 5. Funcionalidades principales

### Hogar y cuenta

- Registro con email y contraseña; después se crea el hogar en
  `/bienvenida`, que nace con una **Lista general** y tres ubicaciones
  (Nevera, Congelador, Armario).
- Las contraseñas se guardan con hash **scrypt** y sal aleatoria; las
  sesiones duran 30 días y los intentos de login están limitados.
- Home pública con explicación del producto, carrusel «Cómo funciona» con
  capturas reales y precios.

### Listas de la compra

- **Varias listas** (una por tienda, por ejemplo) y una **lista general**
  que las reúne: muestra lo de todas con una etiqueta de su lista de origen;
  marcar, cambiar o quitar ahí se aplica en la lista original. Al añadir
  desde la general se puede elegir en qué lista va el producto o dejarlo
  solo en la general. No se puede borrar ni cuenta para el límite.
- Hasta **15 listas activas**; al crear la 16.ª se pide archivar una. Las
  archivadas se recuperan con un toque y se borran solas a los 15 días.
- **Autocompletado** sobre una lista base de 328 productos y sobre lo que el
  hogar ya escribió; al elegir, ya sabe la categoría y la unidad.
- **Cantidades con unidad** (ud., g, kg, ml, l) y **packs** («2 packs de 4
  yogures» = 8 ud.); el + y el − van de pack en pack. Migas **recuerda el
  pack** de cada producto y lo propone la próxima vez.
- **Productos repetidos:** avisa y deja unir (suma aunque una esté en g y
  otra en kg) o añadir aparte.
- **Categorías** en el orden del recorrido del súper; se pueden cambiar y el
  hogar recuerda la elegida. Orden alternativo: por orden de añadido.
- **Editar el nombre** de un producto (o vincularlo a uno de la lista base),
  solo en esa lista o en todo el hogar.
- **Dos vistas:** la de lista (tarjetas con categoría y cantidad) y la
  **vista rápida**, una cuadrícula para comprar deprisa: un toque lo pasa al
  carro, la cantidad va en la esquina y mantener pulsado deja cambiarla,
  cambiar el emoji o quitarlo. Siempre va en el orden del súper, así que no
  muestra el selector de orden. Cada dispositivo recuerda la vista elegida.
  Una pista que se puede cerrar explica los gestos y, al mantener pulsado,
  una barra se llena en la casilla hasta que se abre el diálogo.
- **Terminar compra:** si queda algo pendiente, se elige conservarlo o
  vaciar la lista; desde la general termina en todas las listas.

### Despensa

- **Guardar la compra** con un toque al terminar: cada producto llega con su
  ubicación propuesta (donde lo guardaste la última vez o, si no, según su
  categoría) y caducidad opcional con atajos. Si no quieres elegir el sitio
  en ese momento («Organizar luego» o cerrar el diálogo), nada se pierde: se
  guarda en la ubicación propuesta como **«Por organizar»**, sale primero en
  la despensa y un aviso verde abre «Organizar la compra» para colocarlo.
- **Vista rápida** (la de por defecto): una cuadrícula como la de la lista,
  con el título de cada ubicación encima. Cada casilla lleva el emoji, la
  cantidad en la esquina y una etiqueta de estado (caducado, caduca en N
  días, abierto, queda poco). **Tocar gasta uno** (en g, kg, ml o l abre los
  atajos) y **mantener pulsado edita**: gastar o tirar, abierto, mover,
  fecha, categoría, nombre, añadir a la lista o quitar, eligiendo el lote si
  hay varios. Un botón junto a la rueda de ajustes cambia a la vista de
  lista; cada dispositivo recuerda la elegida.
- Vista **por ubicación** o **por categoría**, filtro por ubicación y aviso
  de lo que **caduca esta semana**; la caducidad se marca en color.
- **Gastar con un toque:** «−1» resta una unidad al momento; en g, kg, ml o
  l hay atajos ¼ · ½ · Todo. Un aviso abajo permite **deshacer** y, si se
  acaba o queda poco, **añadirlo a la lista** con el pack recordado, eligiendo
  en qué lista (cada dispositivo recuerda la última).
  Mantener pulsado abre el diálogo completo para gastar varias o marcar como
  **tirado**.
- **Paquetes abiertos:** «Lo he abierto» (hoy, ayer u otro día); el aviso
  pasa de verde a amarillo y rojo según los días abiertos, con plazos por
  categoría y excepciones por producto (el jamón cocido avisa antes que la
  pasta). Con varias unidades, solo se abre una.
- **Mover a otro sitio** todo o solo una parte («de las 6 leches, 1 a la
  nevera»): la parte se queda con su caducidad y, si en el destino ya hay
  una igual, se suma. Cambiar fecha, categoría o cantidad, cambiar el nombre,
  quitar lo añadido por error y añadir a mano con autocompletado.
- **Ubicaciones** propias (rueda de ajustes): crear, renombrar, ordenar,
  elegir si son frío, congelado o ambiente y borrarlas moviendo sus
  productos. Cada cambio en la despensa queda registrado como movimiento
  (entrada, consumo, desecho, ajuste, baja).

### Mis productos

- Lista de todo lo que el hogar ha escrito a mano, con buscador.
- **Posibles duplicados** detectados aunque cambien plurales, tildes o el
  orden de las palabras («Yogures proteina» y «Yogur proteína»), y unión con
  un toque, también con un producto de la lista base.
- Editar nombre, categoría, unidad, tamaño de pack y emoji; el cambio llega
  a todas las listas activas y a la despensa. «Olvidar» lo quita de las
  sugerencias.

### Emojis

- Cada producto se ve con un emoji elegido según su nombre (más del 80 % de
  la lista base tiene uno); sin emoji, el icono de su categoría.
- El hogar puede cambiarlo desde la vista rápida o Mis productos.

### Recetas

- Biblioteca propia de recetas caseras con los ingredientes vinculados a la
  lista base.
- Primero las que **se pueden hacer** con lo que hay, con las **raciones
  ajustadas** al ingrediente que da para menos y aviso si usan algo que
  caduca pronto; después las que **casi** (faltan uno o dos ingredientes).
- En cada receta se cambian las raciones y las cantidades se recalculan;
  **«Añadir lo que falta a la lista»** con un toque.

## 6. Usuario y contraseña de prueba

`pnpm prisma db seed` crea un usuario de prueba con su hogar, la lista
general, una lista de ejemplo y las ubicaciones por defecto:

| Campo      | Valor             |
| ---------- | ----------------- |
| Email      | `dev@migas.local` |
| Contraseña | `dev-migas-1234`  |

También se puede crear una cuenta nueva desde `/registro`.

> ⚠ Es una contraseña conocida: solo para desarrollo. Antes de abrir la app
> a usuarios reales, el seed no debe ejecutarse contra la base de datos de
> producción (o hay que borrar esas filas).
