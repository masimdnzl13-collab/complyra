"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

interface AccountMenuProps {
  displayName: string;
  email: string;
  roleLabel: string | null;
  showSettings: boolean;
}

/**
 * Single top-bar trigger (avatar + org name) replacing the previous
 * email-text + Settings-link + Sign-out-button trio. Escape and
 * click-outside close it; menu items are real focusable elements so Tab
 * reaches them normally while open.
 */
export function AccountMenu({ displayName, email, roleLabel, showSettings }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-navy-50"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="hidden text-sm font-medium text-navy-900 sm:inline">{displayName}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-navy-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-navy-100 bg-white p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-navy-900">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-navy-500">{email}</p>
            {roleLabel && (
              <span className="mt-1.5 inline-block rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-600">
                {roleLabel}
              </span>
            )}
          </div>

          {showSettings && (
            <>
              <div className="my-1 border-t border-navy-100" />
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
              >
                Settings
              </Link>
            </>
          )}

          <div className="my-1 border-t border-navy-100" />
          <SignOutButton className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-50" />
        </div>
      )}
    </div>
  );
}
