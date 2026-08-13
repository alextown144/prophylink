import Link from "next/link";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { DashboardMenu } from "@/components/marketing/dashboard-menu";

const navItems = [
  { href: "/#for-offices", label: "For Offices" },
  { href: "/#for-hygienists", label: "For Hygienists" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#about", label: "About Us" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white shadow-sm">
      <div className="container flex min-h-20 items-center justify-between gap-3 py-3 sm:gap-4">
        <Link className="focus-ring min-w-0 rounded-sm" href="/">
          <BrandLogo className="min-w-0" markClassName="h-10 w-10 sm:h-11 sm:w-11" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#0B132B] lg:flex">
          {navItems.map((item) => (
            <Link
              className="focus-ring rounded-sm transition-colors hover:text-[#00B3A4]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <DashboardMenu />
      </div>
    </header>
  );
}
