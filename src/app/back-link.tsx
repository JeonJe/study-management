import Link from "next/link";
import type { ReactNode } from "react";

type BackLinkProps = {
  href: string;
  children: ReactNode;
};

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center text-sm font-bold hover:underline"
      style={{ color: "var(--accent-strong)" }}
    >
      <span aria-hidden="true">←&nbsp;</span>
      <span>{children}</span>
    </Link>
  );
}
