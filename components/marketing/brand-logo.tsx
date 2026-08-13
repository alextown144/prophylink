import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  inverse = false,
  markClassName,
  showTagline = true
}: {
  className?: string;
  inverse?: boolean;
  markClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <LogoMark className={markClassName} />
      <div className="min-w-0 leading-none">
        <p
          className={cn(
            "font-heading text-xl font-bold sm:text-3xl",
            inverse ? "text-white" : "text-[#0B132B]"
          )}
        >
          Prophy<span className="text-[#00B3A4]">Link</span>
        </p>
        {showTagline ? (
          <p
            className={cn(
              "mt-1 max-w-40 text-[0.72rem] font-medium leading-tight sm:max-w-none sm:text-sm",
              inverse ? "text-white" : "text-[#0B132B]"
            )}
          >
            Connecting Dental Offices with Hygiene Professionals
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-12 w-12 flex-none", className)}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M31.9 15.1C24.8 3.7 6.7 9.2 7.8 24.6c.6 8.8 7.8 13.5 9.4 22.8.8 4.9 6.9 6.4 9.7 2.3 2.4-3.6 3-8.4 5-8.4 2.1 0 2.6 4.8 5 8.4 2.8 4.1 8.9 2.6 9.7-2.3 1.6-9.3 8.8-14 9.4-22.8C57.1 9.2 39 3.7 31.9 15.1Z"
        stroke="url(#mark-teal)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.8"
      />
      <path
        d="M31.9 15.1C39 3.7 57.1 9.2 56 24.6c-.6 8.8-7.8 13.5-9.4 22.8-.8 4.9-6.9 6.4-9.7 2.3-2.4-3.6-3-8.4-5-8.4"
        stroke="url(#mark-purple)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.8"
      />
      <path
        d="M23.7 31.2c-2.6-2.6-2.6-6.8 0-9.4 2.6-2.6 6.8-2.6 9.4 0l1.3 1.3m5.9 9.7c2.6 2.6 2.6 6.8 0 9.4-2.6 2.6-6.8 2.6-9.4 0l-1.3-1.3"
        stroke="#6D28D9"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <path
        d="M28.4 36.4 35.6 29"
        stroke="#00B3A4"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <defs>
        <linearGradient id="mark-teal" x1="8" x2="36" y1="10" y2="58">
          <stop stopColor="#00B3A4" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="mark-purple" x1="31" x2="58" y1="8" y2="55">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
