import "@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {

  try {

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { notificationId } = await req.json();

    if (!notificationId) {

      return Response.json(
        {
          error: "notificationId manquant"
        },
        {
          status: 400
        }
      );

    }

    const {

      data: notification,

      error

    } = await supabase

      .from("notifications")

      .select("*")

      .eq("id", notificationId)

      .single();

    if (error) {

      throw error;

    }

    const {

  data: recipients,

  error: recipientsError

} = await supabase

  .from("notification_users")

  .select("profile_id")

  .eq("notification_id", notification.id);

if (recipientsError) {

  throw recipientsError;

}

const profileIds = recipients.map((r) => r.profile_id);

const {

  data: devices,

  error: devicesError

} = await supabase

  .from("device_tokens")

  .select("profile_id, token, platform")

  .in("profile_id", profileIds);

if (devicesError) {

  throw devicesError;

}

console.log("Notification :", notification);

console.log("Destinataires :", recipients.length);

console.log("Appareils :", devices.length);

return Response.json({

  success: true,

  notification,

  recipients,

  devices

});

  }

  catch (e) {

    console.error(e);

    return Response.json({

      success: false,

      error: e.message

    },{

      status:500

    });

  }

});