"use client";

type TeamEditModalProps = {
  open: boolean;
  fixedAngels: string[];
  teamName: string;
  teamAngels: string[];
  teamMembers: string[];
  teamAngelInput: string;
  teamMemberInput: string;
  onTeamNameChange: (value: string) => void;
  onTeamAngelsChange: (value: string[]) => void;
  onTeamMembersChange: (value: string[]) => void;
  onTeamAngelInputChange: (value: string) => void;
  onTeamMemberInputChange: (value: string) => void;
  onAddAngel: () => void;
  onAddMembers: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: () => void;
};

function RemoveChipButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[11px] leading-none transition hover:bg-black/10"
    >
      ×
    </button>
  );
}

export function TeamEditModal({
  open,
  fixedAngels,
  teamName,
  teamAngels,
  teamMembers,
  teamAngelInput,
  teamMemberInput,
  onTeamNameChange,
  onTeamAngelsChange,
  onTeamMembersChange,
  onTeamAngelInputChange,
  onTeamMemberInputChange,
  onAddAngel,
  onAddMembers,
  onCancel,
  onDelete,
  onSubmit,
}: TeamEditModalProps) {
  if (!open) return null;
  const canSubmit = teamName.trim().length > 0 && teamAngels.length > 0;
  const hasMemberInput = teamMemberInput.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-edit-modal-title"
        className="modal-surface max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto p-5"
      >
        <h4 id="team-edit-modal-title" className="text-base font-semibold" style={{ color: "var(--ink)" }}>
          팀 수정
        </h4>
        <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
          팀 정보와 멤버 명단을 함께 수정합니다.
        </p>

        <div className="mt-4 grid gap-4">
          <label className="grid gap-1 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>
            팀 이름
            <input
              value={teamName}
              onChange={(event) => onTeamNameChange(event.target.value)}
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              placeholder="예: 1팀"
              autoFocus
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>
            담당 엔젤
            <div className="rounded-xl border p-2" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)" }}>
              <div className="flex flex-wrap gap-2">
                {teamAngels.length > 0 ? (
                  teamAngels.map((angel) => (
                    <span
                      key={`team-edit-angel-${angel}`}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)", color: "var(--ink-soft)" }}
                    >
                      {angel}
                      <RemoveChipButton
                        label={`${angel} 담당 엔젤 제거`}
                        onClick={() => onTeamAngelsChange(teamAngels.filter((name) => name !== angel))}
                      />
                    </span>
                  ))
                ) : (
                  <span className="py-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                    담당 엔젤을 선택해주세요.
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={teamAngelInput}
                  onChange={(event) => onTeamAngelInputChange(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  disabled={teamAngels.length >= 2}
                  list="team-edit-fixed-angels"
                  placeholder="엔젤 이름 입력"
                />
                <datalist id="team-edit-fixed-angels">
                  {fixedAngels
                    .filter((angel) => !teamAngels.includes(angel))
                    .map((angel) => (
                      <option key={`team-edit-angel-option-${angel}`} value={angel} />
                    ))}
                </datalist>
                <button
                  type="button"
                  disabled={!teamAngelInput || teamAngels.length >= 2}
                  className="btn-press h-10 rounded-xl border px-3 text-xs font-semibold disabled:cursor-not-allowed"
                  style={{
                    borderColor: "rgba(13, 127, 242, 0.25)",
                    backgroundColor: "var(--accent-weak)",
                    color: "var(--accent-strong)",
                    opacity: teamAngelInput && teamAngels.length < 2 ? 1 : 0.45,
                  }}
                  onClick={onAddAngel}
                >
                  추가
                </button>
              </div>
            </div>
          </label>

          <section className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>
                멤버
              </p>
              <span className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                {teamMembers.length}명
              </span>
            </div>
            <div className="rounded-xl border p-2" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)" }}>
              {teamMembers.length > 0 ? (
                <ul className="grid max-h-56 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {teamMembers.map((member, index) => (
                    <li
                      key={`team-edit-member-${member}-${index}`}
                      className="flex min-h-9 items-center justify-between gap-2 rounded-lg border bg-white px-2 py-1.5"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <input
                        value={member}
                        onChange={(event) =>
                          onTeamMembersChange(
                            teamMembers.map((item, memberIndex) =>
                              memberIndex === index ? event.target.value : item
                            )
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                        style={{ color: "var(--ink)" }}
                        aria-label={`${index + 1}번째 멤버 이름`}
                      />
                      <RemoveChipButton
                        label={`${member} 삭제`}
                        onClick={() => onTeamMembersChange(teamMembers.filter((_, memberIndex) => memberIndex !== index))}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed bg-white px-3 py-4 text-center text-xs" style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}>
                  등록된 멤버가 없습니다.
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  value={teamMemberInput}
                  onChange={(event) => onTeamMemberInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey || !hasMemberInput) return;
                    event.preventDefault();
                    onAddMembers();
                  }}
                  className="h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  placeholder="멤버 이름 입력"
                />
                <button
                  type="button"
                  disabled={!hasMemberInput}
                  className="btn-press h-10 rounded-xl border px-3 text-xs font-semibold disabled:cursor-not-allowed"
                  style={{
                    borderColor: "rgba(13, 127, 242, 0.25)",
                    backgroundColor: "var(--accent-weak)",
                    color: "var(--accent-strong)",
                    opacity: hasMemberInput ? 1 : 0.45,
                  }}
                  onClick={onAddMembers}
                >
                  추가
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            className="btn-press rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: "#fecaca", color: "var(--danger)", backgroundColor: "var(--danger-bg)" }}
            onClick={onDelete}
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-press rounded-xl border bg-white px-3 py-2 text-xs font-semibold"
              style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
              onClick={onCancel}
            >
              취소
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              className="btn-press rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)", opacity: canSubmit ? 1 : 0.45 }}
              onClick={onSubmit}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
