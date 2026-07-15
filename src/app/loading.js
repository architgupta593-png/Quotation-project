/**
 * Root-level loading skeleton — shown instantly while a page or layout
 * suspends during navigation (RSC streaming).
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      {/* Animated spinner */}
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
