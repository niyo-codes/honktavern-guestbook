export class CursorPager {
  constructor(loader) {
    this.loader = loader;
    this.cursor = null;
    this.loading = false;
    this.hasMore = true;
  }
  reset() {
    this.cursor = null;
    this.loading = false;
    this.hasMore = true;
  }
  async next() {
    if (this.loading || !this.hasMore) return null;
    this.loading = true;
    try {
      const result = await this.loader(this.cursor);
      this.cursor = result.nextCursor;
      this.hasMore = Boolean(result.nextCursor);
      return result.entries;
    } finally {
      this.loading = false;
    }
  }
}