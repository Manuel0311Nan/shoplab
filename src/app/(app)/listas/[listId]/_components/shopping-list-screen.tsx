"use client";
import { Plus } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import {
  addItemAction,
  removeItemAction,
  setItemPurchasedAction,
  updateItemQuantityAction,
} from "@/app/actions/shopping-items";
import { finishShoppingAction } from "@/app/actions/shopping-lists";
import type {
  CantidadDto,
  ModoTerminarCompraDto,
  ShoppingListResponse,
} from "@/contracts/shopping";
import type { Result } from "@/shared/kernel/result";
import { newId } from "@/shared/kernel/ids";
import { AddItemForm, NUEVO_PRODUCTO_ID, type NewItemValues } from "./add-item-form";
import { FinishShoppingButton } from "./finish-shopping-button";
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
    const id = newId();
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
  const terminar = (modo: ModoTerminarCompraDto) =>
    ejecutar({ tipo: "terminar", modo }, () => finishShoppingAction(list.id, modo));

  // El FAB del diseño lleva al formulario: en móvil suele quedar fuera de vista.
  function irAlFormulario() {
    const input = document.getElementById(NUEVO_PRODUCTO_ID);
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  const pendientes = items.filter((item) => item.compradoAt === null);
  const enElCarro = items.filter((item) => item.compradoAt !== null);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pt-4 pb-28 sm:pb-10">
      <header className="flex flex-col gap-2">
        {/* El título ocupa todo el ancho y salta de línea si no cabe: nunca se corta. */}
        <h1 className="text-[28px] leading-9 font-bold text-balance break-words">{list.nombre}</h1>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-muted-foreground" aria-live="polite">
            {isPending ? "Guardando…" : `${enElCarro.length} de ${items.length} en el carro`}
          </p>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            {pendientes.length} por comprar
          </span>
        </div>
      </header>

      <AddItemForm onAdd={anadir} />

      {error !== null && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
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

      {enElCarro.length > 0 && (
        <FinishShoppingButton pendientes={pendientes.length} onTerminar={terminar} />
      )}

      <button
        type="button"
        onClick={irAlFormulario}
        aria-label="Añadir producto"
        className="fixed right-5 bottom-6 z-40 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90 sm:hidden"
      >
        <Plus className="size-8" aria-hidden="true" />
      </button>
    </section>
  );
}
