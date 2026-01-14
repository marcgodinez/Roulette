import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export const usePresence = () => {
    const { user } = useAuth();
    const [onlineCount, setOnlineCount] = useState(1);

    useEffect(() => {
        if (!user) return;

        const room = supabase.channel('global_presence');

        room
            .on('presence', { event: 'sync' }, () => {
                const state = room.presenceState();
                // Count unique user IDs (or just total connections)
                // state is { 'user_id': [ { presence_ref: ... } ] }
                const count = Object.keys(state).length;
                setOnlineCount(Math.max(1, count));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await room.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(room);
        };
    }, [user]);

    return onlineCount;
};
