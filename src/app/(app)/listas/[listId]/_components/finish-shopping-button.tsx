import { CheckCheck } from "lucide-react";
import { useId, useRef } from "react";
import type { ModoTerminarCompraDto } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";

type Props = {
  pendientes: number;
  onTerminar: (modo: ModoTerminarCompraDto) => void;
};

/**
 * Quita de la lista lo que ya está en el carro. Si queda algo por comprar,
 * pregunta antes si se vacía la lista o se deja con lo pendiente.
 */
export function FinishShoppingButton({ pendientes, onTerminar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  function terminar() {
    // Sin pendientes ambos modos hacen lo mismo; "conservar" no quita nada
    // que otro miembro del hogar acabe de añadir desde otro dispositivo.
    if (pendientes === 0) onTerminar("conservarPendientes");
    else dialogo.current?.showModal();
  }

  function elegir(modo: ModoTerminarCompraDto) {
    dialogo.current?.close();
    onTerminar(modo);
  }

  return (
    <>
      <Button
        onClick={terminar}
        className="h-11 w-full font-semibold sm:w-auto sm:self-end sm:px-6"
      >
        <CheckCheck aria-hidden="true" />
        Terminar compra
      </Button>

      <dialog
        ref={dialogo}
        aria-labelledby={tituloId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-card p-6 text-card-foreground shadow-lg backdrop:bg-foreground/40"
      >
        <h2 id={tituloId} className="text-xl font-semibold">
          ¿Terminar la compra?
        </h2>
        <p className="mt-2 text-muted-foreground">
          {pendientes === 1
            ? "Queda 1 producto sin comprar."
            : `Quedan ${pendientes} productos sin comprar.`}{" "}
          Lo que está en el carro sale de la lista.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => elegir("conservarPendientes")} className="h-11 font-semibold">
            Dejar lo pendiente en la lista
          </Button>
          <Button
            variant="destructive"
            onClick={() => elegir("vaciar")}
            className="h-11 font-semibold"
          >
            Vaciar la lista
          </Button>
          <Button variant="ghost" onClick={() => dialogo.current?.close()} className="h-11">
            Cancelar
          </Button>
        </div>
      </dialog>
    </>
  );
}
