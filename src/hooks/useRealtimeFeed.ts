import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface NewsItem {
    id: string;
    username: string;
    amount: number;
    game: 'Roulette';
}

export const useRealtimeFeed = () => {
    const [news, setNews] = useState<NewsItem[]>([]);

    useEffect(() => {
        // Subscribe to High Wins
        const channel = supabase
            .channel('public:bet_history')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bet_history',
                    filter: 'total_win=gt.500' // Only wins > 500
                },
                async (payload) => {
                    const newWin = payload.new;

                    // Fetch Username
                    // Since payload only has user_id, we need a quick look up.
                    // Ideally, we'd have a trigger populate a public log table with usernames,
                    // but for now, we'll fetch it.
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', newWin.user_id)
                        .single();

                    const username = profile?.username || 'Anonymous';

                    const newItem: NewsItem = {
                        id: newWin.id,
                        username: username,
                        amount: newWin.total_win,
                        game: 'Roulette'
                    };

                    setNews((prev) => [newItem, ...prev].slice(0, 5)); // Keep last 5
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return news;
};
