import type { HealthResponse } from "@/contracts/health";
import { ok } from "@/shared/kernel/result";
import { resultResponse } from "../../_lib/responses";

export function GET() {
  const body: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
  return resultResponse(ok(body));
}