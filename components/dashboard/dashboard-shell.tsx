import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="container py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</section>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Milestone 1 shell</CardTitle>
          <CardDescription>
            This page intentionally stops at a dashboard shell until account,
            profile, availability, marketplace, and booking workflows are approved
            for later milestones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="leading-7 text-slate-600">
            The route exists so navigation, authorization boundaries, and future
            layout decisions can be reviewed before the feature workflows depend
            on them.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
