import "server-only";
import { CreateHouseholdCommand } from "@/domains/households/application/commands/create-household.command";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaHouseholdRepository } from "./prisma-household-repository";

/** Composition root de Households. No recibe AuthContext: se usa antes de tener hogar. */
export function householdsModule() {
  const households = new PrismaHouseholdRepository();
  return {
    createHousehold: new CreateHouseholdCommand(households, systemClock),
  };
}

export type HouseholdsModule = ReturnType<typeof householdsModule>;
