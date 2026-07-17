import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {

      return Response.json({

        success: true,

        application: "Foot Five Manager",

        version: "1.0.0",

        message: "Edge Function opérationnelle 🚀",

        serverTime: new Date().toISOString()

      });

    }
  ),
};