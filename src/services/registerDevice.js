import { supabase } from "../lib/supabase";
import { getCurrentUser } from "./auth";
import { getFCMToken } from "./firebaseMessaging";

export async function registerDevice() {
  try {
    const user = await getCurrentUser();

    if (!user) return;

    const token = await getFCMToken();

    if (!token) return;

    const { error } = await supabase
      .from("device_tokens")
      .upsert(
        {
          profile_id: user.id,
          token,
          platform: "web",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "profile_id,token",
        }
      );

    if (error) {
      console.error(error);
    } else {
      console.log("✅ Appareil enregistré dans device_tokens");
    }
  } catch (err) {
    console.error(err);
  }
}