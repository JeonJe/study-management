type PeriodPickerProps = {
  preset: string;
  start: string;
  end: string;
  tab: string;
  sort: string;
  dir: string;
};

export function PeriodPicker({
  preset,
  start,
  end,
  tab,
  sort,
  dir,
}: PeriodPickerProps) {
  return (
    <form action="/admin/history" className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <input type="hidden" name="tab" value={tab} />
      <input type="hidden" name="sort" value={sort} />
      <input type="hidden" name="dir" value={dir} />
      <label htmlFor="history-preset" className="grid gap-2 text-sm font-bold" style={{ color: "var(--ink)" }}>
        기간
        <select
          id="history-preset"
          name="preset"
          defaultValue={preset}
          className="h-11 rounded-xl border px-3 text-sm outline-none"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        >
          <option value="current-quarter">이번 분기</option>
          <option value="previous-quarter">지난 분기</option>
          <option value="custom">사용자 정의</option>
        </select>
      </label>
      <label htmlFor="history-start" className="grid gap-2 text-sm font-bold" style={{ color: "var(--ink)" }}>
        시작일
        <input
          id="history-start"
          name="start"
          type="date"
          defaultValue={start}
          className="h-11 rounded-xl border px-3 text-sm outline-none"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        />
      </label>
      <label htmlFor="history-end" className="grid gap-2 text-sm font-bold" style={{ color: "var(--ink)" }}>
        종료일
        <input
          id="history-end"
          name="end"
          type="date"
          defaultValue={end}
          className="h-11 rounded-xl border px-3 text-sm outline-none"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          className="btn-press h-11 w-full rounded-full px-4 text-sm font-bold text-white sm:w-auto"
          style={{ backgroundColor: "var(--accent)" }}
        >
          적용
        </button>
      </div>
    </form>
  );
}
