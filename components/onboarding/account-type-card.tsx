import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountTypeCard({
  href,
  icon: Icon,
  title,
  description
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link className="focus-ring block rounded-lg" href={href}>
      <Card className="h-full transition-colors hover:border-teal-400">
        <CardHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="flex items-center justify-between gap-3">
            {title}
            <ArrowRight className="h-5 w-5 text-teal-700" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-7 text-slate-600">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
