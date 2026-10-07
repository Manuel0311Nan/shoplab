import type { MeResponse } from "@/contracts/me";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { ok } from "@/shared/kernel/result";
import { errorResponse, resultResponse } from "../../_lib/responses";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return errorResponse(auth.error);
  }

  const body: MeResponse = {
    userId: auth.value.userId,
    hogarId: auth.value.hogarId,
  };
  return resultResponse(ok(body));
}
