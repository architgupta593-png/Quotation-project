import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Custom 404 page — shown whenever notFound() is called or a route doesn't exist.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export const metadata = {
  title: "404 — Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-8xl font-black text-muted-foreground/30 select-none">
          404
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="max-w-md text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It may have been moved, deleted, or never existed.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}
