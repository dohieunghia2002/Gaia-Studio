/**
 * Hiện ngay khi bấm chuyển trang, trong lúc server tải dữ liệu (app/studio/loading.tsx, app/credit/loading.tsx).
 * Vòng xoay chỉ hiện sau ~150 ms để lần chuyển trang nhanh không bị nháy.
 */
export function PageLoading() {
  return (
    <div className="page page-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
