import "server-only";
import type { HouseholdRepository } from "@/domains/households/application/ports/household-repository";
import type { Hogar, HogarSnapshot } from "@/domains/households/domain/hogar";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/kernel/prisma";

/**
 * Usa el `prisma` del kernel, sin extensión de tenant, y es intencionado:
 * `Hogar` es el propio tenant (no tiene `hogarId`) y `MiembroHogar` está en
 * `TENANT_EXCLUDED` porque se consulta entre hogares. No hay hogar activo
 * todavía: este repositorio es el que lo crea.
 */
export class PrismaHouseholdRepository implements HouseholdRepository {
  async esMiembroDeAlguno(usuarioId: string): Promise<boolean> {
    const miembro = await prisma.miembroHogar.findFirst({
      where: { usuarioId },
      select: { hogarId: true },
    });
    return miembro !== null;
  }

  async crear(hogar: Hogar): Promise<boolean> {
    const h = hogar.toSnapshot();
    try {
      await prisma.$transaction([
        prisma.hogar.create({
          data: { id: h.id, nombre: h.nombre, createdAt: h.createdAt, updatedAt: h.updatedAt },
        }),
        prisma.miembroHogar.create({
          data: { hogarId: h.id, usuarioId: h.fundadorId, createdAt: h.createdAt },
        }),
      ]);
      return true;
    } catch (error) {
      // P2002: clave única duplicada. El id del hogar ya existía (doble envío).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return false;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<HogarSnapshot | null> {
    const row = await prisma.hogar.findUnique({
      where: { id },
      include: { miembros: { orderBy: { createdAt: "asc" }, take: 1 } },
    });
    const fundador = row?.miembros.at(0);
    if (row === null || fundador === undefined) return null;

    return {
      id: row.id,
      nombre: row.nombre,
      // El primer miembro es quien lo creó.
      fundadorId: fundador.usuarioId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
