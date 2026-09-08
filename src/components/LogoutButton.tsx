"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, local } from "@/lib/api";

/** Ends the server session, clears private local caches, then returns to the start page. */
export function LogoutButton({ label = "Log out" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="stack-sm">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            try {
              await api("/api/account/logout", { method: "POST", body: {} });
              local.clearPrivate();
              router.push("/");
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "Could not log out. Try again.");
            }
          });
        }}
      >
        {pending ? "Logging out…" : label}
      </button>
      {error && <p className="alert error" role="alert">{error}</p>}
    </div>
  );
}
