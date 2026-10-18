import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/env";

/**
 * Vercel llama a los crons con `Authorization: Bearer CRON_SECRET`. Sin CRON_SECRET
 * definida, ninguna llamada pasa. Comparación en tiempo constante.
 */
export function esLlamadaDeCron(cabecera: string | null): boolean {
  if (env.CRON_SECRET === undefined || cabecera === null) return false;
  const esperado = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const recibido = Buffer.from(cabecera);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}
