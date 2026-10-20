/**
 * Propone un lote nuevo de recetas para la biblioteca con la API de Claude.
 *
 *   pnpm tsx scripts/generar-recetas.ts                 # 20 recetas caseras variadas
 *   pnpm tsx scripts/generar-recetas.ts 15 "cenas rápidas de verano"
 *
 * Necesita ANTHROPIC_API_KEY en .env.local (solo en tu máquina; nunca en Vercel).
 * Modelo: RECETAS_MODELO (por defecto claude-sonnet-5-5).
 *
 * Escribe `domains/recipes/infrastructure/biblioteca/lote-NNN.json` solo con las recetas
 * que pasan la misma validación que el seed (esquema, productos de la lista base, slugs
 * nuevos) y lista las descartadas. El lote se revisa a mano en un PR antes de sembrar:
 * tiempos, cantidades y pasos pueden salir raros.
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";
import { z } from "zod";
import { LISTA_BASE } from "../src/domains/catalog/infrastructure/lista-base.data";
import {
  cargarBiblioteca,
  ETIQUETAS,
  problemasDeBiblioteca,
  type RecetaBiblioteca,
  recetaBibliotecaSchema,
} from "../src/domains/recipes/infrastructure/biblioteca/biblioteca";

nextEnv.loadEnvConfig(process.cwd());

const CARPETA = "src/domains/recipes/infrastructure/biblioteca";
const MODELO = process.env.RECETAS_MODELO ?? "claude-sonnet-5-5";

async function main() {
  const clave = process.env.ANTHROPIC_API_KEY;
  if (!clave) throw new Error("Falta ANTHROPIC_API_KEY en .env.local");

  const cantidad = Number(process.argv[2] ?? 20);
  const tema = process.argv[3] ?? "cocina casera española variada, de diario";
  const existentes = cargarBiblioteca();

  console.log(`Pidiendo ${cantidad} recetas (${tema}) a ${MODELO}…`);
  const respuesta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": clave,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 32_000,
      messages: [{ role: "user", content: prompt(cantidad, tema, existentes) }],
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
  const datos = (await respuesta.json()) as { content: { type: string; text?: string }[] };
  const texto = datos.content.map((b) => b.text ?? "").join("");

  const propuestas = extraerRecetas(texto);
  const validas: RecetaBiblioteca[] = [];
  const slugs = new Set(existentes.map((r) => r.slug));
  for (const [n, propuesta] of propuestas.entries()) {
    const receta = recetaBibliotecaSchema.safeParse(propuesta);
    if (!receta.success) {
      console.warn(`✗ #${n + 1}: ${z.prettifyError(receta.error).replaceAll("\n", " ")}`);
      continue;
    }
    const problemas = problemasDeBiblioteca(
      [receta.data],
      LISTA_BASE.map(([nombre]) => nombre),
    );
    if (slugs.has(receta.data.slug)) problemas.push(`${receta.data.slug}: ya existe`);
    if (problemas.length > 0) {
      console.warn(`✗ ${problemas.join("; ")}`);
      continue;
    }
    slugs.add(receta.data.slug);
    validas.push(receta.data);
  }

  if (validas.length === 0) {
    console.error("Ninguna receta pasó la validación: no se escribe ningún lote.");
    process.exitCode = 1;
    return;
  }
  const fichero = `${CARPETA}/${siguienteLote()}`;
  writeFileSync(fichero, `${JSON.stringify({ version: 1, recetas: validas }, null, 2)}\n`);
  console.log(
    `✓ ${validas.length} de ${propuestas.length} recetas en ${fichero}. Revísalas antes del PR.`,
  );
}

function prompt(cantidad: number, tema: string, existentes: readonly RecetaBiblioteca[]): string {
  const catalogo = LISTA_BASE.filter(
    ([, categoria]) => !["limpieza", "higiene"].includes(categoria),
  )
    .map(([nombre, categoria, unidad]) => `${nombre} (${categoria}, ${unidad})`)
    .join("\n");
  const ejemplo = existentes[0];

  return `Eres el editor de recetas de Migas, una app española de lista de la compra y despensa.
Escribe ${cantidad} recetas NUEVAS de ${tema}, en español de España, originales (no copies textos de otras webs).

Reglas:
- Cada ingrediente que no sea de fondo de armario va en "productos" con nombres EXACTOS del catálogo de abajo; pon varias alternativas si valen (p. ej. distintos tomates) y la más habitual primero.
- De fondo de armario ("basico": true, sin "productos"): sal, pimienta, aceite, vinagre, agua, ajo, azúcar en pizcas, laurel y especias secas comunes.
- "cantidad" para las raciones de la receta, en g, ml o unidad (kg y l solo si es mucho). Lo que no se mide ("2 dientes", "al gusto") va sin cantidad y con "nota".
- "opcional": true para lo que mejora la receta pero no es imprescindible.
- Pasos breves y claros (3 a 6), en segunda persona.
- "etiquetas": solo de esta lista: ${ETIQUETAS.join(", ")}.
- "slug" en minúsculas con guiones y que no esté entre estos: ${existentes.map((r) => r.slug).join(", ")}.

Responde SOLO con un objeto JSON {"recetas": [...]}, sin texto alrededor. Ejemplo de una receta:
${JSON.stringify(ejemplo, null, 2)}

Catálogo (nombre, sección, unidad habitual):
${catalogo}`;
}

function extraerRecetas(texto: string): unknown[] {
  const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
  const datos = z.object({ recetas: z.array(z.unknown()) }).safeParse(JSON.parse(json));
  if (!datos.success) throw new Error('La respuesta no trae {"recetas": [...]}');
  return datos.data.recetas;
}

function siguienteLote(): string {
  const numeros = readdirSync(CARPETA)
    .map((f) => /^lote-(\d{3})\.json$/.exec(f)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  const siguiente = `lote-${String(Math.max(0, ...numeros) + 1).padStart(3, "0")}.json`;
  if (existsSync(`${CARPETA}/${siguiente}`)) throw new Error(`${siguiente} ya existe`);
  return siguiente;
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
