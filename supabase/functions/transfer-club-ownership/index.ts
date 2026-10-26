
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    return withSupabase({ auth: "user" }, async (request, ctx) => {
      const jsonResponse = (
        body: Record<string, unknown>,
        status: number,
      ) =>
        new Response(JSON.stringify(body), {
          status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });

      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      try {
        const body = await request.json();
        const clubId = body?.club_id;
        const newOwnerId = body?.new_owner_id;

        if (
          typeof clubId !== "string" ||
          typeof newOwnerId !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId) ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newOwnerId)
        ) {
          return jsonResponse({ error: "Invalid club or owner ID" }, 400);
        }

        const { error } = await ctx.supabase.rpc(
          "transfer_club_ownership",
          {
            p_club_id: clubId,
            p_new_owner_id: newOwnerId,
          },
        );

        if (error) {
          console.error("Club ownership transfer failed:", error.code);

          if (error.code === "42501") {
            return jsonResponse(
              { error: "You are not authorized to transfer this club." },
              403,
            );
          }

          if (error.code === "P0002") {
            return jsonResponse(
              { error: "The club or its ownership information was not found." },
              404,
            );
          }

          if (error.code === "22023") {
            return jsonResponse(
              { error: "The selected new owner is invalid." },
              400,
            );
          }

          return jsonResponse(
            { error: "The transfer could not be completed." },
            500,
          );
        }

        return jsonResponse({ success: true }, 200);
      } catch {
        return jsonResponse({ error: "Invalid request body." }, 400);
      }
    })(req);
  },
};
