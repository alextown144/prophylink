"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config/env";
import { Button } from "@/components/ui/button";

type AccountKind = "professional" | "office" | "admin";

type AccountRole = {
  kind: AccountKind;
};

type DashboardLink = {
  href: string;
  label: string;
  section: string;
};

export function DashboardMenu() {
  const router = useRouter();
  const supabaseConfigured = isSupabaseConfigured();
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<AccountKind[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    async function loadSessionMenu() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setEmail(null);
        setRoles([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const [{ data }, { count }] = await Promise.all([
        supabase.from("account_roles").select("kind"),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null)
      ]);
      const nextRoles = ((data ?? []) as AccountRole[]).map((role) => role.kind);

      setEmail(user.email ?? "Signed in");
      setRoles(nextRoles);
      setUnreadCount(count ?? 0);
      setLoading(false);
    }

    void loadSessionMenu();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadSessionMenu();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  if (loading || !email) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex" size="sm">
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    );
  }

  const links = buildDashboardLinks(roles);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <details className="group relative">
      <summary className="focus-ring flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg bg-[#00B3A4] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#008F85] [&::-webkit-details-marker]:hidden">
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-12 z-50 flex max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-72 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-brand">
        <div className="shrink-0 border-b bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Signed in</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">{email}</p>
        </div>
        <nav className="grid overflow-y-auto py-2">
          <Link
            className="focus-ring flex items-center justify-between gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
            href="/notifications"
          >
            <span>
              <span className="flex items-center gap-2 font-semibold text-slate-950">
                <Bell className="h-4 w-4 text-teal-700" />
                Notifications
              </span>
              <span className="text-xs text-slate-500">Alerts and shift updates</span>
            </span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
          <Link
            className="focus-ring px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
            href="/messages"
          >
            <span className="block font-semibold text-slate-950">Messages</span>
            <span className="text-xs text-slate-500">Booking conversations</span>
          </Link>
          {links.map((link) => (
            <Link
              className="focus-ring px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
              href={link.href}
              key={link.href}
            >
              <span className="block font-semibold text-slate-950">{link.label}</span>
              <span className="text-xs text-slate-500">{link.section}</span>
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t bg-white p-2">
          <button
            className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            onClick={handleSignOut}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </details>
  );
}

function buildDashboardLinks(roles: AccountKind[]): DashboardLink[] {
  const uniqueRoles = new Set(roles);
  const links: DashboardLink[] = [];

  if (uniqueRoles.has("admin")) {
    links.push(
      { href: "/admin", label: "Admin dashboard", section: "Beta control center" },
      { href: "/admin/users", label: "Users and invitations", section: "Admin" },
      { href: "/admin/credentials", label: "Credential review", section: "Admin" },
      { href: "/admin/subscriptions", label: "Subscription gates", section: "Admin" }
    );
  }

  if (uniqueRoles.has("professional")) {
    links.push(
      {
        href: "/professional/dashboard",
        label: "Professional dashboard",
        section: "Professional"
      },
      {
        href: "/professional/shifts",
        label: "Browse shifts",
        section: "Professional"
      },
      {
        href: "/professional/schedule",
        label: "My schedule",
        section: "Professional"
      },
      {
        href: "/professional/availability",
        label: "Availability calendar",
        section: "Professional"
      },
      {
        href: "/professional/credentials",
        label: "Credentials",
        section: "Professional"
      },
      { href: "/professional/profile", label: "Professional profile", section: "Professional" }
    );
  }

  if (uniqueRoles.has("office")) {
    links.push(
      { href: "/office/dashboard", label: "Office dashboard", section: "Office" },
      { href: "/office/shifts/new", label: "Post a shift", section: "Office" },
      { href: "/office/schedule", label: "Office schedule", section: "Office" },
      { href: "/office/profile", label: "Office profile", section: "Office" },
      { href: "/office/locations", label: "Office locations", section: "Office" }
    );
  }

  if (links.length === 0) {
    links.push({ href: "/onboarding", label: "Choose workspace", section: "Setup" });
  }

  return links;
}
