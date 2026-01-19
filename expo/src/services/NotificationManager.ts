import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Default Handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationManager = {
    registerForPushNotificationsAsync: async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        return true;
    },

    scheduleBonusNotification: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        const seconds = 24 * 60 * 60;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Daily Bonus Ready! 🎁",
                body: 'Your 1,000 coins are waiting for you inside.',
                sound: 'default'
            },
            trigger: {
                seconds: seconds,
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            },
        });
        console.log("Bonus Notification Scheduled for 24h");
    }
};
