"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function NextReviewButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" className="btn" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? "Loading" : "Next entry"}
    </button>
  );
}
