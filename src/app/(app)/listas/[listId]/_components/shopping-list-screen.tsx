"use client";
import { useOptimistic, useState, useTransition } from "react";
import { uuidv7 } from "uuidv7";
import {
  addItemAction,
  removeItemAction,
  setItemPurchasedAction,
  updateItemQuantityAction,
} from "@/app/actions/shopping-items";
import type { CantidadDto, ShoppingListResponse } from "@/contracts/shopping";
import type { Result } from "@/shared/kernel/result";
import { AddItemForm, type NewItemValues } from "./add-item-form";
import { ItemList } from "./item-list";
import { type AccionLista, aplicarAccion } from "./list-reducer";
type Props = { list: ShoppingListResponse };
export function ShoppingListScreen({ list }: Props) {
  const [items, aplicarOptimista] = useOptimistic(list.items, aplicarAccion);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function ejecutar(accion: AccionLista, llamada: () => Promise<Result<unknown>>) {
    setError(null);
    startTransition(async () => {
      aplicarOptimista(accion);
      const result = await llamada();
      if (!result.ok) setError(result.error.message);
    });
  }
  function anadir(values: NewItemValues) {
    const id = uuidv7();
    const item = {
      id,
      nombre: values.nombre,
      cantidad: values.cantidad,
      nota: values.nota ?? null,
      ingredientId: null,
      compradoAt: null,
      updatedAt: new Date().toISOString(),
    };
    ejecutar({ tipo: "anadir", item }, () => addItemAction(list.id, { ...values, id }));
  }
  const marcar = (itemId: string, comprado: boolean) =>
    ejecutar({ tipo: "comprado", itemId, comprado }, () =>
      setItemPurchasedAction(list.id, itemId, comprado),
    );
  const cambiarCantidad = (itemId: string, cantidad: CantidadDto) =>
    ejecutar({ tipo: "cantidad", itemId, cantidad }, () =>
      updateItemQuantityAction(list.id, itemId, cantidad),
    );
  const quitar = (itemId: string) =>
    ejecutar({ tipo: "quitar", itemId }, () => removeItemAction(list.id, itemId));
  const pendientes = items.filter((item) => item.compradoAt === null);
  const enElCarro = items.filter((item) => item.compradoAt !== null);
  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{list.nombre}</h1>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {isPending ? "Guardando…" : `${pendientes.length} por comprar`}
        </span>
      </header>
      <AddItemForm onAdd={anadir} />
      {error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <ItemList
        titulo="Por comprar"
        vacio="No queda nada por comprar."
        items={pendientes}
        onToggle={marcar}
        onCantidad={cambiarCantidad}
        onQuitar={quitar}
      />
      <ItemList
        titulo="En el carro"
        vacio="Todavía no has cogido nada."
        items={enElCarro}
        onToggle={marcar}
        onCantidad={cambiarCantidad}
        onQuitar={quitar}
      />
    </section>
  );
}
