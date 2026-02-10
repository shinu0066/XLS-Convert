"use client";

import { usePathname } from 'next/navigation';

export default function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  const mainClassName = isAdminRoute
    ? "flex-grow"
    : "flex-grow container mx-auto px-4 py-8 pt-24 pb-8";

  return (
    <main className={mainClassName}>
      {children}
    </main>
  );
}

