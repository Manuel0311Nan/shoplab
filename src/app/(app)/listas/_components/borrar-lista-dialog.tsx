"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

type Props = {
  /** null: cerrado. */
  lista: { id: string; nombre: string } | null;
  onConfirmar: (listaId: string) => void;
  onCerrar: () => void;
};

/** Borrar no se puede deshacer: se avisa con claridad y el botón por defecto es Cancelar. */
export function BorrarListaDialog({ lista, onConfirmar, onCerrar }: Props) {
  return (
    <Dialog open={lista !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent role="alertdialog">
        <DialogTitle>¿Borrar «{lista?.nombre}»?</DialogTitle>
        <DialogDescription>
          Se borrará la lista con todos sus productos para todo el hogar.{" "}
          <strong className="font-semibold text-foreground">No se puede deshacer.</strong>
        </DialogDescription>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            variant="destructive"
            onClick={() => lista && onConfirmar(lista.id)}
            className="h-11 font-semibold sm:flex-1"
          >
            <Trash2 aria-hidden="true" />
            Borrar para siempre
          </Button>
          <DialogClose
            render={<Button variant="outline" className="h-11 font-semibold sm:flex-1" />}
          >
            Cancelar
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
