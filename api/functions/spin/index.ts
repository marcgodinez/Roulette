import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PAYOUTS, isRed, getColumn, getDozen } from '../../_shared/gameRules.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("----- SPIN FUNCTION STARTED -----");
        // Hybrid Auth Check
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

        const { bets } = await req.json()
        console.log(`Bets received: ${JSON.stringify(bets)}`);
        const totalBetAmount = Object.values(bets as Record<string, number>).reduce((a, b) => a + b, 0);
        console.log(`Total Bet: ${totalBetAmount}`);

        // 1. GET PROFILE & CHECK BALANCE
        console.log("Fetching Profile via Admin Client...");
        let { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            console.error("Profile Fetch Error:", profileError);
        }

        // Auto-create if missing
        if (!profile) {
            console.log("Profile missing, attempting creation...");
            const { data: newProfile, error: createError } = await adminSupabase
                .from('profiles')
                .insert({ id: user.id, credits: 1000 })
                .select('credits')
                .single()

            if (createError) {
                console.error("Profile Creation Failed:", createError);
                throw new Error('Failed to create profile: ' + createError.message)
            }
            profile = newProfile
            console.log("Profile Created Successfully");
        } else {
            console.log(`Profile found. Credits: ${profile.credits}`);
        }

        if (!profile) {
            console.error("Critical: Profile is still null after attempts");
            const debugInfo = {
                serviceKeyAvailable: !!serviceKey,
                userId: user.id,
                fetchError: profileError,
                createError: 'Review logs' // simplified
            };
            throw new Error(`Profile not found. Debug: ${JSON.stringify(debugInfo)}`)
        }

        if (totalBetAmount > profile.credits) {
            console.warn(`Insufficient funds. Bet: ${totalBetAmount}, Credits: ${profile.credits}`);
            return new Response(
                JSON.stringify({ error: 'Insufficient funds' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 2. RNG GENERATION
        const winningNumber = Math.floor(Math.random() * 37);
        console.log(`Winning Number: ${winningNumber}`);

        // FIRE NUMBERS RNG
        const fireCount = Math.floor(Math.random() * 4) + 1; // 1 to 4
        const fireNumbers: number[] = [];
        while (fireNumbers.length < fireCount) {
            const num = Math.floor(Math.random() * 37);
            if (!fireNumbers.includes(num)) fireNumbers.push(num);
        }
        const isFireHit = fireNumbers.includes(winningNumber);
        console.log(`Fire Numbers: ${fireNumbers}, Is Fire Hit: ${isFireHit}`);

        // 3. RESOLVE PAYOUTS
        let totalWin = 0;
        let bonusTriggered = false; // This variable is not used in the provided snippet, but kept for context
        let calculatedBonusStake = 0;
        console.log("Resolving Payouts...");

        Object.keys(bets).forEach(betId => {
            const amount = bets[betId];
            if (amount <= 0) return;

            let didWin = false;
            let multiplier = 0;
            let isInsideBet = false;
            let coverage = 1;
            console.log(`Processing bet: ${betId}, amount: ${amount}`);

            // 1. STRAIGHT UP (Single Number) "0", "1", "36"
            if (!isNaN(parseInt(betId)) && !betId.includes('_') && !isNaN(Number(betId))) {
                isInsideBet = true;
                coverage = 1;
                const betNum = parseInt(betId);
                if (betNum === winningNumber) {
                    didWin = true;
                    multiplier = PAYOUTS.STRAIGHT;
                    console.log(`  Straight Up win on ${betNum}`);
                }
            }
            // 2. SPLIT "SPLIT_1_2"
            else if (betId.startsWith('SPLIT')) {
                isInsideBet = true;
                coverage = 2;
                const parts = betId.split('_');
                const n1 = parseInt(parts[1]);
                const n2 = parseInt(parts[2]);
                if (winningNumber === n1 || winningNumber === n2) {
                    didWin = true;
                    multiplier = PAYOUTS.SPLIT;
                    console.log(`  Split win on ${n1}-${n2}`);
                }
            }
            // 3. CORNER "COR_1_2_4_5"
            else if (betId.startsWith('COR')) {
                isInsideBet = true;
                coverage = 4;
                const parts = betId.split('_').slice(1).map(n => parseInt(n));
                if (parts.includes(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.CORNER;
                    console.log(`  Corner win on ${parts.join('-')}`);
                }
            }
            // 4. COLORS
            else if (betId === 'RED') {
                if (isRed(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                    console.log(`  Red win`);
                }
            }
            else if (betId === 'BLACK') {
                if (winningNumber !== 0 && !isRed(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                    console.log(`  Black win`);
                }
            }
            // 5. EVEN/ODD
            else if (betId === 'EVEN') {
                if (winningNumber !== 0 && winningNumber % 2 === 0) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                    console.log(`  Even win`);
                }
            }
            else if (betId === 'ODD') {
                if (winningNumber !== 0 && winningNumber % 2 !== 0) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                    console.log(`  Odd win`);
                }
            }
            // 6. 19-36 / 1-18
            else if (betId === '1-18') {
                if (winningNumber >= 1 && winningNumber <= 18) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                    console.log(`  1-18 win`);
                }
            }
            else if (betId === '19-36') {
                if (winningNumber >= 19 && winningNumber <= 36) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                    console.log(`  19-36 win`);
                }
            }
            // 7. COLUMNS
            else if (betId.startsWith('COL')) {
                if (getColumn(winningNumber) === betId) {
                    didWin = true;
                    multiplier = PAYOUTS.COLUMN;
                    console.log(`  Column win on ${betId}`);
                }
            }
            // 8. DOZENS
            else if (betId.endsWith('12')) { // 1st12, 2nd12, 3rd12
                if (getDozen(winningNumber) === betId) {
                    didWin = true;
                    multiplier = PAYOUTS.DOZEN;
                    console.log(`  Dozen win on ${betId}`);
                }
            }
            // 9. LINE BETS "LINE_13_18"
            else if (betId.startsWith('LINE')) {
                const parts = betId.split('_'); // LINE, 13, 18
                if (parts.length === 3) {
                    const start = parseInt(parts[1]);
                    const end = parseInt(parts[2]);
                    if (winningNumber >= start && winningNumber <= end) {
                        didWin = true;
                        multiplier = PAYOUTS.LINE;
                        isInsideBet = true;
                        coverage = 6;
                        console.log(`  Line win on ${start}-${end}`);
                    }
                }
            }
            // 10. STREET BETS "STREET_1_3" or "STREET_0_2_3"
            else if (betId.startsWith('STREET')) {
                const parts = betId.split('_').slice(1).map(n => parseInt(n));
                if (parts.includes(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.STREET;
                    isInsideBet = true;
                    coverage = 3;
                    console.log(`  Street win on ${parts.join('-')}`);
                }
                // Range Fallback "STREET_1_3"
                else if (parts.length === 2 && (parts[1] - parts[0] === 2)) {
                    if (winningNumber >= parts[0] && winningNumber <= parts[1]) {
                        didWin = true;
                        multiplier = PAYOUTS.STREET;
                        isInsideBet = true;
                        coverage = 3;
                        console.log(`  Street win on range ${parts[0]}-${parts[1]}`);
                    }
                }
            }

            if (didWin) {
                // FIRE + INSIDE BET -> ACCUMULATE BONUS STAKE
                if (isFireHit && isInsideBet) {
                    calculatedBonusStake += (amount / coverage);
                    console.log(`  Fire hit + Inside Bet: Bonus Stake accumulated: ${calculatedBonusStake}`);
                }
                // STANDARD WIN
                else {
                    const winAmount = (amount * multiplier) + amount;
                    totalWin += winAmount;
                    console.log(`  Standard win: ${winAmount}, Total Win: ${totalWin}`);
                }
            }
        });

        // 4. UPDATE DB
        const newBalance = profile.credits - totalBetAmount + totalWin;
        console.log(`Calculated New Balance: ${newBalance}`);

        // Transaction? (Simplified update for now)
        console.log("Updating Profile...");
        const { error: updateError } = await adminSupabase.from('profiles').update({ credits: newBalance }).eq('id', user.id);
        if (updateError) console.error("Update Profile Error:", updateError);

        console.log("Inserting Bet History...");
        const { error: historyError } = await adminSupabase.from('bet_history').insert({
            user_id: user.id,
            winning_number: winningNumber,
            is_fire: isFireHit,
            total_bet: totalBetAmount,
            total_win: totalWin,
            bet_details: bets
        });
        if (historyError) console.error("History Insert Error:", historyError);

        console.log("Sending Success Response");
        return new Response(
            JSON.stringify({
                winningNumber,
                fireNumbers,
                totalWin,
                newBalance,
                bonusStake: calculatedBonusStake
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
