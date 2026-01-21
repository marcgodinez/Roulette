import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationManager = {
    async registerForPushNotificationsAsync() {
        let token;
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return;
        }

        // Only needed if you want push notifications later
        // token = (await Notifications.getExpoPushTokenAsync()).data;
        // console.log(token);
    },

    async scheduleDailyBonus() {
        await Notifications.cancelAllScheduledNotificationsAsync();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Daily Bonus Ready! 💰",
                body: "Come back to claim your 1,000 free coins!",
                sound: 'default',
            },
            trigger: {
                hour: 12,
                minute: 0,
                repeats: true,
            } as any,
        });
    }
};
