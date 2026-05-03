"use client";

import { useState } from "react";

type LeaderChipInputProps = {
  name: string;
  initialLeaders?: string[];
  placeholder?: string;
  required?: boolean;
};

function normalizeNames(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const name = value.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    normalized.push(name);
  }
  return normalized;
}

function parseNames(raw: string): string[] {
  return normalizeNames(raw.split(/[\n,;]+/));
}

export function LeaderChipInput({
  name,
  initialLeaders = [],
  placeholder = "방장 이름 입력 후 추가",
  required = false,
}: LeaderChipInputProps) {
  const [leaders, setLeaders] = useState<string[]>(normalizeNames(initialLeaders));
  const [draft, setDraft] = useState("");
  const inputStyle = {
    borderColor: "var(--line)",
    "--tw-ring-color": "var(--accent)",
  } as const;

  function addLeaders(raw: string): void {
    const names = parseNames(raw);
    if (names.length === 0) return;
    setLeaders((prev) => normalizeNames([...prev, ...names]));
    setDraft("");
  }

  function removeLeader(name: string): void {
    setLeaders((prev) => prev.filter((leader) => leader !== name));
  }

  return (
    <div>
      <input type="hidden" name={name} value={normalizeNames([...leaders, draft]).join(", ")} />

      <div
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2 py-1.5 focus-within:ring-2"
        style={inputStyle}
      >
        {leaders.map((leader) => (
          <span
            key={`leader-chip-${leader}`}
            className="inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium"
            style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)", color: "var(--ink-soft)" }}
          >
            {leader}
            <button
              type="button"
              aria-label={`${leader} 삭제`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[11px] leading-none transition hover:bg-black/10"
              onClick={() => removeLeader(leader)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          data-leader-input="true"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key !== "Enter") return;
            event.preventDefault();
            addLeaders(draft);
          }}
          required={required && leaders.length === 0}
          className="h-7 min-w-28 flex-1 border-0 bg-transparent px-1 text-sm outline-none"
          style={{ color: "var(--ink)" }}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="btn-press h-8 rounded-lg border px-3 text-xs font-semibold"
          style={{ borderColor: "var(--line)", color: "var(--ink-soft)", backgroundColor: "var(--surface)" }}
          onClick={() => addLeaders(draft)}
        >
          추가
        </button>
      </div>
    </div>
  );
}
