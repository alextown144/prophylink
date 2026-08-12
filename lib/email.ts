import "server-only";
import { publicEnv } from "@/lib/config/env";
import { serverEnv } from "@/lib/config/server-env";

export type EmailMessage = {
  idempotencyKey?: string;
  subject: string;
  text: string;
  to: string;
};

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export async function sendEmail(message: EmailMessage) {
  if (serverEnv.EMAIL_DELIVERY_MODE === "off") {
    return { delivered: false, mode: "off" as const };
  }

  if (serverEnv.EMAIL_DELIVERY_MODE === "log") {
    console.info("[email:log]", {
      subject: message.subject,
      to: message.to
    });
    return { delivered: false, mode: "log" as const };
  }

  if (!serverEnv.RESEND_API_KEY || !serverEnv.EMAIL_FROM) {
    console.warn("[email:resend] Missing RESEND_API_KEY or EMAIL_FROM.");
    return { delivered: false, mode: "resend" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: serverEnv.EMAIL_FROM,
      subject: message.subject,
      text: message.text,
      to: [message.to]
    }),
    headers: {
      Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {})
    },
    method: "POST"
  });

  if (!response.ok) {
    let payload: ResendResponse | null = null;

    try {
      payload = (await response.json()) as ResendResponse;
    } catch {
      payload = null;
    }

    console.warn("[email:resend] Email delivery failed.", {
      error: payload?.message ?? payload?.name ?? response.statusText,
      status: response.status,
      to: message.to
    });
    return { delivered: false, mode: "resend" as const };
  }

  return { delivered: true, mode: "resend" as const };
}

export function appUrl(path: string) {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
