import { redirect } from "next/navigation";

/** La portada es Mis listas (vista 2). Las páginas protegen el acceso por su cuenta. */
export default function Home() {
  redirect("/listas");
}
