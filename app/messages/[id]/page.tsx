import { ArrowLeft, CalendarDays, Clock, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendConversationMessage } from "@/app/messages/actions";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

type ConversationMember = {
  user_id: string;
  user_profiles: {
    display_name: string | null;
    email: string;
  } | null;
};

type Conversation = {
  id: string;
  booking_id: string | null;
  shift_id: string | null;
  updated_at: string;
  bookings: {
    status: string;
    agreed_starts_at: string;
    agreed_ends_at: string;
    organizations: {
      name: string;
    } | null;
    professional_profiles: {
      user_profiles: {
        display_name: string | null;
        email: string;
      } | null;
      professional_roles: {
        name: string;
      } | null;
    } | null;
  } | null;
};

type Message = {
  id: string;
  body: string;
  created_at: string;
  sender_user_id: string;
  user_profiles: {
    display_name: string | null;
    email: string;
  } | null;
};

export default async function MessageThreadPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const [{ id }, { status }] = await Promise.all([params, searchParams]);
  const { conversation, members, messages, serviceConfigured } =
    await getMessageThreadData(user.id, id);

  if (!serviceConfigured) {
    return (
      <main className="container py-10">
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold text-slate-950">Messaging needs server setup</p>
            <p className="mt-2 leading-7 text-slate-600">
              Configure the Supabase service role key before messages can be loaded.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!conversation) {
    notFound();
  }

  const booking = conversation.bookings;

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Button asChild size="sm" variant="ghost">
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4" />
              Messages
            </Link>
          </Button>
          <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-teal-700">
            Booking conversation
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {booking?.organizations?.name ?? "Shift conversation"}
          </h1>
          {booking ? (
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <IconFact
                icon={<CalendarDays className="h-4 w-4" />}
                text={formatShiftDate(booking.agreed_starts_at)}
              />
              <IconFact
                icon={<Clock className="h-4 w-4" />}
                text={formatShiftTime(booking.agreed_starts_at, booking.agreed_ends_at)}
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {booking?.status ? <Badge>{formatStatus(booking.status)}</Badge> : null}
          <Badge variant="outline">{members.length} members</Badge>
        </div>
      </div>

      <StatusMessage status={status} />

      <section className="grid gap-6 lg:grid-cols-[1fr_0.36fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thread</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid max-h-[34rem] gap-3 overflow-y-auto rounded-lg bg-slate-50 p-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble
                    isMine={message.sender_user_id === user.id}
                    key={message.id}
                    message={message}
                  />
                ))
              ) : (
                <div className="rounded-lg bg-white p-4">
                  <p className="font-semibold text-slate-950">No messages yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Send the first message to coordinate arrival details or shift notes.
                  </p>
                </div>
              )}
            </div>

            <form action={sendConversationMessage} className="grid gap-3">
              <input name="conversation_id" type="hidden" value={conversation.id} />
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Message</span>
                <textarea
                  className="focus-ring min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none"
                  maxLength={2000}
                  name="body"
                  placeholder="Write a message..."
                  required
                />
              </label>
              <Button type="submit">
                Send message
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {members.map((member) => (
              <div className="rounded-lg border bg-white p-3" key={member.user_id}>
                <p className="flex items-center gap-2 font-semibold text-slate-950">
                  <UserRound className="h-4 w-4 text-teal-700" />
                  {member.user_profiles?.display_name ?? member.user_profiles?.email ?? "Member"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

async function getMessageThreadData(userId: string, conversationId: string) {
  if (!isSupabaseServiceRoleConfigured()) {
    return {
      conversation: null,
      members: [] as ConversationMember[],
      messages: [] as Message[],
      serviceConfigured: false
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: currentMember } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!currentMember) {
    return {
      conversation: null,
      members: [] as ConversationMember[],
      messages: [] as Message[],
      serviceConfigured: true
    };
  }

  const [conversationResult, membersResult, messagesResult] = await Promise.all([
    admin
      .from("conversations")
      .select(
        "id, booking_id, shift_id, updated_at, bookings(status, agreed_starts_at, agreed_ends_at, organizations(name), professional_profiles(user_profiles(display_name, email), professional_roles(name)))"
      )
      .eq("id", conversationId)
      .maybeSingle(),
    admin
      .from("conversation_members")
      .select("user_id, user_profiles(display_name, email)")
      .eq("conversation_id", conversationId),
    admin
      .from("messages")
      .select("id, body, created_at, sender_user_id, user_profiles(display_name, email)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100)
  ]);

  return {
    conversation: conversationResult.data as Conversation | null,
    members: (membersResult.data ?? []) as ConversationMember[],
    messages: (messagesResult.data ?? []) as Message[],
    serviceConfigured: true
  };
}

function MessageBubble({ isMine, message }: { isMine: boolean; message: Message }) {
  return (
    <div className={isMine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isMine
            ? "max-w-[42rem] rounded-lg bg-teal-700 p-3 text-white"
            : "max-w-[42rem] rounded-lg border bg-white p-3 text-slate-950"
        }
      >
        <p className={isMine ? "text-xs font-semibold text-teal-100" : "text-xs font-semibold text-slate-500"}>
          {message.user_profiles?.display_name ?? message.user_profiles?.email ?? "Member"} -{" "}
          {formatMessageDate(message.created_at)}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status?: string }) {
  const message =
    {
      failed: "Message could not be sent. Try again.",
      sent: "Message sent.",
      service_required: "Server configuration is required before messaging can be used."
    }[status ?? ""] ?? null;

  return message ? (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  ) : null;
}

function IconFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 text-teal-700">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatShiftDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatShiftTime(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
