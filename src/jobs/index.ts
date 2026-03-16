import { runReminderNotificationJob } from "./reminder-notification.job";

let reminderJobInterval: NodeJS.Timeout | null = null;

export function initJobs() {
    if (reminderJobInterval) {
        return;
    }

    runReminderNotificationJob().catch(() => { });

    reminderJobInterval = setInterval(() => {
        runReminderNotificationJob().catch(() => { });
    }, 60 * 60 * 1000);
}