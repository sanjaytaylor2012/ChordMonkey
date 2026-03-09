"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navLinks = [
    { href: "/welcome", label: "Home" },
    { href: "/", label: "Create" },
    { href: "/my-songs", label: "My Songs" },
    { href: "/discover", label: "Discover" },
  ];

  const authLinks = [
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Sign Up" },
  ];

  return (
    <header className="w-full border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/welcome" className="text-xl font-semibold">
          🐒 ChordMonkey
        </Link>

        <div className="flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-6">
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={link.href}
                      className={`text-sm font-medium transition-colors ${
                        pathname === link.href
                          ? "text-foreground underline underline-offset-4"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Links */}
          <div className="flex items-center gap-4">
            {authLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-foreground underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5 text-foreground" />
            ) : (
              <MoonIcon className="w-5 h-5 text-foreground" />
            )}
          </button>

          {/* Account Button */}
          <Link
            href="/account"
            className={`p-2 rounded-lg transition-colors ${
              pathname === "/account"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
            aria-label="Account"
          >
            <UserIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}