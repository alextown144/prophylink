import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/marketing/brand-logo";

const navItems = [
  { href: "/#for-offices", label: "For Offices" },
  { href: "/#for-hygienists", label: "For Hygienists" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#about", label: "About Us" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/92 backdrop-blur">
      <div className="container flex min-h-20 items-center justify-between gap-4 py-3">
        <Link className="focus-ring rounded-sm" href="/">
          <BrandLogo markClassName="h-11 w-11" />
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
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex" size="sm">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
