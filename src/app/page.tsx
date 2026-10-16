import Link from "next/link";
import { DEV_LISTA_ID } from "@/shared/kernel/dev-identity";

// Enlace temporal hasta la vista 2 (Mis listas).
export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">ShopList</h1>
      <Link href={`/listas/${DEV_LISTA_ID}`} className="self-start underline">
        Abrir la lista de desarrollo
      </Link>
    </main>
  );
}
