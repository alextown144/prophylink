"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createNotificationForUser } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  bookingConversationSchema,
  messageSendSchema
} from "@/lib/validation/account";

type BookingForConversation = {
  id: string;
  shift_id: string | null;
  organization_id: string;
  professional_profile_id: string;
  professional_profiles: {
    user_id: string;
  } | null;
};

type ConversationRef = {
  id: string;
};

type ConversationMemberRef = {
  user_id: string;
};

type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
type ConversationMemberInsert =
  Database["public"]["Tables"]["conversation_members"]["Insert"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function startBookingConversation(formData: FormData) {
  const user = await requireUser();
  const parsed = bookingConversationSchema.safeParse({
    bookingId: formString(formData, "booking_id")
  });

  if (!parsed.success) {
    redirect("/messages?status=invalid");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect("/messages?status=service_required");
  }

  const admin = createSupabaseAdminClient();
  const booking = await getBookingForConversation(admin, parsed.data.bookingId);

  if (!booking) {
    redirect("/messages?status=unavailable");
  }

  const participantUserIds = await getBookingParticipantUserIds(admin, booking);

  if (!participantUserIds.includes(user.id)) {
    redirect("/messages?status=unavailable");
  }

  const conversation = await ensureBookingConversation(admin, booking, participantUserIds);

  revalidatePath("/messages");
  redirect(`/messages/${conversation.id}`);
}

export async function sendConversationMessage(formData: FormData) {
  const user = await requireUser();
  const parsed = messageSendSchema.safeParse({
    body: formString(formData, "body"),
    conversationId: formString(formData, "conversation_id")
  });

  if (!parsed.success) {
    redirect("/messages?status=invalid");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect(`/messages/${parsed.data.conversationId}?status=service_required`);
  }

  const admin = createSupabaseAdminClient();
  const members = await getConversationMembers(admin, parsed.data.conversationId);

  if (!members.some((member) => member.user_id === user.id)) {
    redirect("/messages?status=unavailable");
  }

  const messagePayload: MessageInsert = {
    body: parsed.data.body,
    conversation_id: parsed.data.conversationId,
    sender_user_id: user.id
  };
  const { error } = await admin.from("messages").insert([messagePayload] as never[]);

  if (error) {
    redirect(`/messages/${parsed.data.conversationId}?status=failed`);
  }

  await admin
    .from("conversations")
    .update({ updated_at: new Date().toISOString() } as never)
    .eq("id", parsed.data.conversationId);

  await Promise.all(
    members
      .filter((member) => member.user_id !== user.id)
      .map((member) =>
        createNotificationForUser(admin, member.user_id, {
          body: parsed.data.body,
          metadata: { conversation_id: parsed.data.conversationId },
          title: "New message",
          type: "new_message"
        })
      )
  );

  revalidatePath("/messages");
  revalidatePath(`/messages/${parsed.data.conversationId}`);
  revalidatePath("/notifications");
  redirect(`/messages/${parsed.data.conversationId}?status=sent`);
}

async function getBookingForConversation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  bookingId: string
) {
  const { data } = await admin
    .from("bookings")
    .select("id, shift_id, organization_id, professional_profile_id, professional_profiles(user_id)")
    .eq("id", bookingId)
    .maybeSingle();

  return data as BookingForConversation | null;
}

async function getBookingParticipantUserIds(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  booking: BookingForConversation
) {
  const { data } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", booking.organization_id);
  const organizationUserIds = ((data ?? []) as ConversationMemberRef[]).map(
    (member) => member.user_id
  );

  return Array.from(
    new Set([
      ...organizationUserIds,
      ...(booking.professional_profiles?.user_id ? [booking.professional_profiles.user_id] : [])
    ])
  );
}

async function ensureBookingConversation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  booking: BookingForConversation,
  participantUserIds: string[]
) {
  const { data: existingConversation } = await admin
    .from("conversations")
    .select("id")
    .eq("booking_id", booking.id)
    .maybeSingle();

  if (existingConversation) {
    await ensureConversationMembers(
      admin,
      (existingConversation as ConversationRef).id,
      participantUserIds
    );
    return existingConversation as ConversationRef;
  }

  const conversationPayload: ConversationInsert = {
    booking_id: booking.id,
    shift_id: booking.shift_id
  };
  const { data: conversation, error } = await admin
    .from("conversations")
    .insert([conversationPayload] as never[])
    .select("id")
    .single();

  if (error || !conversation) {
    redirect("/messages?status=failed");
  }

  const conversationRef = conversation as ConversationRef;
  await ensureConversationMembers(admin, conversationRef.id, participantUserIds);

  return conversationRef;
}

async function ensureConversationMembers(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  conversationId: string,
  userIds: string[]
) {
  const uniqueUserIds = Array.from(new Set(userIds));

  if (uniqueUserIds.length === 0) {
    return;
  }

  const memberPayloads: ConversationMemberInsert[] = uniqueUserIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId
  }));

  await admin.from("conversation_members").upsert(memberPayloads as never[]);
}

async function getConversationMembers(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  conversationId: string
) {
  const { data } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);

  return (data ?? []) as ConversationMemberRef[];
}
