import "server-only";
import type { AuthContext } from "./auth-context";
import { tenantPrisma, type TenantPrismaClient } from "./tenant-prisma";

export abstract class TenantRepository {
  protected readonly db: TenantPrismaClient;
  protected readonly hogarId: string;

  constructor(auth: Pick<AuthContext, "hogarId">) {
    this.hogarId = auth.hogarId;
    this.db = tenantPrisma(auth.hogarId);
  }
}
