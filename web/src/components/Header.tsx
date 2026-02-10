"use client";

import Link from "next/link";
import { useState } from "react";

const baseNavLinks = [
  { href: "/", label: "Home" },
  {
    href: "/tools",
    label: "Hire Me",
    children: [
      { href: "/tools/fit", label: "How Do I Fit?" },
      { href: "/tools/resume", label: "Custom Resume" },
      { href: "/tools/interview", label: "Interview Me" },
    ],
  },
  { href: "/dance-menu", label: "Dance Menu" },
  { href: "/song-dedication", label: "Song Dedication" },
  { href: "/photo-fun", label: "Photo Fun" },
  {
    href: "/explorations",
    label: "Explorations",
    children: [
      { href: "/explorations/category-theory", label: "Category Theory" },
      { href: "/explorations/pocket-flow", label: "Pocket Flow" },
      { href: "/explorations/dance-instruction", label: "Dance Instruction" },
      { href: "/explorations/uber-level-ai-skills", label: "Uber Level AI Skills" },
      { href: "/explorations/tensor-logic", label: "Tensor Logic" },
    ],
  },
];

// Only show Admin link in development mode
const navLinks =
  process.env.NODE_ENV === "development"
    ? [...baseNavLinks, { href: "/admin", label: "Admin" }]
    : baseNavLinks;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-primary/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-text-primary"
        >
          Sam Kirk
          <span className="hidden sm:inline text-base font-normal text-text-muted">
            {" "}&ndash; Fremont, California
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href} className="relative group">
              <Link
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-secondary hover:text-text-primary"
              >
                {link.label}
              </Link>
              {link.children && (
                <ul className="invisible absolute left-0 top-full z-50 min-w-[180px] rounded-lg border border-border bg-primary p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                  {link.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-secondary hover:text-text-primary"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="rounded-md p-3 text-text-secondary transition-colors hover:bg-secondary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-primary px-4 py-4 md:hidden">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-3 text-base font-medium text-text-secondary transition-colors hover:bg-secondary hover:text-text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {link.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-3 py-3 text-sm text-text-secondary transition-colors hover:bg-secondary hover:text-text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
