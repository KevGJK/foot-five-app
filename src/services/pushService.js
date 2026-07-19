import { supabase } from "../lib/supabase";

export async function sendPush(notificationId) {

  const { data, error } = await supabase.functions.invoke("send-push", {
    body: {
      notificationId,
    },
  });

  if (error) {
    console.error("Erreur Edge Function :", error);
    throw error;
  }

  console.log("✅ Edge Function :", data);

  return data;
}