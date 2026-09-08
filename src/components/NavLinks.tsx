"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = [
  { href: "/today", label: "Today" },
  { href: "/path", label: "My path" },
  { href: "/work", label: "My work" },
];
const secondary = [
  { href: "/profile", label: "Your profile" },
  { href: "/settings", label: "Settings" },
];

export function NavLinks({ variant }: { variant: "rail" | "rail-secondary" | "top" | "top-secondary" | "bottom" }) {
  const pathname = usePathname();
  const items = variant.includes("secondary") ? secondary : primary;
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/") || (href === "/today" && pathname.startsWith("/learn")) || (href === "/today" && pathname.startsWith("/practice"));
  return (
    <>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={variant === "bottom" ? undefined : `navlink${variant.includes("secondary") ? " secondary" : ""}`} aria-current={isCurrent(i.href) ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </>
  );
}
