import { prisma } from "@/shared/kernel/prisma";

export default async function Home() {
  const hogares = await prisma.hogar.count();
  return <p>Hogares en la BD: {hogares}</p>;
}
