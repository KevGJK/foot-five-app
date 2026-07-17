import { supabase } from "../lib/supabase";

export async function testBackend() {

    const { data, error } = await supabase.functions.invoke(
        "send-push",
        {
            body: {}
        }
    );

    if (error) {
        throw error;
    }

    return data;
}
