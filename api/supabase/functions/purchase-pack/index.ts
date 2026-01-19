import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

interface PurchaseRequest {
    amount: number;
    productId: string;
    transactionId?: string;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const authHeader = req.headers.get('Authorization')
        const customAuth = req.headers.get('x-custom-auth')
        const userToken = customAuth ?? authHeader?.replace('Bearer ', '')

        if (!userToken) throw new Error('Missing User Token')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !serviceRoleKey) throw new Error('Server Configuration Error: URL or Key missing');

        const adminSupabase = createClient(
            supabaseUrl,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { data: { user }, error: userError } = await adminSupabase.auth.getUser(userToken)
        if (userError || !user) throw new Error('Unauthorized: Invalid Token')

        const requestData: PurchaseRequest = await req.json()
        const { amount, productId, transactionId } = requestData

        if (amount === undefined || !productId) throw new Error('Invalid request parameters')

        console.log(`Processing purchase: User=${user.id}, Product=${productId}, Amount=${amount}, Transaction=${transactionId}`)

        // 1. GET PROFILE
        const { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('credits, no_ads')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) throw new Error('Profile not found')

        // 2. PREPARE UPDATE DATA
        const isNoAds = productId.toLowerCase().includes('noads')
        const updateData: Record<string, any> = {
            credits: (profile.credits || 0) + amount
        }

        if (isNoAds) {
            updateData.no_ads = true
        }

        // 3. UPDATE PROFILE
        const { data: updatedProfile, error: updateError } = await adminSupabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({
                success: true,
                newBalance: updatedProfile.credits,
                message: "Purchase processed successfully!"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error("Purchase Error:", error)
        return new Response(
            JSON.stringify({ error: error.message || String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
