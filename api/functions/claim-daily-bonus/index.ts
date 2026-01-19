import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        console.log("----- CLAIM BONUS FUNCTION STARTED -----");
        // Hybrid Auth Check (same as spin)
        const customAuth = req.headers.get('x-custom-auth');
        const authHeader = customAuth ? `Bearer ${customAuth}` : req.headers.get('Authorization')!;
        console.log(`Auth Header present: ${!!authHeader}, Custom Auth: ${!!customAuth}`);

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');
        console.log(`Service Role Key available: ${!!serviceKey}`);

        const adminSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceKey ?? ''
        )

        console.log("Fetching User...");
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error("User Auth Failed:", userError);
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: userError }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }
        console.log(`User found: ${user.id}`);

        // 1. GET PROFILE using admin client
        console.log("Fetching Profile via Admin Client...");
        const { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('credits, last_daily_bonus')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error("Profile Fetch Error:", profileError);
            throw new Error('Profile not found')
        }

        console.log(`Profile found. Credits: ${profile.credits}`);

        // 2. CHECK ELIGIBILITY
        const DAILY_REWARD_AMOUNT = 1000;
        const now = new Date();
        const lastBonus = profile.last_daily_bonus ? new Date(profile.last_daily_bonus) : null;

        if (lastBonus) {
            const diffTime = Math.abs(now.getTime() - lastBonus.getTime());
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            // 24 hours check
            if (diffTime < 24 * 60 * 60 * 1000) {
                console.log(`Bonus not available yet. Last claim: ${lastBonus}`);
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: `Bonus available in ${24 - diffHours} hours`
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }
        }

        // 3. UPDATE PROFILE using admin client
        console.log("Updating Profile...");
        const { data, error: updateError } = await adminSupabase
            .from('profiles')
            .update({
                credits: profile.credits + DAILY_REWARD_AMOUNT,
                last_daily_bonus: now.toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) {
            console.error("Update Error:", updateError);
            throw updateError
        }

        console.log("Bonus claimed successfully!");
        return new Response(
            JSON.stringify({
                success: true,
                newBalance: data.credits,
                reward: DAILY_REWARD_AMOUNT
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("GLOBAL CATCH ERROR:", error);
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
