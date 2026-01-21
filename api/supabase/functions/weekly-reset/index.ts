import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        // 1. Initialize Supabase Client (Service Role required for database RPC)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log("[Weekly Reset] Starting League processing...")

        // 2. Call the Database RPC function we created
        const { error } = await supabaseAdmin.rpc('reset_weekly_leagues')

        if (error) {
            console.error("[Weekly Reset] RPC Failed:", error)
            return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        console.log("[Weekly Reset] Success!")

        return new Response(
            JSON.stringify({ message: "Leagues reset successfully." }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
