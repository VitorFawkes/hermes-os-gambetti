"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DollarSign, Hexagon, LayoutDashboard, Target, Sparkles, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pantheon", label: "Pantheon", icon: Bot },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/spend", label: "Spend", icon: DollarSign },
  { href: "/soul", label: "Soul.md", icon: User },
  { href: "/dreams", label: "Dreams", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center gap-2 px-6">
        <Hexagon className="size-6 text-emerald-500" />
        <span className="font-semibold tracking-tight text-zinc-100">
          Hermes OS
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className="font-mono text-xs text-zinc-600">v0.1.0</p>
      </div>
    </aside>
  );
}
