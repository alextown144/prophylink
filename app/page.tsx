import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  UsersRound
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { Button } from "@/components/ui/button";

const trustPoints = [
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Find Shifts Fast",
    text: "Post or search in seconds."
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Trusted Professionals",
    text: "Verified and reviewed hygienists."
  },
  {
    icon: <Clock3 className="h-5 w-5" />,
    title: "Save Time",
    text: "Less scheduling. More dentistry."
  },
  {
    icon: <Heart className="h-5 w-5" />,
    title: "Built For Dental Teams",
    text: "By people who get it."
  }
];

const steps = [
  {
    icon: <CalendarDays className="h-9 w-9" />,
    title: "Post or Search",
    text: "Offices post shifts. Hygienists set their availability."
  },
  {
    icon: <UsersRound className="h-9 w-9" />,
    title: "Connect",
    text: "Find the right fit and confirm coverage in seconds."
  },
  {
    icon: <Sparkles className="h-9 w-9" />,
    title: "Show Up & Shine",
    text: "Work great shifts, build relationships, and grow your career."
  }
];

const shiftBlocks = [
  { day: "Mon", time: "8a - 5p", rate: "$70/hr", tone: "teal" },
  { day: "Tue", time: "8a - 4p", rate: "$68/hr", tone: "purple" },
  { day: "Thu", time: "12p - 6p", rate: "$65/hr", tone: "teal" },
  { day: "Fri", time: "7:30a - 3:30p", rate: "$72/hr", tone: "purple" }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white">
      <section className="relative border-b border-[#E2E8F0] bg-white">
        <div className="container grid items-center gap-10 py-10 lg:grid-cols-[0.86fr_1.14fr] lg:py-12">
          <div className="relative z-10 max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#C7F4F0] bg-[#E6FAF8] px-4 py-2 text-sm font-semibold text-[#006D67]">
              <CheckCircle2 className="h-4 w-4" />
              Invite-only beta for trusted dental teams
            </p>
            <h1 className="mt-7 font-heading text-4xl font-extrabold leading-[1.05] text-[#0B132B] sm:text-5xl lg:text-6xl">
              The Smarter Way to{" "}
              <span className="text-[#008F85]">Connect.</span>{" "}
              <span className="text-[#6D28D9]">Schedule.</span>{" "}
              <span className="text-[#00B3A4]">Smile.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#24324B] sm:text-xl">
              ProphyLink makes it easy for dental offices to find trusted
              hygienists and for hygienists to find shifts that fit their
              schedule and their life.
            </p>
            <p className="mt-5 max-w-xl font-heading text-2xl font-semibold italic text-[#00A99D]">
              Connecting Dental Offices with Hygiene Professionals
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-14 text-base">
                <Link href="/signup?type=office">
                  <Building2 className="h-5 w-5" />
                  I&apos;m a Dental Office
                </Link>
              </Button>
              <Button asChild className="h-14 text-base" variant="outline">
                <Link href="/signup?type=professional">
                  <UserRound className="h-5 w-5" />
                  I&apos;m a Hygienist
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <MiniTrustCard key={point.title} {...point} />
              ))}
            </div>
          </div>

          <div className="relative min-h-[430px] lg:min-h-[520px]">
            <div className="absolute -right-20 bottom-0 h-48 w-[34rem] rotate-[-8deg] rounded-[100%] bg-[#6D28D9]" />
            <div className="absolute -right-24 bottom-20 h-36 w-[40rem] rotate-[-10deg] rounded-[100%] bg-[#00B3A4]" />
            <div className="relative h-full overflow-hidden rounded-none lg:-mr-24">
              <Image
                alt="Dental hygienist in a bright clinic with ProphyLink schedule screens"
                className="h-[430px] w-full object-cover object-center lg:h-[520px]"
                height={960}
                priority
                src="/brand/prophylink-hero.png"
                width={1744}
              />
              <div className="absolute bottom-6 right-5 w-72 rounded-lg border border-white/70 bg-white/92 p-4 shadow-brand backdrop-blur">
                <div className="mb-2 flex text-[#F5B301]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star className="h-4 w-4 fill-current" key={star} />
                  ))}
                </div>
                <p className="text-sm font-semibold leading-6 text-[#0B132B]">
                  ProphyLink has been a game changer for our office.
                </p>
                <p className="mt-1 text-xs font-medium text-[#64748B]">
                  Office Manager
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071227] py-12 text-white" id="for-offices">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <BrandLogo
              className="text-white"
              inverse
              markClassName="h-12 w-12"
              showTagline={false}
            />
            <h2 className="mt-8 max-w-xl font-heading text-4xl font-extrabold leading-tight sm:text-5xl">
              Connect with{" "}
              <span className="text-[#00D1C1]">Confidence.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-200">
              Dental offices can post coverage needs, find available
              professionals, and keep scheduling details organized from one
              focused place.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <AudienceCard
                href="/signup?type=office"
                icon={<Building2 className="h-9 w-9" />}
                text="Find hygienists and fill shifts fast."
                title="For Dental Offices"
              />
              <AudienceCard
                href="/signup?type=professional"
                icon={<UserRound className="h-9 w-9" />}
                text="Find great opportunities that fit your life."
                title="For Hygienists"
                variant="purple"
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-brand">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[#6EF4E8]">
                  Shift Board
                </p>
                <h3 className="mt-1 font-heading text-2xl font-bold">
                  This Week&apos;s Coverage
                </h3>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#0B132B]">
                <MapPin className="h-4 w-4 text-[#00B3A4]" />
                Tri-Cities
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {shiftBlocks.map((shift) => (
                <ShiftTile key={`${shift.day}-${shift.time}`} {...shift} />
              ))}
            </div>
            <div className="grid gap-3 rounded-lg bg-white p-4 text-[#0B132B] sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6FAF8] text-[#00A99D]">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold">
                  Bright Smiles Dental
                </p>
                <p className="text-sm text-[#64748B]">
                  Hygienist needed Monday, 8:00 AM - 5:00 PM
                </p>
              </div>
              <p className="text-xl font-bold text-[#00A99D]">$72/hr</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14" id="how-it-works">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold text-[#0B132B] sm:text-4xl">
              How <span className="italic text-[#00A99D]">ProphyLink</span> Works
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <StepCard key={step.title} {...step} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-8" id="about">
        <div className="container grid gap-6 md:grid-cols-4">
          <Stat value="250+" label="Trusted By Dental Offices" />
          <Stat value="1,000+" label="Hygiene Professionals And Growing" />
          <Stat value="3,000+" label="Shifts Filled Every Month" />
          <div className="flex items-center justify-center gap-3 rounded-lg bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-semibold text-[#64748B]">
                5-Star Rated
              </p>
              <div className="mt-1 flex text-[#F5B301]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star className="h-5 w-5 fill-current" key={star} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14" id="for-hygienists">
        <div className="container grid gap-8 lg:grid-cols-3">
          <PlanCard
            badge="Marketplace"
            icon={<Search className="h-6 w-6" />}
            text="Browse nearby shifts, see details quickly, and connect with offices that match your schedule."
            title="Find Work That Fits"
          />
          <PlanCard
            badge="Admin Selectable"
            icon={<ShieldCheck className="h-6 w-6" />}
            text="Subscription gates are designed so admins can change what each plan unlocks as the product matures."
            title="Flexible Plan Access"
          />
          <PlanCard
            badge="Invite Beta"
            icon={<CheckCircle2 className="h-6 w-6" />}
            text="Launch stays invite-only now, with a clean path to switch to open signup when the market is ready."
            title="Built For A Calm Beta"
          />
        </div>
      </section>

      <section className="bg-[#F3E8FF] py-14" id="pricing">
        <div className="container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-[#6D28D9]">Beta pricing foundation</p>
            <h2 className="mt-2 max-w-2xl font-heading text-3xl font-bold text-[#0B132B]">
              Start with the marketplace, then unlock richer tools by plan.
            </h2>
          </div>
          <Button asChild className="h-12 px-6">
            <Link href="/signup">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function MiniTrustCard({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-4 rounded-lg bg-white/80 p-3 shadow-sm ring-1 ring-[#E2E8F0]">
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#008F85] text-white shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-base font-bold leading-6 text-[#0B132B]">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-[#24324B]">{text}</p>
      </div>
    </div>
  );
}

function AudienceCard({
  href,
  icon,
  text,
  title,
  variant = "teal"
}: {
  href: string;
  icon: ReactNode;
  text: string;
  title: string;
  variant?: "teal" | "purple";
}) {
  const tone =
    variant === "purple"
      ? "from-[#6D28D9] to-[#8B5CF6]"
      : "from-[#008F85] to-[#00B3A4]";

  return (
    <Link
      className={`focus-ring group flex items-center gap-4 rounded-lg bg-gradient-to-r ${tone} p-5 text-white shadow-soft transition-transform hover:-translate-y-0.5`}
      href={href}
    >
      <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-white/16">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-bold uppercase">{title}</p>
        <p className="mt-1 text-sm leading-5 text-white/90">{text}</p>
      </div>
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-[#0B132B] transition-transform group-hover:translate-x-1">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function ShiftTile({
  day,
  rate,
  time,
  tone
}: {
  day: string;
  rate: string;
  time: string;
  tone: string;
}) {
  const classes =
    tone === "purple"
      ? "bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
      : "bg-gradient-to-br from-[#00B3A4] to-[#008F85]";

  return (
    <div className={`${classes} rounded-lg p-4 text-white`}>
      <p className="text-xs font-semibold uppercase text-white/80">{day}</p>
      <p className="mt-4 font-heading text-lg font-bold">{time}</p>
      <p className="mt-1 text-sm font-semibold">{rate}</p>
    </div>
  );
}

function StepCard({
  icon,
  text,
  title
}: {
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#00B3A4] to-[#008F85] text-white shadow-soft">
        {icon}
      </div>
      <h3 className="mt-5 font-heading text-xl font-bold text-[#0B132B]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-xs leading-7 text-[#24324B]">{text}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-5 text-center shadow-soft">
      <p className="font-heading text-3xl font-extrabold text-[#00A99D]">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#24324B]">{label}</p>
    </div>
  );
}

function PlanCard({
  badge,
  icon,
  text,
  title
}: {
  badge: string;
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E6FAF8] text-[#008F85]">
          {icon}
        </div>
        <span className="rounded-md bg-[#F3E8FF] px-3 py-1 text-xs font-bold text-[#6D28D9]">
          {badge}
        </span>
      </div>
      <h3 className="mt-6 font-heading text-xl font-bold text-[#0B132B]">
        {title}
      </h3>
      <p className="mt-3 leading-7 text-[#24324B]">{text}</p>
    </div>
  );
}
