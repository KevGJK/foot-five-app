import { supabase } from "../lib/supabase";
import { getCurrentUser } from "./auth";

export async function loadSettings() {

    const user = await getCurrentUser();

    if (!user) return null;

    let { data } = await supabase

        .from("user_settings")

        .select("*")

        .eq("profile_id", user.id)

        .single();

    if (!data) {

        const { data: created } = await supabase

            .from("user_settings")

            .insert({

                profile_id: user.id

            })

            .select()

            .single();

        data = created;

    }

    return data;

}

export async function saveSettings(settings) {

    const user = await getCurrentUser();

    if (!user) return;

    await supabase

        .from("user_settings")

        .upsert({

            profile_id: user.id,

            ...settings,

            updated_at: new Date().toISOString()

        });

}