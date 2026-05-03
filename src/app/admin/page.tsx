import Link from "next/link";
import { redirect } from "next/navigation";
import { RoleShell } from "@/app/role-shell";
import { isGlobalAuthenticated } from "@/lib/auth";

type AdminCard = {
  title: string;
  description: string;
  href: string;
  status?: string;
};

const GLOBAL_ADMIN_CARDS: AdminCard[] = [
  {
    title: "기수 관리",
    description: "기수 이름, 접속 주소, 참가자 입장 코드를 관리합니다.",
    href: "/admin/operating-units",
  },
];

function AdminHome({
  cards,
}: {
  cards: AdminCard[];
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const body = (
          <>
            <div className="flex items-start justify-between gap-3">
              <h3
                className="text-lg font-extrabold"
                style={{ color: card.status ? "var(--ink-muted)" : "var(--ink)" }}
              >
                {card.title}
              </h3>
              {card.status ? (
                <span
                  className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold"
                  style={{
                    borderColor: "var(--line)",
                    color: "var(--ink-muted)",
                    backgroundColor: "var(--surface-alt)",
                  }}
                >
                  {card.status}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
              {card.description}
            </p>
          </>
        );

        return card.status ? (
          <div
            key={card.title}
            className="card p-5 cursor-not-allowed"
            aria-disabled="true"
          >
            {body}
          </div>
        ) : (
          <Link key={card.title} href={card.href} className="card p-5">
            {body}
          </Link>
        );
      })}
    </section>
  );
}

export default async function AdminPage() {
  const authenticated = await isGlobalAuthenticated();
  if (!authenticated) {
    redirect("/?auth=required");
  }

  return (
    <RoleShell
      activeRole="admin"
      title="전체관리자"
      summary="기수와 참가자 입장 설정을 관리합니다."
      scopeLabel="전체관리자"
      showRoleNav={false}
    >
      <AdminHome cards={GLOBAL_ADMIN_CARDS} />
    </RoleShell>
  );
}
