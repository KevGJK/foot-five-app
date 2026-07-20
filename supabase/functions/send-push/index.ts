import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendPushToDevices } from "./firebase.ts";

Deno.serve(async (req) => {

console.log("🚀 send-push appelée :", req.method);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));

const { notificationId } = body;

console.log("📩 notificationId :", notificationId);

  if (!notificationId) {

  return Response.json(
    {
      error: "notificationId manquant"
    },
    {
      status: 400,
      headers: corsHeaders
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

console.log("👥 Destinataires :", profileIds);

if (profileIds.length === 0) {

  return Response.json(
    {
      success: true,
      notificationId: notification.id,
      recipients: 0,
      devices: 0,
      results: []
    },
    {
      headers: corsHeaders
    }
  );

}

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

const validDevices = devices.filter(
  (device) =>
    device.token &&
    device.token.trim().length > 0
);

console.log(
  `📱 Envoi vers ${validDevices.length} appareil(s)`
);

const results = await sendPushToDevices(
  validDevices,
  {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    action: notification.action,
    action_id: notification.action_id,
  }
);

return Response.json(
  {
    success: true,
    notificationId: notification.id,
    recipients: recipients.length,
    devices: validDevices.length,
    results,
  },
  {
    headers: corsHeaders,
  }
);

  }

  catch (e) {

  console.error(e);

  return Response.json(
    {
      success: false,
      error: e instanceof Error ? e.message : String(e)
    },
    {
      status: 500,
      headers: corsHeaders
    }
  );

}

});