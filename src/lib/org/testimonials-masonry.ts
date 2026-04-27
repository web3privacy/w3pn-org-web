/**
 * Homepage testimonials: newspaper-style columns (vertical stacks per column).
 * Optional per-item `masonryColumn` (1..N) + `masonryOrder` control who sits at the top of each column;
 * items without a column are placed by `priority`, then distributed to the shortest column.
 */

export type TestimonialMasonryItem = {
  name?: string;
  role?: string;
  image?: string;
  quote?: string;
  priority?: number;
  /** 1-based column index (1 = left). Omitted → auto (shortest-column placement). */
  masonryColumn?: number;
  /** Order within a column (lower = higher in that column). Default 0. */
  masonryOrder?: number;
};

function clampColumnCount(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(6, Math.max(1, Math.floor(n)));
}

function hasMasonryColumnHint(col: unknown): col is number {
  return typeof col === "number" && Number.isInteger(col) && col >= 1;
}

/**
 * @param columnCount — typically 3 desktop, 2 tablet, 1 mobile
 */
export function buildTestimonialColumnGroups(
  items: TestimonialMasonryItem[],
  columnCount: number,
): TestimonialMasonryItem[][] {
  const n = clampColumnCount(columnCount);
  const list = [...items];

  if (n === 1) {
    const withIdx = list.map((it, i) => ({ it, i }));
    withIdx.sort((a, b) => {
      const pa = a.it.priority ?? 999;
      const pb = b.it.priority ?? 999;
      if (pa !== pb) return pa - pb;
      const oa = a.it.masonryOrder ?? 0;
      const ob = b.it.masonryOrder ?? 0;
      if (oa !== ob) return oa - ob;
      return a.i - b.i;
    });
    return [withIdx.map((x) => x.it)];
  }

  const cols: TestimonialMasonryItem[][] = Array.from({ length: n }, () => []);
  const withIndex = list.map((it, i) => ({ it, i }));

  const explicit = withIndex.filter(({ it }) => hasMasonryColumnHint(it.masonryColumn));
  const implicit = withIndex.filter(({ it }) => !hasMasonryColumnHint(it.masonryColumn));

  explicit.sort((a, b) => {
    const ca = Math.min(n, a.it.masonryColumn as number) - Math.min(n, b.it.masonryColumn as number);
    if (ca !== 0) return ca;
    const oa = a.it.masonryOrder ?? 0;
    const ob = b.it.masonryOrder ?? 0;
    if (oa !== ob) return oa - ob;
    return a.i - b.i;
  });

  for (const { it } of explicit) {
    const c = Math.min(n, it.masonryColumn as number) - 1;
    cols[c]!.push(it);
  }

  implicit.sort((a, b) => {
    const pa = a.it.priority ?? 999;
    const pb = b.it.priority ?? 999;
    if (pa !== pb) return pa - pb;
    return a.i - b.i;
  });

  for (const { it } of implicit) {
    let minIdx = 0;
    for (let j = 1; j < n; j++) {
      if (cols[j]!.length < cols[minIdx]!.length) minIdx = j;
    }
    cols[minIdx]!.push(it);
  }

  return cols;
}
