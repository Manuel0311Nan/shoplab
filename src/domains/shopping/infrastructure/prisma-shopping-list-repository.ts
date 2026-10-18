import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type {
  ResumenLista,
  ShoppingListRepository,
} from "@/domains/shopping/application/ports/shopping-list-repository";
import { limiteDeCaducidad, type ShoppingList } from "@/domains/shopping/domain/shopping-list";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock, type Clock } from "@/shared/kernel/clock";
import type { Cursor } from "@/shared/kernel/cursor";
import { TenantRepository } from "@/shared/kernel/tenant-repository";
import { shoppingListToDomain } from "./shopping-list.mapper";

const SELECT_LISTA = {
  id: true,
  nombre: true,
  archivadaAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  _count: { select: { items: { where: { deletedAt: null } } } },
} satisfies Prisma.ShoppingListSelect;

type FilaLista = Prisma.ShoppingListGetPayload<{ select: typeof SELECT_LISTA }>;

export class PrismaShoppingListRepository
  extends TenantRepository
  implements ShoppingListRepository
{
  constructor(
    auth: Pick<AuthContext, "hogarId">,
    private readonly clock: Clock = systemClock,
  ) {
    super(auth);
  }

  async findById(id: string): Promise<ShoppingList | null> {
    const row = await this.db.shoppingList.findFirst({
      where: { id, ...this.vigentes() },
      include: { items: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } },
    });
    return row === null ? null : shoppingListToDomain(row);
  }

  async listarActivas(): Promise<ResumenLista[]> {
    const filas = await this.db.shoppingList.findMany({
      where: { deletedAt: null, archivadaAt: null },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: SELECT_LISTA,
    });
    return this.resumir(filas);
  }

  async listarArchivadas(opciones: {
    despuesDe?: Cursor;
    limite: number;
  }): Promise<ResumenLista[]> {
    const c = opciones.despuesDe;
    const filas = await this.db.shoppingList.findMany({
      where: {
        deletedAt: null,
        AND: [
          { archivadaAt: { gt: limiteDeCaducidad(this.clock.now()) } },
          // Keyset: estrictamente después del cursor en el orden (archivadaAt desc, id desc).
          ...(c === undefined
            ? []
            : [
                {
                  OR: [
                    { archivadaAt: { lt: c.fecha } },
                    { archivadaAt: c.fecha, id: { lt: c.id } },
                  ],
                },
              ]),
        ],
      },
      orderBy: [{ archivadaAt: "desc" }, { id: "desc" }],
      take: opciones.limite,
      select: SELECT_LISTA,
    });
    return this.resumir(filas);
  }

  async contarActivas(): Promise<number> {
    return this.db.shoppingList.count({ where: { deletedAt: null, archivadaAt: null } });
  }

  async save(list: ShoppingList): Promise<void> {
    await this.guardarVarias([list]);
  }

  async guardarVarias(lists: readonly ShoppingList[]): Promise<void> {
    await this.db.$transaction(lists.flatMap((list) => this.operacionesDeGuardado(list)));
  }

  /** Ni borradas ni caducadas (archivadas hace más de 15 días). */
  private vigentes(): Prisma.ShoppingListWhereInput {
    return {
      deletedAt: null,
      OR: [{ archivadaAt: null }, { archivadaAt: { gt: limiteDeCaducidad(this.clock.now()) } }],
    };
  }

  /** Añade a cada fila sus pendientes (una sola consulta agrupada para todas). */
  private async resumir(filas: readonly FilaLista[]): Promise<ResumenLista[]> {
    if (filas.length === 0) return [];
    const grupos = await this.db.shoppingItem.groupBy({
      by: ["listaId"],
      where: { listaId: { in: filas.map((f) => f.id) }, deletedAt: null, compradoAt: null },
      _count: { _all: true },
    });
    const pendientes = new Map(grupos.map((g) => [g.listaId, g._count._all]));
    return filas.map(({ _count, ...lista }) => ({
      ...lista,
      total: _count.items,
      pendientes: pendientes.get(lista.id) ?? 0,
    }));
  }

  private operacionesDeGuardado(list: ShoppingList) {
    const lista = list.toSnapshot();
    return [
      // upsert: la misma llamada guarda una lista nueva (CreateShoppingList) o una existente.
      this.db.shoppingList.upsert({
        where: { id: lista.id },
        create: { ...lista, hogarId: this.hogarId },
        update: {
          nombre: lista.nombre,
          archivadaAt: lista.archivadaAt,
          updatedAt: lista.updatedAt,
          deletedAt: lista.deletedAt,
        },
      }),
      ...list.itemsModificados().map((item) => {
        const datos = {
          nombre: item.nombre,
          ingredientId: item.ingredientId,
          productoBaseId: item.productoBaseId,
          cantidadValor: item.cantidad.valor,
          cantidadUnidad: item.cantidad.unidad,
          nota: item.nota,
          compradoAt: item.compradoAt,
          compradoPorId: item.compradoPorId,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt,
        };
        return this.db.shoppingItem.upsert({
          where: { id: item.id },
          create: {
            ...datos,
            id: item.id,
            hogarId: this.hogarId,
            listaId: lista.id,
            createdAt: item.createdAt,
          },
          update: datos,
        });
      }),
    ];
  }
}
