import { NextResponse } from "next/server";
import { purgaDeListasModule } from "@/domains/shopping/infrastructure/shopping-module";
import { esLlamadaDeCron } from "@/shared/kernel/cron-auth";

/**
 * Cron diario (vercel.json): borra las listas archivadas hace 15 días. Fuera de /api/v1
 * porque no es API pública: solo la llama Vercel con `Authorization: Bearer CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  if (!esLlamadaDeCron(request.headers.get("authorization"))) {
    return NextResponse.json(
      { error: { code: "NO_AUTORIZADO", message: "Falta o no coincide CRON_SECRET" } },
      { status: 401 },
    );
  }

  const result = await purgaDeListasModule().purgeExpiredLists.execute();
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status: 500 },
    );
  }

  console.info(`[cron] purgar-listas: ${result.value.borradas} listas borradas`);
  return NextResponse.json(result.value);
}
