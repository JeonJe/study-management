type MemberSaveToolbarProps = {
  teamCount: number;
  memberCount: number;
  onAddTeam: () => void;
};

export function MemberSaveToolbar({
  teamCount,
  memberCount,
  onAddTeam,
}: MemberSaveToolbarProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>멤버 명단</p>
          <span
            className="rounded-full border px-2 py-1 text-xs font-semibold"
            style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)", color: "var(--ink-soft)" }}
          >
            {teamCount}팀 / {memberCount}명
          </span>
        </div>
      </div>
      <button
        type="button"
        className="btn-press rounded-full border px-4 py-2 text-sm font-semibold transition"
        style={{ borderColor: "rgba(13, 127, 242, 0.25)", backgroundColor: "var(--accent-weak)", color: "var(--accent-strong)" }}
        onClick={onAddTeam}
      >
        추가
      </button>
    </div>
  );
}
