"use client";
import { Archive } from "lucide-react";
import type { LimiteDeListasDetails } from "@/contracts/shopping";
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
  limite: LimiteDeListasDetails | null;
  /** Qué se intentaba hacer, para el texto: crear una lista nueva o recuperar una archivada. */
  motivo: "crear" | "desarchivar";
  onElegir: (listaId: string) => void;
  onCerrar: () => void;
};

/**
 * D5: con 15 listas activas no cabe otra. Se pregunta cuál archivar; el servidor hace
 * el intercambio en una transacción. Las activas llegan en `details` del error.
 */
export function ElegirListaDialog({ limite, motivo, onElegir, onCerrar }: Props) {
  return (
    <Dialog open={limite !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        <DialogTitle>Ya tienes {limite?.max ?? 15} listas activas</DialogTitle>
        <DialogDescription>
          {motivo === "crear"
            ? "Para crear otra, elige una para archivar."
            : "Para recuperar esta, elige otra para archivar."}{" "}
          La archivada se borrará en 15 días si no la recuperas.
        </DialogDescription>
        <ul className="flex flex-col gap-2">
          {limite?.activas.map((lista) => (
            <li key={lista.id}>
              <Button
                variant="outline"
                onClick={() => onElegir(lista.id)}
                className="h-11 w-full justify-start gap-3 px-4 text-base"
              >
                <Archive aria-hidden="true" className="text-muted-foreground" />
                <span className="truncate">{lista.nombre}</span>
              </Button>
            </li>
          ))}
        </ul>
        <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
          Cancelar
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
