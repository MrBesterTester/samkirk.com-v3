"use client";

import { signOut } from "next-auth/react";

export function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      Sign out
    </button>
  );
}
