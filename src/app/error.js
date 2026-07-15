"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary — catches all unhandled errors in the app subtree.
 * Must be a Client Component (`"use client"`).
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl">⚠️</span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="max-w-md text-muted-foreground">
          {error?.message ||
            "An unexpected error occurred. Please try again or contact support if the issue persists."}
        </p>
      </div>
      <Button onClick={() => reset()} size="lg">
        Try again
      </Button>
    </div>
  );
}
