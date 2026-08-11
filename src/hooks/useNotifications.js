import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useNotifications() {

  const [unread, setUnread] = useState(0);

  async function loadUnread(profileId) {

    const { count } = await supabase
      .from("notification_users")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("profile_id", profileId)
      .eq("is_read", false);

    setUnread(count || 0);

  }

  return {
    unread,
    loadUnread
  };

}