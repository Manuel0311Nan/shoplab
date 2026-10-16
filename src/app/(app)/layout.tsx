import Link from "next/link";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b px-4 py-3">
        <Link href="/" className="font-semibold">
          ShopList
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
