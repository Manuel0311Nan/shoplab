import type { MeResponse } from "@/contracts/me";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { ok } from "@/shared/kernel/result";

export const GET = apiRoute({}, async ({ auth }) =>
  resultResponse(ok<MeResponse>({ userId: auth.userId, hogarId: auth.hogarId })),
);
