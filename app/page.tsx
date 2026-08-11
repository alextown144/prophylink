import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const professionalCards = [
  {
    name: "Sarah M.",
    role: "Dental Hygienist",
    city: "Richland, WA",
    rate: "$72/hr",
    detail: "Available Sep 18",
    skills: ["Local anesthesia", "Dentrix", "Periodontics"]
  },
  {
    name: "Megan T.",
    role: "Dental Assistant",
    city: "Kennewick, WA",
    rate: "$34/hr",
    detail: "Available this week",
    skills: ["Chairside", "Open Dental", "Sterilization"]
  }
];

const shiftCards = [
  {
    date: "Thu, Sep 18",
    office: "Richland Family Dental",
    role: "Dental Hygienist",
    time: "8:00 AM-5:00 PM",
    rate: "$75/hr"
  },
  {
    date: "Fri, Sep 19",
    office: "Three Rivers Dentistry",
    role: "Dental Assistant",
    time: "7:30 AM-3:30 PM",
    rate: "$32/hr"
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b bg-white/70">
        <div className="container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr] lg:py-12">
          <div className="max-w-3xl">
            <Badge variant="secondary">Tri-Cities beta foundation</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              ProphyLink
            </h1>
            <p className="mt-4 max-w-2xl text-xl font-medium text-teal-800">
              Connecting Dental Offices with Dental Professionals
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Find the right dental professional when you need coverage, or find
              flexible shifts that fit your schedule. Built first for dental
              hygienists and dental assistants.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup?type=professional">
                  I&apos;m a Dental Professional <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup?type=office">
                  I&apos;m a Dental Office <Search className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarCheck className="h-5 w-5 text-teal-700" />
                  Available professionals
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {professionalCards.map((professional) => (
                  <div
                    className="rounded-lg border bg-white p-4"
                    key={professional.name}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {professional.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {professional.role}
                        </p>
                      </div>
                      <Badge>{professional.rate}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {professional.city}
                      </span>
                      <span>{professional.detail}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {professional.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-5 w-5 text-teal-700" />
                  Open shifts nearby
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {shiftCards.map((shift) => (
                  <div className="rounded-lg border bg-slate-50 p-4" key={shift.date}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{shift.date}</p>
                      <Badge variant="secondary">{shift.rate}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {shift.office}
                    </p>
                    <p className="text-sm text-slate-600">
                      {shift.role} | {shift.time}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Set availability"
            text="Professionals can quickly show the days and times they are open for work."
          />
          <FeatureCard
            icon={<HeartHandshake className="h-5 w-5" />}
            title="Confirm coverage"
            text="Offices can search, post shifts, invite professionals, and keep approvals clear."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Build trust"
            text="Credential review, RLS, careful privacy boundaries, and admin control are designed into the foundation."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-7 text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}
