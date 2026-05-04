export default function Loading() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[80] h-1 overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="조회 중"
      aria-busy="true"
    >
      <div className="route-loading-bar h-full rounded-r-full" />
    </div>
  );
}
