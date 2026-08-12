import { MessageSquareText, PlusCircle } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<{
  status?: string;
}>;

type ConversationMember = {
  conversation_id: string;
  user_id: string;
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
    office_locations: {
      name: string | null;
      city: string;
      state: string;
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

type MessagePreview = {
  conversation_id: string;
  body: string;
  created_at: string;
  sender_user_id: string;
};

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const { status } = await searchParams;
  const { conversations, latestMessagesByConversationId, serviceConfigured } =
    await getMessagesPageData(user.id);

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
            Messages
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Booking conversations
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Coordinate shift details after an office selects a professional.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/notifications">Notifications</Link>
        </Button>
      </div>

      <StatusMessage status={status} />

      {!serviceConfigured ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold text-slate-950">Messaging needs server setup</p>
            <p className="mt-2 leading-7 text-slate-600">
              Configure the Supabase service role key before booking conversations can be loaded.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <ConversationCard
                  conversation={conversation}
                  key={conversation.id}
                  latestMessage={latestMessagesByConversationId.get(conversation.id)}
                />
              ))
            ) : (
              <div className="rounded-lg bg-slate-50 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-slate-950">No conversations yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Open a selected booking from your schedule or shift details to start messaging.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

async function getMessagesPageData(userId: string) {
  if (!isSupabaseServiceRoleConfigured()) {
    return {
      conversations: [] as Conversation[],
      latestMessagesByConversationId: new Map<string, MessagePreview>(),
      serviceConfigured: false
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: memberData } = await admin
    .from("conversation_members")
    .select("conversation_id, user_id")
    .eq("user_id", userId);
  const conversationIds = ((memberData ?? []) as ConversationMember[]).map(
    (member) => member.conversation_id
  );

  if (conversationIds.length === 0) {
    return {
      conversations: [] as Conversation[],
      latestMessagesByConversationId: new Map<string, MessagePreview>(),
      serviceConfigured: true
    };
  }

  const [conversationsResult, messagesResult] = await Promise.all([
    admin
      .from("conversations")
      .select(
        "id, booking_id, shift_id, updated_at, bookings(status, agreed_starts_at, agreed_ends_at, organizations(name), office_locations(name, city, state), professional_profiles(user_profiles(display_name, email), professional_roles(name)))"
      )
      .in("id", conversationIds)
      .order("updated_at", { ascending: false }),
    admin
      .from("messages")
      .select("conversation_id, body, created_at, sender_user_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .limit(100)
  ]);
  const latestMessagesByConversationId = new Map<string, MessagePreview>();

  ((messagesResult.data ?? []) as MessagePreview[]).forEach((message) => {
    if (!latestMessagesByConversationId.has(message.conversation_id)) {
      latestMessagesByConversationId.set(message.conversation_id, message);
    }
  });

  return {
    conversations: (conversationsResult.data ?? []) as Conversation[],
    latestMessagesByConversationId,
    serviceConfigured: true
  };
}

function ConversationCard({
  conversation,
  latestMessage
}: {
  conversation: Conversation;
  latestMessage?: MessagePreview;
}) {
  const booking = conversation.bookings;

  return (
    <Link
      className="focus-ring rounded-lg border bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50"
      href={`/messages/${conversation.id}`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={booking?.status === "confirmed" ? "default" : "outline"}>
              {booking?.status ? formatStatus(booking.status) : "Conversation"}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              {formatConversationDate(conversation.updated_at)}
            </span>
          </div>
          <h2 className="mt-3 font-semibold text-slate-950">
            {booking?.organizations?.name ?? "Booking conversation"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {booking ? formatShiftWindow(booking.agreed_starts_at, booking.agreed_ends_at) : "Shift details unavailable"}
          </p>
          <p className="mt-1 text-sm font-semibold text-teal-700">
            {booking?.professional_profiles?.user_profiles?.display_name ??
              booking?.professional_profiles?.user_profiles?.email ??
              booking?.professional_profiles?.professional_roles?.name ??
              "Professional"}
          </p>
        </div>
        <MessageSquareText className="h-5 w-5 text-teal-700" />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
        {latestMessage?.body ?? "No messages yet."}
      </p>
    </Link>
  );
}

function StatusMessage({ status }: { status?: string }) {
  const message =
    {
      failed: "Messaging could not be updated. Try again.",
      invalid: "That messaging action was not valid.",
      service_required: "Server configuration is required before messaging can be used.",
      unavailable: "That conversation is not available for your account."
    }[status ?? ""] ?? null;

  return message ? (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  ) : null;
}

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatShiftWindow(startsAt: string, endsAt: string) {
  const day = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles"
  }).format(new Date(startsAt));
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${day}, ${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
