import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // 1. GET PROFILE
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits, last_daily_bonus')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) throw new Error('Profile not found')

        // 2. CHECK ELIGIBILITY
        const DAILY_REWARD_AMOUNT = 1000;
        const now = new Date();
        const lastBonus = profile.last_daily_bonus ? new Date(profile.last_daily_bonus) : null;

        if (lastBonus) {
            const diffTime = Math.abs(now.getTime() - lastBonus.getTime());
            // 24 Hour Constraint
            if (diffTime < 24 * 60 * 60 * 1000) {
                const hoursRemaining = Math.ceil((24 * 3600 * 1000 - diffTime) / (3600 * 1000));
                return new Response(
                    JSON.stringify({ error: `Bonus available in ${hoursRemaining} hours` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }
        }

        // 3. UPDATE PROFILE
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({
                credits: profile.credits + DAILY_REWARD_AMOUNT,
                last_daily_bonus: now.toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({
                success: true,
                newBalance: data.credits,
                reward: DAILY_REWARD_AMOUNT
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
