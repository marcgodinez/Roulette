import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        // HYBRID AUTH:
        // 1. Gateway uses proper Anon Key (handled by Supabase Gateway)
        // 2. We extract the REAL User Token from 'x-custom-auth' header
        // 3. We use SERVICE_ROLE_KEY to bypass RLS and act as Admin

        const authHeader = req.headers.get('Authorization')
        const customAuth = req.headers.get('x-custom-auth')

        // Debug
        // console.log(`Headers: Auth=${authHeader?.substring(0, 10)}..., Custom=${customAuth?.substring(0, 10)}...`)

        const userToken = customAuth ?? authHeader?.replace('Bearer ', '')

        if (!userToken) {
            throw new Error('Missing User Token')
        }

        // Initialize Admin Client
        // Note: SERVICE_ROLE_KEY must be set in Secrets!
        const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        if (!serviceRoleKey) {
            console.error("SERVICE_ROLE_KEY is missing!");
            throw new Error('Server Configuration Error: Key missing');
        }

        const adminSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Validate User
        const { data: { user }, error: userError } = await adminSupabase.auth.getUser(userToken)

        if (userError || !user) {
            console.error('User Validation Failed:', userError)
            throw new Error('Unauthorized: Invalid Token')
        }

        const REWARD_AMOUNT = 500;

        // 1. GET PROFILE & CHECK BALANCE
        let { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .maybeSingle()

        // Auto-create if missing
        if (!profile) {
            console.log(`Profile missing for ${user.id}, creating...`)
            const { data: newProfile, error: createError } = await adminSupabase
                .from('profiles')
                .insert({ id: user.id, credits: 1000 })
                .select('credits')
                .single()

            if (createError) throw new Error('Failed to create profile: ' + createError.message)
            profile = newProfile
        }

        if (!profile) throw new Error('Profile not found after creation attempt')

        // 2. UPDATE CREDITS
        const { data, error: updateError } = await adminSupabase
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
                reward: REWARD_AMOUNT,
                message: "Ad Reward Claimed!"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("Ad Reward Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 } // Return 400 so client sees body
        )
    }
})
