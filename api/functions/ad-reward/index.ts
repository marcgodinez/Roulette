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

        // Parse body for specific ad network verification tokens if needed
        // const { token } = await req.json() 

        // For now, we trust the client's request (authenticated), 
        // but in production, we should verify the `token` with AdMob/RevenueCat server-side callbacks.

        const REWARD_AMOUNT = 500; // Standard Ad Reward

        // 1. GET PROFILE
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) throw new Error('Profile not found')

        // 2. UPDATE CREDITS
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ credits: profile.credits + REWARD_AMOUNT })
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({
                success: true,
                newBalance: data.credits,
                reward: REWARD_AMOUNT
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
