import { getFCMToken } from "./firebaseMessaging";
import { supabase } from "../lib/supabase";

export async function registerNotifications() {

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permission refusée");
  }

  const token = await getFCMToken();

  if (!token) {
    throw new Error("Impossible d'obtenir le token Firebase");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

const { data, error } = await supabase
  .from("device_tokens")
  .insert({
    profile_id: user.id,
    token,
    platform: "web",
    updated_at: new Date().toISOString(),
  })
  .select();

console.log("device_tokens =", data);

if (error) {
  console.error("Erreur device_tokens :", error);
  throw error;
}

  return token;
}

export async function createNotification({
  clubId,
  createdBy,
  createdByName,
  type,
  title,
  message,
  action,
  actionId,
}) {

if (!clubId) {
  throw new Error("clubId manquant");
}

if (!createdBy) {
  throw new Error("createdBy manquant");
}

  // Création de la notification
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      club_id: clubId,
      created_by: createdBy,
      created_by_name: createdByName,
      type,
      title,
      message,
      action,
      action_id: actionId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Récupération des membres du club
  const { data: members, error: membersError } = await supabase
    .from("club_members")
    .select("profile_id")
    .eq("club_id", clubId);

  if (membersError) throw membersError;

  // Création des destinataires
  const rows = members.map((m) => ({
    notification_id: notification.id,
    profile_id: m.profile_id,
    is_read: false,
    delivered_at: new Date().toISOString(),
  }));

const { error: insertError } = await supabase
  .from("notification_users")
  .insert(rows);

if (insertError) throw insertError;

// Déclenche l'envoi des notifications
await sendPush(notification.id);

return notification;
}

export async function getUnreadCount(profileId) {

  if (!profileId) return 0;

  const { count, error } = await supabase
    .from("notification_users")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("profile_id", profileId)
    .eq("is_read", false);

  if (error) {
    console.error(error);
    return 0;
  }

  return count ?? 0;
}

async function sendPush(notificationId) {

  const { data, error } = await supabase.functions.invoke(
    "send-push",
    {
      body: { notificationId },
    }
  );

  if (error) {
    console.error("Erreur send-push :", error);
    throw error;
  }

  console.log("✅ send-push :", data);

  return data;
}