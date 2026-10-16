import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 flex h-14 items-center bg-background/90 px-5 backdrop-blur">
        <Link href="/" className="font-heading text-2xl font-bold text-primary">
          ShopList
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
